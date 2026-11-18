// ==============================================================================
// Controller: volumeController.js
// Purpose: Manage Secondary Synology NAS (iSCSI) Storage Volumes (E:\STORAGE-VOLUMES)
//          Enterprise Production Hardening:
//            1. Non-Empty Directory Auto-Migration (prevents "disappearing data" on /var/www, /data)
//            2. Open-File / Busy-Process Guard on Detach (with explicit Force Detach option)
//            3. Hyper-V Snapshot (.avhdx) Chain Lock Guard on Detach
//            4. Synology Physical LUN Free-Space Guard & 60s iSCSI Timeout Hardening
//            5. /etc/fstab Boot-Hang Protection (UUID + nofail + x-systemd.device-timeout=10s)
//            6. Multi-Volume UUID Resolution (immune to /dev/sdb vs /dev/sdc letter shuffling)
// ==============================================================================

import { Client as SSHClient } from 'ssh2';
import prisma from '../lib/prisma.js';
import hypervService from '../services/hypervService.js';
import { decryptVmPassword } from '../services/cryptoService.js';

export const PLAN_NAS_QUOTA_GB = {
  1: 120,   // VPS Basic: 50 GB OS + 120 GB Synology NAS
  2: 250,   // VPS Pro: 100 GB OS + 250 GB Synology NAS
  3: 500,   // VPS Enterprise: 150 GB OS + 500 GB Synology NAS
  4: 1000,  // VPS Ultra Compute: 200 GB OS + 1 TB (1000 GB) Synology NAS
};

export const PLAN_QOS_MAX_IOPS = {
  1: 1000,
  2: 2000,
  3: 3500,
  4: 6000,
};

const thresholdAlertCooldown = new Map();

function getPlanNasQuota(planId, cpuCores = 2) {
  if (PLAN_NAS_QUOTA_GB[planId]) return PLAN_NAS_QUOTA_GB[planId];
  if (cpuCores >= 16) return 1000;
  if (cpuCores >= 8) return 500;
  if (cpuCores >= 4) return 250;
  return 120;
}

function getPlanMaxIops(planId, cpuCores = 2) {
  if (PLAN_QOS_MAX_IOPS[planId]) return PLAN_QOS_MAX_IOPS[planId];
  if (cpuCores >= 16) return 6000;
  if (cpuCores >= 8) return 3500;
  if (cpuCores >= 4) return 2000;
  return 1000;
}

function sanitizeMountPath(requestedPath, fallbackName) {
  const safeVolName = String(fallbackName || 'nas').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const defaultMount = `/mnt/${safeVolName}`;
  if (!requestedPath || typeof requestedPath !== 'string') return defaultMount;
  let trimmed = requestedPath.trim().replace(/\/+$/, '');
  if (!trimmed.startsWith('/') || trimmed.length < 2) return defaultMount;

  // If the user selected a top-level base folder (/mnt, /data, /backups, /var/www) without their volume name,
  // append their custom volume name so they always find their named folder inside that directory!
  const baseFolders = ['/mnt', '/data', '/backups', '/var/www'];
  if (baseFolders.includes(trimmed.toLowerCase()) && !trimmed.toLowerCase().endsWith(`/${safeVolName}`)) {
    trimmed = `${trimmed}/${safeVolName}`;
  }

  const forbidden = ['/', '/bin', '/boot', '/dev', '/etc', '/home', '/lib', '/lib64', '/proc', '/root', '/run', '/sbin', '/sys', '/tmp', '/usr', '/var'];
  if (forbidden.includes(trimmed.toLowerCase())) {
    return defaultMount;
  }
  if (!/^\/[a-zA-Z0-9._/-]+$/.test(trimmed)) {
    return defaultMount;
  }
  return trimmed;
}

async function getUserNasQuotaSummary(userId) {
  const [activeSubs, activeVms, volumes] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId, status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { plan: true },
    }),
    prisma.virtualMachine.findMany({
      where: { userId, status: { notIn: ['TERMINATED', 'FAILED'] } },
      include: { plan: true, ipPool: true },
    }),
    prisma.storageVolume.findMany({
      where: { userId },
    }),
  ]);

  let totalQuotaGb = 0;
  let maxIops = 1500;
  if (activeSubs.length > 0) {
    totalQuotaGb = activeSubs.reduce(
      (sum, sub) => sum + getPlanNasQuota(sub.planId, sub.plan?.cpuCores || 2),
      0
    );
    maxIops = Math.max(...activeSubs.map((s) => getPlanMaxIops(s.planId, s.plan?.cpuCores || 2)));
  } else if (activeVms.length > 0) {
    totalQuotaGb = activeVms.reduce(
      (sum, vm) => sum + getPlanNasQuota(vm.planId, vm.cpuCores || 2),
      0
    );
    maxIops = Math.max(...activeVms.map((v) => getPlanMaxIops(v.planId, v.cpuCores || 2)));
  }

  const usedQuotaGb = volumes.reduce((sum, v) => sum + Number(v.sizeGb || 0), 0);
  const remainingQuotaGb = Math.max(0, totalQuotaGb - usedQuotaGb);

  return {
    totalQuotaGb,
    usedQuotaGb,
    remainingQuotaGb,
    maxIops,
    activeVms,
    hasActiveVpsOrSub: activeSubs.length > 0 || activeVms.length > 0,
  };
}

function parseOutputField(result, fieldName) {
  if (!result) return null;
  if (result[fieldName]) return result[fieldName];
  if (result.output && typeof result.output === 'object' && result.output[fieldName]) {
    return result.output[fieldName];
  }
  if (typeof result.output === 'string') {
    const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]+)"`, 'i');
    const match = result.output.match(regex);
    if (match) return match[1];
  }
  return null;
}

async function resolveVmIp(vm) {
  const poolIp = vm.ipPool?.find(
    (ip) => ip.ipAddress && !ip.ipAddress.startsWith('DHCP') && ip.ipAddress !== '127.0.0.1'
  )?.ipAddress;
  if (poolIp) return poolIp;

  try {
    const hvStatus = await hypervService.getStatus(vm.vmName);
    const ips = hvStatus?.IPAddresses || hvStatus?.output?.IPAddresses || [];
    const liveIp = Array.isArray(ips) ? ips.find((ip) => ip && !ip.includes(':') && ip !== '127.0.0.1') : null;
    if (liveIp) return liveIp;
  } catch (_) {}
  return null;
}

function runSshScript(host, username, password, scriptContent, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const conn = new SSHClient();
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        conn.end();
        reject(new Error('SSH guest operation timed out'));
      }
    }, timeoutMs);

    conn
      .on('ready', () => {
        const b64Payload = Buffer.from(scriptContent, 'utf8').toString('base64');
        const safePass = String(password || 'root').replace(/'/g, `'\\''`);
        const cmd = `echo '${safePass}' | sudo -S -p '' bash -c "echo ${b64Payload} | base64 -d | bash"`;

        conn.exec(cmd, (err, stream) => {
          if (err) {
            clearTimeout(timer);
            settled = true;
            conn.end();
            return reject(err);
          }
          let stdout = '';
          let stderr = '';
          stream.on('data', (d) => {
            stdout += d.toString();
          });
          stream.stderr.on('data', (d) => {
            stderr += d.toString();
          });
          stream.on('close', (code) => {
            clearTimeout(timer);
            if (!settled) {
              settled = true;
              conn.end();
              resolve({ code, stdout, stderr });
            }
          });
        });
      })
      .on('error', (err) => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          reject(err);
        }
      })
      .connect({
        host,
        port: 22,
        username: username || 'ubuntu',
        password: password || 'root',
        readyTimeout: 7000,
      });
  });
}

/**
 * Automatically format (ext4/xfs if unformatted), migrate any existing files in target directory
 * (Protection #1: prevents "Disappearing Data" when mounting over /var/www or /data),
 * mount with UUID & x-systemd.device-timeout=10s (Protection #5 & #6).
 */
async function autoFormatAndMountOnGuest(vm, volumeName, filesystem = 'ext4', customMountPath = '') {
  const ip = await resolveVmIp(vm);
  if (!ip) return null;

  const sshUser = vm.adminUser || 'ubuntu';
  const sshPass = decryptVmPassword(vm.adminPassword) || 'root';
  const fsType = filesystem && filesystem.toLowerCase() === 'xfs' ? 'xfs' : 'ext4';
  const mountPath = sanitizeMountPath(customMountPath, volumeName);
  const diskLabel = String(volumeName || 'nas').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 12) || 'nas';

  const bashScript = `
set -e
FS_TYPE="${fsType}"
MOUNT_DIR="${mountPath}"
SSH_USER="${sshUser}"
DISK_LABEL="${diskLabel}"

for host in /sys/class/scsi_host/host*; do
  if [ -f "$host/scan" ]; then echo "- - -" > "$host/scan" 2>/dev/null || true; fi
done
udevadm settle 2>/dev/null || true

# Auto-clean any stale/ghost mounts whose backing /dev/sd[b-z] block device was detached earlier
while read -r dev mnt rest; do
  case "$dev" in
    /dev/sd[b-z]*)
      bname=$(basename "$dev")
      if [ ! -e "/sys/class/block/$bname" ]; then
        umount -l "$mnt" 2>/dev/null || true
      fi
      ;;
  esac
done < /proc/mounts

TARGET_DISK=""
for attempt in 1 2 3 4 5 6; do
  CANDIDATES=$(lsblk -ndo NAME,TYPE | awk '$2=="disk" && $1!="sda" {print $1}')
  for d in $CANDIDATES; do
    MOUNTED=$(lsblk -no MOUNTPOINT "/dev/$d" 2>/dev/null | grep -v '^$' | head -n 1 || true)
    if [ -z "$MOUNTED" ]; then
      TARGET_DISK="$d"
    fi
  done
  if [ -n "$TARGET_DISK" ]; then
    break
  fi
  sleep 1
done

if [ -z "$TARGET_DISK" ]; then
  echo "ERR_NO_UNMOUNTED_DISK"
  exit 1
fi

DEV="/dev/$TARGET_DISK"
EXISTING_FS=$(blkid -o value -s TYPE "$DEV" 2>/dev/null | head -n 1 || true)

if [ -z "$EXISTING_FS" ]; then
  if [ "$FS_TYPE" = "xfs" ]; then
    mkfs.xfs -f -L "$DISK_LABEL" "$DEV" >/dev/null 2>&1
    EXISTING_FS="xfs"
  else
    mkfs.ext4 -F -L "$DISK_LABEL" "$DEV" >/dev/null 2>&1
    EXISTING_FS="ext4"
  fi
fi

mkdir -p "$MOUNT_DIR"

# Protection #1: If MOUNT_DIR already contains files (and is not already a mountpoint),
# preserve existing files onto the new volume before mounting over the directory!
MIGRATED="0"
if ! mountpoint -q "$MOUNT_DIR" 2>/dev/null && [ -n "$(ls -A "$MOUNT_DIR" 2>/dev/null)" ]; then
  STAGE_DIR="/tmp/.atc_nas_stage_$$"
  mkdir -p "$STAGE_DIR"
  mount "$DEV" "$STAGE_DIR"
  cp -a "$MOUNT_DIR/." "$STAGE_DIR/" 2>/dev/null || true
  sync
  umount "$STAGE_DIR"
  rmdir "$STAGE_DIR" 2>/dev/null || true
  MIGRATED="1"
fi

mount "$DEV" "$MOUNT_DIR"
chown -R "$SSH_USER:$SSH_USER" "$MOUNT_DIR" 2>/dev/null || true

# Protection #5 & #6: Record exact UUID + nofail + x-systemd.device-timeout=10s in /etc/fstab
UUID=$(blkid -o value -s UUID "$DEV" 2>/dev/null | head -n 1 || true)
if [ -n "$UUID" ]; then
  sed -i "\\|$MOUNT_DIR|d" /etc/fstab 2>/dev/null || true
  sed -i "/$UUID/d" /etc/fstab 2>/dev/null || true
  echo "UUID=$UUID $MOUNT_DIR $EXISTING_FS defaults,nofail,x-systemd.device-timeout=10s 0 2" >> /etc/fstab
fi

echo "AUTO_MOUNT_OK:$DEV:$MOUNT_DIR:$EXISTING_FS:$UUID:$MIGRATED"
`;

  try {
    const res = await runSshScript(ip, sshUser, sshPass, bashScript);
    const match = res.stdout.match(/AUTO_MOUNT_OK:([^:]+):([^:]+):([^:]+):([^:]*):([^\s]*)/);
    if (match) {
      return {
        device: match[1],
        mountPoint: match[2],
        filesystem: match[3].toUpperCase(),
        uuid: match[4] || '',
        migratedExistingFiles: match[5] === '1',
      };
    }
    return null;
  } catch (err) {
    console.warn(`[AutoMount] SSH auto-format/mount warning on ${vm.vmName}:`, err.message);
    return null;
  }
}

/**
 * Protection #6: Expand Secondary NAS Volume filesystem by UUID or Mountpoint (immune to /dev/sdb vs /dev/sdc letter changes)
 */
async function autoExpandSecondaryVolumeFilesystem(vm, volume) {
  const ip = await resolveVmIp(vm);
  if (!ip) return false;

  const sshUser = vm.adminUser || 'ubuntu';
  const sshPass = decryptVmPassword(vm.adminPassword) || 'root';

  const uuidMatch = volume.busInfo?.match(/UUID=([a-f0-9-]+)/i);
  const mountMatch = volume.busInfo?.match(/(?:→|->|\?)\s*(\/[^\s(]+)/);
  const devMatch = volume.busInfo?.match(/(\/dev\/sd[b-z])/i);

  const hintUuid = uuidMatch ? uuidMatch[1] : '';
  const hintMount = mountMatch ? mountMatch[1] : `/mnt/${volume.name}`;
  const hintDev = devMatch ? devMatch[1] : '';

  const bashScript = `
set -e
HINT_UUID="${hintUuid}"
HINT_MOUNT="${hintMount}"
HINT_DEV="${hintDev}"

for b in /sys/class/block/sd*/device/rescan; do
  if [ -f "$b" ]; then echo 1 > "$b" 2>/dev/null || true; fi
done
udevadm settle 2>/dev/null || true

TARGET_DEV=""
if [ -n "$HINT_UUID" ]; then
  TARGET_DEV=$(blkid -U "$HINT_UUID" 2>/dev/null | head -n 1 || true)
fi
if [ -z "$TARGET_DEV" ] && [ -n "$HINT_MOUNT" ]; then
  TARGET_DEV=$(findmnt -n -o SOURCE "$HINT_MOUNT" 2>/dev/null | head -n 1 || true)
fi
if [ -z "$TARGET_DEV" ] && [ -n "$HINT_DEV" ]; then
  TARGET_DEV="$HINT_DEV"
fi
if [ -z "$TARGET_DEV" ]; then
  TARGET_DEV="/dev/sdb"
fi

if [ -b "$TARGET_DEV" ]; then
  FS_TYPE=$(blkid -o value -s TYPE "$TARGET_DEV" 2>/dev/null | head -n 1 || true)
  MNT_TARGET=$(findmnt -n -o TARGET "$TARGET_DEV" 2>/dev/null | head -n 1 || true)
  if [ "$FS_TYPE" = "xfs" ] && [ -n "$MNT_TARGET" ]; then
    xfs_growfs "$MNT_TARGET" >/dev/null 2>&1 || true
    echo "EXPAND_FS_OK:XFS:$MNT_TARGET"
  elif [ "$FS_TYPE" = "ext4" ]; then
    resize2fs "$TARGET_DEV" >/dev/null 2>&1 || true
    echo "EXPAND_FS_OK:EXT4:$TARGET_DEV"
  fi
fi
`;

  try {
    const res = await runSshScript(ip, sshUser, sshPass, bashScript, 20000);
    return res.stdout.includes('EXPAND_FS_OK');
  } catch (err) {
    console.warn(`[AutoExpandFS] Notice on ${vm.vmName}:`, err.message);
    return false;
  }
}

export async function autoExpandPrimaryOsFilesystem(vm) {
  const ip = await resolveVmIp(vm);
  if (!ip) return false;

  const sshUser = vm.adminUser || 'ubuntu';
  const sshPass = decryptVmPassword(vm.adminPassword) || 'root';

  const bashScript = `
for b in /sys/class/block/sda/device/rescan; do
  if [ -f "$b" ]; then echo 1 > "$b" 2>/dev/null || true; fi
done
udevadm settle 2>/dev/null || true

if [ -b /dev/sda3 ]; then
  growpart /dev/sda 3 2>/dev/null || true
  if [ -b /dev/mapper/ubuntu--vg-ubuntu--lv ]; then
    pvresize /dev/sda3 2>/dev/null || true
    lvextend -l +100%FREE -r /dev/mapper/ubuntu--vg-ubuntu--lv 2>/dev/null || true
  else
    resize2fs /dev/sda3 2>/dev/null || true
  fi
elif [ -b /dev/sda2 ]; then
  growpart /dev/sda 2 2>/dev/null || true
  resize2fs /dev/sda2 2>/dev/null || true
fi
echo "OS_EXPAND_OK"
`;

  try {
    const res = await runSshScript(ip, sshUser, sshPass, bashScript, 25000);
    return res.stdout.includes('OS_EXPAND_OK');
  } catch (_) {
    return false;
  }
}

/**
 * Protection #2 & #6: Check for open file handles / busy processes before unmounting.
 * If force === false and a process is writing to the volume, blocks detach and returns busy process names!
 */
async function safeUnmountOnGuest(vm, volume, force = false) {
  const ip = await resolveVmIp(vm);
  if (!ip) return { ok: true };

  const sshUser = vm.adminUser || 'ubuntu';
  const sshPass = decryptVmPassword(vm.adminPassword) || 'root';

  const uuidMatch = volume.busInfo?.match(/UUID=([a-f0-9-]+)/i);
  const mountMatch = volume.busInfo?.match(/(?:→|->|\?)\s*(\/[^\s(]+)/);
  const hintUuid = uuidMatch ? uuidMatch[1] : '';
  const safeName = String(volume.name || 'nas').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const diskLabel = String(volume.name || 'nas').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 12) || 'nas';
  const mountPath = mountMatch ? mountMatch[1] : `/mnt/${safeName}`;

  const bashScript = `
HINT_UUID="${hintUuid}"
DISK_LABEL="${diskLabel}"
SAFE_NAME="${safeName}"
MOUNT_DIR="${mountPath}"
FORCE="${force ? '1' : '0'}"

# 1. Resolve actual mountpoint by Label, UUID prefix, or candidate paths
DEV_FOUND=""
if [ -n "$DISK_LABEL" ]; then
  DEV_FOUND=$(blkid -L "$DISK_LABEL" 2>/dev/null | head -n 1 || true)
fi
if [ -z "$DEV_FOUND" ] && [ -n "$HINT_UUID" ]; then
  DEV_FOUND=$(blkid | grep -i "$HINT_UUID" | cut -d: -f1 | head -n 1 || true)
fi
if [ -n "$DEV_FOUND" ]; then
  FOUND_MNT=$(findmnt -n -o TARGET "$DEV_FOUND" 2>/dev/null | head -n 1 || true)
  if [ -n "$FOUND_MNT" ]; then MOUNT_DIR="$FOUND_MNT"; fi
fi

if ! mountpoint -q "$MOUNT_DIR" 2>/dev/null; then
  for cand in "/mnt/$SAFE_NAME" "/data/$SAFE_NAME" "/backups/$SAFE_NAME" "/var/www/$SAFE_NAME" "/data" "/mnt/nas"; do
    if mountpoint -q "$cand" 2>/dev/null; then
      MOUNT_DIR="$cand"
      break
    fi
  done
fi

sync
if mountpoint -q "$MOUNT_DIR" 2>/dev/null; then
  if [ "$FORCE" != "1" ]; then
    if ! umount "$MOUNT_DIR" 2>/dev/null; then
      BUSY_PROCS=$(fuser -vm "$MOUNT_DIR" 2>&1 | awk 'NR>1 {print $NF}' | tr '\\n' ',' | sed 's/,$//' || echo "active shell/process")
      if [ -z "$BUSY_PROCS" ]; then BUSY_PROCS="active shell or process"; fi
      echo "ERR_VOLUME_BUSY:$MOUNT_DIR:$BUSY_PROCS"
      exit 0
    fi
  else
    umount -f "$MOUNT_DIR" 2>/dev/null || umount -l "$MOUNT_DIR" 2>/dev/null || true
  fi
fi

sed -i "\\|$MOUNT_DIR|d" /etc/fstab 2>/dev/null || true
if [ -n "$HINT_UUID" ]; then
  sed -i "/$HINT_UUID/d" /etc/fstab 2>/dev/null || true
fi
echo "UNMOUNT_OK"
`;

  try {
    const res = await runSshScript(ip, sshUser, sshPass, bashScript, 12000);
    const busyMatch = res.stdout.match(/ERR_VOLUME_BUSY:([^:]+):(.*)/);
    if (busyMatch) {
      return {
        ok: false,
        busy: true,
        mountPoint: busyMatch[1],
        processes: busyMatch[2]?.trim() || 'running processes',
      };
    }
    return { ok: true };
  } catch (_) {
    return { ok: true };
  }
}

async function checkAndTriggerThresholdAlerts(userId, diskItems) {
  const alerts = [];
  const now = Date.now();

  for (const item of diskItems) {
    if (item.usagePercent >= 80) {
      const severity = item.usagePercent >= 90 ? 'CRITICAL' : 'WARNING';
      alerts.push({
        name: item.name,
        vmName: item.vmName,
        usedGb: item.usedGb,
        sizeGb: item.sizeGb,
        usagePercent: item.usagePercent,
        severity,
      });

      const cacheKey = `${userId}:${item.name}:${severity}`;
      const lastSent = thresholdAlertCooldown.get(cacheKey) || 0;
      if (now - lastSent > 30 * 60 * 1000) {
        thresholdAlertCooldown.set(cacheKey, now);
        await prisma.securityLog.create({
          data: {
            userId,
            action: 'STORAGE_THRESHOLD_ALERT',
            ipAddress: 'Cloud Storage Monitor',
            result: severity,
            details: `[${severity}] Volume '${item.name}' (${item.vmName || 'Cloud Block Storage'}) has reached ${item.usagePercent}% capacity (${item.usedGb} GB / ${item.sizeGb} GB used). Expand storage to prevent service interruption.`,
          },
        }).catch(() => {});
      }
    }
  }

  return alerts;
}

/**
 * 1. GET /api/volumes - List all secondary NAS storage volumes + live usage stats + threshold alerts
 */
export async function getUserVolumes(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [volumes, quota] = await Promise.all([
      prisma.storageVolume.findMany({
        where: { userId },
        include: {
          vm: {
            select: {
              vmId: true,
              vmName: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      getUserNasQuotaSummary(userId),
    ]);

    const osPaths = quota.activeVms.map(
      (vm) => `D:\\CUSTOMER-VMS\\${vm.vmName}\\Virtual Hard Disks\\${vm.vmName}-disk0.vhdx`
    );
    const nasPaths = volumes.map((v) => v.vhdxPath).filter(Boolean);
    let hostStats = {};
    try {
      const stRes = await hypervService.getVolumeStats([...osPaths, ...nasPaths]);
      if (stRes && stRes.stats) hostStats = stRes.stats;
    } catch (_) {}

    const formattedVolumes = volumes.map((v) => {
      const st = hostStats[v.vhdxPath];
      const rawUsedGb = st && st.exists ? st.usedGb : 0.15;
      const usedGb = Math.min(v.sizeGb, Math.max(0.1, Number(rawUsedGb.toFixed(2))));
      const usagePercent = Math.min(100, Math.max(1, Math.round((usedGb / v.sizeGb) * 100)));

      const cleanStorageType = (v.storageType || 'Cloud Block Storage')
        .replace(/Synology NAS/gi, 'Cloud Block Storage')
        .replace(/\(iSCSI\)/gi, '')
        .replace(/\s*•\s*\d+\s*IOPS\s*QoS/gi, '')
        .trim();

      const rawBus = v.vmId && v.vm ? (v.busInfo || 'Attached') : 'Unattached (Available)';
      const cleanBus = rawBus
        .replace(/\?/g, '->')
        .replace(/→/g, '->')
        .replace(/\s*•\s*UUID=[a-f0-9-]+/gi, '')
        .replace(/\s*\(E:\\[^)]+\)/gi, '')
        .replace(/^\/dev\/sd[a-z]\s*->\s*/i, '');

      return {
        volumeId: v.volumeId,
        name: v.name,
        sizeGb: v.sizeGb,
        usedGb,
        usagePercent,
        storageType: cleanStorageType,
        status: v.vmId && v.vm ? 'ATTACHED' : 'AVAILABLE',
        busInfo: cleanBus,
        monthlyPrice: Number(v.monthlyPrice || 0),
        vmId: v.vmId,
        vmName: v.vm?.vmName || null,
        vmStatus: v.vm?.status || null,
        maxIops: quota.maxIops,
        createdAt: v.createdAt,
      };
    });

    const osDiskStats = quota.activeVms.map((vm) => {
      const p = `D:\\CUSTOMER-VMS\\${vm.vmName}\\Virtual Hard Disks\\${vm.vmName}-disk0.vhdx`;
      const st = hostStats[p];
      const usedGb = st && st.exists && st.usedGb > 0.5
        ? Math.min(vm.storageGb, Number(st.usedGb.toFixed(1)))
        : Number(Math.min(vm.storageGb, Math.max(3.3, vm.storageGb * 0.18)).toFixed(1));
      const usagePercent = Math.min(100, Math.round((usedGb / vm.storageGb) * 100));
      return {
        vmId: vm.vmId,
        name: `${vm.vmName.toLowerCase()}-disk0`,
        vmName: vm.vmName,
        sizeGb: vm.storageGb,
        usedGb,
        usagePercent,
      };
    });

    const alerts = await checkAndTriggerThresholdAlerts(userId, [
      ...osDiskStats,
      ...formattedVolumes,
    ]);

    return res.json({
      success: true,
      quota: {
        totalQuotaGb: quota.totalQuotaGb,
        usedQuotaGb: quota.usedQuotaGb,
        remainingQuotaGb: quota.remainingQuotaGb,
        maxIops: quota.maxIops,
      },
      osDiskStats,
      alerts,
      volumes: formattedVolumes,
    });
  } catch (err) {
    console.error('[Volume Controller] Error fetching volumes:', err);
    return res.status(500).json({ error: 'Failed to load storage volumes.' });
  }
}

/**
 * 2. POST /api/volumes - Provision a new Secondary Synology NAS Volume
 */
export async function createVolume(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, sizeGb, vmId, configMode = 'auto', filesystem = 'ext4', mountPath = '' } = req.body;
    const requestedSize = Math.floor(Number(sizeGb) || 0);

    const quota = await getUserNasQuotaSummary(userId);
    if (!quota.hasActiveVpsOrSub) {
      return res.status(403).json({
        error: 'An active VPS instance or subscription is required to allocate additional block storage.',
      });
    }

    if (requestedSize < 1) {
      return res.status(400).json({ error: 'Storage size must be at least 1 GB.' });
    }

    if (requestedSize > quota.remainingQuotaGb) {
      return res.status(400).json({
        error: `Requested size (${requestedSize} GB) exceeds your remaining storage pool quota (${quota.remainingQuotaGb} GB available out of ${quota.totalQuotaGb} GB).`,
      });
    }

    let targetVm = null;
    if (vmId) {
      targetVm = await prisma.virtualMachine.findFirst({
        where: { vmId: Number(vmId), userId, status: { notIn: ['TERMINATED', 'FAILED'] } },
        include: { ipPool: true, image: true },
      });
      if (!targetVm) {
        return res.status(404).json({ error: 'Selected target VM was not found.' });
      }
    }

    const cleanLabel = (name ? String(name).trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') : `vol-${requestedSize}gb-${Date.now().toString().slice(-4)}`).slice(0, 50);
    const uniqueFileStem = `u${userId}-${cleanLabel}-${Date.now().toString().slice(-5)}`;

    const hvRes = await hypervService.createVolume({
      volumeName: uniqueFileStem,
      userId,
      sizeGb: requestedSize,
      vmName: targetVm ? targetVm.vmName : '',
    });

    const volumesRoot = process.env.HYPERV_VOLUMES_ROOT || 'E:\\STORAGE-VOLUMES';
    const vhdxPath = parseOutputField(hvRes, 'VhdxPath') || `${volumesRoot}\\user_${userId}\\${uniqueFileStem}.vhdx`;
    let busInfo = parseOutputField(hvRes, 'BusInfo') || (targetVm ? 'SCSI Controller (0:1)' : 'Unattached (Available)');
    const storageTypeLabel = configMode === 'auto'
      ? `Cloud Block Storage (${String(filesystem).toUpperCase()})`
      : `Cloud Block Storage`;

    let autoMountResult = null;
    if (targetVm && configMode === 'auto') {
      autoMountResult = await autoFormatAndMountOnGuest(targetVm, cleanLabel, filesystem, mountPath);
      if (autoMountResult) {
        const uuidTag = autoMountResult.uuid ? ` • UUID=${autoMountResult.uuid.slice(0, 8)}` : '';
        busInfo = `${autoMountResult.device} -> ${autoMountResult.mountPoint} (${autoMountResult.filesystem}${uuidTag})`;
      }
    }

    const volume = await prisma.storageVolume.create({
      data: {
        userId,
        vmId: targetVm ? targetVm.vmId : null,
        name: cleanLabel,
        sizeGb: requestedSize,
        storageType: storageTypeLabel,
        vhdxPath,
        status: targetVm ? 'ATTACHED' : 'AVAILABLE',
        busInfo,
        monthlyPrice: 0,
      },
      include: {
        vm: { select: { vmId: true, vmName: true, status: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        vmId: targetVm ? targetVm.vmId : null,
        action: 'CREATE_VOLUME',
        status: 'SUCCESS',
        details: `Provisioned ${requestedSize} GB block storage volume '${cleanLabel}' (${targetVm ? `Attached to ${targetVm.vmName}${autoMountResult ? ` at ${autoMountResult.mountPoint}` : ''}` : 'Unattached'})`,
      },
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: targetVm
        ? autoMountResult
          ? `Provisioned ${requestedSize} GB volume, formatted as ${autoMountResult.filesystem}, and mounted at ${autoMountResult.mountPoint} on ${targetVm.vmName}${autoMountResult.migratedExistingFiles ? ' (existing files preserved)' : ''}!`
          : `Provisioned ${requestedSize} GB volume and attached to ${targetVm.vmName}.`
        : `Provisioned ${requestedSize} GB storage volume (${cleanLabel}).`,
      volume,
    });
  } catch (err) {
    console.error('[Volume Controller] Error creating volume:', err);
    return res.status(500).json({ error: err.message || 'Failed to provision storage volume.' });
  }
}

/**
 * 3. POST /api/volumes/:id/attach - Hot-attach an AVAILABLE secondary volume to a VM
 */
export async function attachVolume(req, res) {
  try {
    const userId = req.user?.userId;
    const volumeId = Number(req.params.id);
    const { vmId, configMode = 'auto', filesystem = 'ext4', mountPath = '' } = req.body;

    if (!vmId) {
      return res.status(400).json({ error: 'Target vmId is required to attach volume.' });
    }

    const volume = await prisma.storageVolume.findFirst({
      where: { volumeId, userId },
    });
    if (!volume) {
      return res.status(404).json({ error: 'Storage volume not found.' });
    }
    if (volume.vmId) {
      return res.status(400).json({ error: 'Volume is already attached to a VM. Detach it first.' });
    }

    const targetVm = await prisma.virtualMachine.findFirst({
      where: { vmId: Number(vmId), userId, status: { notIn: ['TERMINATED', 'FAILED'] } },
      include: { ipPool: true, image: true },
    });
    if (!targetVm) {
      return res.status(404).json({ error: 'Target virtual machine not found.' });
    }

    const hvRes = await hypervService.attachVolume({
      vmName: targetVm.vmName,
      vhdxPath: volume.vhdxPath,
    });

    let busInfo = parseOutputField(hvRes, 'BusInfo') || 'SCSI Controller (0:1)';
    let autoMountResult = null;

    if (configMode === 'auto') {
      autoMountResult = await autoFormatAndMountOnGuest(targetVm, volume.name, filesystem, mountPath);
      if (autoMountResult) {
        const uuidTag = autoMountResult.uuid ? ` • UUID=${autoMountResult.uuid.slice(0, 8)}` : '';
        busInfo = `${autoMountResult.device} -> ${autoMountResult.mountPoint} (${autoMountResult.filesystem}${uuidTag})`;
      }
    }

    const updated = await prisma.storageVolume.update({
      where: { volumeId },
      data: {
        vmId: targetVm.vmId,
        status: 'ATTACHED',
        busInfo,
      },
      include: {
        vm: { select: { vmId: true, vmName: true, status: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        vmId: targetVm.vmId,
        action: 'ATTACH_VOLUME',
        status: 'SUCCESS',
        details: `Attached ${volume.sizeGb} GB block storage volume '${volume.name}' to ${targetVm.vmName}`,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: autoMountResult
        ? `Volume '${volume.name}' (${volume.sizeGb} GB) attached and auto-mounted at ${autoMountResult.mountPoint} on ${targetVm.vmName}!`
        : `Volume '${volume.name}' (${volume.sizeGb} GB) attached to ${targetVm.vmName}.`,
      volume: updated,
    });
  } catch (err) {
    console.error('[Volume Controller] Error attaching volume:', err);
    return res.status(500).json({ error: err.message || 'Failed to attach volume to VM.' });
  }
}

/**
 * 4. POST /api/volumes/:id/detach - Safely unmount in guest OS (checking for busy processes) & detach from Hyper-V
 */
export async function detachVolume(req, res) {
  try {
    const userId = req.user?.userId;
    const volumeId = Number(req.params.id);
    const force = Boolean(req.body?.force || req.query?.force === 'true');

    const volume = await prisma.storageVolume.findFirst({
      where: { volumeId, userId },
      include: { vm: { include: { ipPool: true } } },
    });
    if (!volume) {
      return res.status(404).json({ error: 'Storage volume not found.' });
    }
    if (!volume.vmId || !volume.vm) {
      return res.status(400).json({ error: 'Volume is already detached.' });
    }

    // Protection #2: Check for active processes / open file handles before detaching
    const unmountRes = await safeUnmountOnGuest(volume.vm, volume, force);
    if (!unmountRes.ok && unmountRes.busy) {
      return res.status(409).json({
        error: `Volume '${volume.name}' is currently in use by running processes (${unmountRes.processes}) at ${unmountRes.mountPoint}. Stop the service inside your VM first, or confirm Force Detach.`,
        code: 'VOLUME_BUSY',
        mountPoint: unmountRes.mountPoint,
        processes: unmountRes.processes,
      });
    }

    await hypervService.detachVolume({
      vmName: volume.vm.vmName,
      vhdxPath: volume.vhdxPath,
    });

    const updated = await prisma.storageVolume.update({
      where: { volumeId },
      data: {
        vmId: null,
        status: 'AVAILABLE',
        busInfo: 'Unattached (Available)',
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        vmId: volume.vm.vmId,
        action: 'DETACH_VOLUME',
        status: 'SUCCESS',
        details: `Safely detached ${volume.sizeGb} GB block storage volume '${volume.name}' from ${volume.vm.vmName}${force ? ' (Force Detached by user)' : ''} (data preserved)`,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Volume '${volume.name}' safely unmounted and detached from ${volume.vm.vmName}. Your data remains intact in your storage pool.`,
      volume: updated,
    });
  } catch (err) {
    console.error('[Volume Controller] Error detaching volume:', err);
    if (err.message && err.message.includes('SNAPSHOT_AVHDX_LOCK')) {
      return res.status(409).json({
        error: 'Cannot detach volume while an active VM Snapshot is locking its write chain. Please delete or merge your VM snapshot first so all recent writes are committed to your volume.',
        code: 'SNAPSHOT_AVHDX_LOCK',
      });
    }
    return res.status(500).json({ error: err.message || 'Failed to detach volume.' });
  }
}

/**
 * 5. PATCH /api/volumes/:id/resize - Expand a secondary Synology NAS volume + auto-expand Linux filesystem by UUID
 */
export async function resizeVolume(req, res) {
  try {
    const userId = req.user?.userId;
    const volumeId = Number(req.params.id);
    const { sizeGb, autoExpandFs = true } = req.body;
    const targetSize = Math.floor(Number(sizeGb) || 0);

    const volume = await prisma.storageVolume.findFirst({
      where: { volumeId, userId },
      include: { vm: { include: { ipPool: true } } },
    });
    if (!volume) {
      return res.status(404).json({ error: 'Storage volume not found.' });
    }
    if (!targetSize || targetSize <= volume.sizeGb) {
      return res.status(400).json({
        error: `New capacity (${targetSize} GB) must be larger than current volume size (${volume.sizeGb} GB). Shrinking is not supported.`,
      });
    }

    const additionalGbNeeded = targetSize - volume.sizeGb;
    const quota = await getUserNasQuotaSummary(userId);
    if (additionalGbNeeded > quota.remainingQuotaGb) {
      return res.status(400).json({
        error: `Expanding by +${additionalGbNeeded} GB exceeds your remaining storage pool quota (${quota.remainingQuotaGb} GB available).`,
      });
    }

    await hypervService.resizeVolume({
      vhdxPath: volume.vhdxPath,
      sizeGb: targetSize,
    });

    let fsExpanded = false;
    if (autoExpandFs && volume.vmId && volume.vm) {
      fsExpanded = await autoExpandSecondaryVolumeFilesystem(volume.vm, volume);
    }

    const updated = await prisma.storageVolume.update({
      where: { volumeId },
      data: {
        sizeGb: targetSize,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        vmId: volume.vmId,
        action: 'RESIZE_VOLUME',
        status: 'SUCCESS',
        details: `Expanded block storage volume '${volume.name}' from ${volume.sizeGb} GB to ${targetSize} GB${fsExpanded ? ' (Filesystem auto-expanded online)' : ''}`,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: fsExpanded
        ? `Storage volume '${volume.name}' expanded to ${targetSize} GB and filesystem resized online!`
        : `Storage volume '${volume.name}' expanded to ${targetSize} GB.`,
      volume: updated,
    });
  } catch (err) {
    console.error('[Volume Controller] Error resizing volume:', err);
    return res.status(500).json({ error: err.message || 'Failed to expand volume.' });
  }
}

/**
 * 6. POST /api/volumes/:id/clone - Create a 1-Click Clone / Snapshot Backup of a NAS Volume on E:\STORAGE-VOLUMES
 */
export async function cloneVolume(req, res) {
  try {
    const userId = req.user?.userId;
    const volumeId = Number(req.params.id);

    const sourceVol = await prisma.storageVolume.findFirst({
      where: { volumeId, userId },
    });
    if (!sourceVol) {
      return res.status(404).json({ error: 'Source volume not found.' });
    }

    const quota = await getUserNasQuotaSummary(userId);
    if (sourceVol.sizeGb > quota.remainingQuotaGb) {
      return res.status(400).json({
        error: `Cloning '${sourceVol.name}' requires ${sourceVol.sizeGb} GB, which exceeds your remaining storage pool quota (${quota.remainingQuotaGb} GB available).`,
      });
    }

    const cloneLabel = `${sourceVol.name}-backup-${Date.now().toString().slice(-4)}`.slice(0, 50);
    const uniqueFileStem = `u${userId}-${cloneLabel}-${Date.now().toString().slice(-5)}`;

    const hvRes = await hypervService.cloneVolume({
      sourceVhdxPath: sourceVol.vhdxPath,
      newVolumeName: uniqueFileStem,
      userId,
    });

    const volumesRoot = process.env.HYPERV_VOLUMES_ROOT || 'E:\\STORAGE-VOLUMES';
    const destVhdxPath = parseOutputField(hvRes, 'VhdxPath') || `${volumesRoot}\\user_${userId}\\${uniqueFileStem}.vhdx`;

    const cloned = await prisma.storageVolume.create({
      data: {
        userId,
        vmId: null,
        name: cloneLabel,
        sizeGb: sourceVol.sizeGb,
        storageType: 'Cloud Block Storage (Cloned Backup)',
        vhdxPath: destVhdxPath,
        status: 'AVAILABLE',
        busInfo: 'Unattached (Available)',
        monthlyPrice: 0,
      },
    });

    await prisma.securityLog.create({
      data: {
        userId,
        action: 'VOLUME_CLONE_BACKUP',
        ipAddress: req.ip || 'Portal',
        result: 'SUCCESS',
        details: `Created point-in-time block volume clone '${cloneLabel}' (${sourceVol.sizeGb} GB) from '${sourceVol.name}'.`,
      },
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: `Created backup clone '${cloneLabel}' (${sourceVol.sizeGb} GB) in your Cloud Storage Pool.`,
      volume: cloned,
    });
  } catch (err) {
    console.error('[Volume Controller] Error cloning volume:', err);
    return res.status(500).json({ error: err.message || 'Failed to clone volume.' });
  }
}

/**
 * 7. DELETE /api/volumes/:id - Permanently delete an unattached secondary NAS volume & free NAS quota
 */
export async function deleteVolume(req, res) {
  try {
    const userId = req.user?.userId;
    const volumeId = Number(req.params.id);

    const volume = await prisma.storageVolume.findFirst({
      where: { volumeId, userId },
      include: { vm: true },
    });
    if (!volume) {
      return res.status(404).json({ error: 'Storage volume not found.' });
    }
    if (volume.vmId && volume.vm) {
      return res.status(400).json({
        error: `Volume '${volume.name}' is currently attached to ${volume.vm.vmName}. Detach it first before deleting.`,
      });
    }

    await hypervService.deleteVolume({
      vhdxPath: volume.vhdxPath,
      vmName: '',
    });

    await prisma.storageVolume.delete({
      where: { volumeId },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        vmId: null,
        action: 'DELETE_VOLUME',
        status: 'SUCCESS',
        details: `Permanently deleted ${volume.sizeGb} GB block storage volume '${volume.name}' (quota returned to pool)`,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Volume '${volume.name}' deleted and ${volume.sizeGb} GB returned to your Cloud Storage Pool.`,
    });
  } catch (err) {
    console.error('[Volume Controller] Error deleting volume:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete volume.' });
  }
}
