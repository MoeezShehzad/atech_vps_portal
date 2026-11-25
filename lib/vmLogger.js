// ==============================================================================
// Utility: lib/vmLogger.js
// Purpose: Enterprise Per-VM & System Logging Engine (Excel CSV + Column Table + JSONL)
//          - Writes to D:\CUSTOMER-VMS\<VMName>\Logs\ in 3 synchronized formats:
//            1) <category>.csv + ALL_EVENTS.csv  (Excel-ready column-wise CSV)
//            2) <category>.log                   (Human-readable aligned columns)
//            3) <category>.jsonl                 (Fast machine-readable API store)
//          - Every entry records Date, Time, UTC Timestamp, Actor Role (USER/ADMIN/SYSTEM),
//            Actor Email/ID, and Public IP Address
//          - Automatic PII / Secret redaction before anything hits disk
//          - Size-based rotation + gzip compression (prevents disk-full crashes)
//          - Host Disk Guard (warns at 85%, pauses non-critical writes at 92%)
//          - Forensic archiving to E:\SYNOLOGY-LOGS\archived\ on VM destroy
// ==============================================================================

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const CUSTOMER_VMS_ROOT = process.env.CUSTOMER_VMS_ROOT || 'D:\\CUSTOMER-VMS';
const SYSTEM_LOGS_ROOT = process.env.SYSTEM_LOGS_ROOT || 'D:\\SYSTEM-LOGS\\hyperv-agent';
const ARCHIVE_ROOT_PRIMARY = process.env.VM_LOG_ARCHIVE_ROOT || 'E:\\SYNOLOGY-LOGS\\archived';
const ARCHIVE_ROOT_FALLBACK = process.env.VM_LOG_ARCHIVE_FALLBACK || 'D:\\SYSTEM-LOGS\\archived-vm-logs';

const MAX_FILE_BYTES = Number(process.env.VM_LOG_MAX_FILE_BYTES || 10 * 1024 * 1024); // 10 MB per file
const MAX_ROTATED_FILES = Number(process.env.VM_LOG_MAX_ROTATED || 5);
const HOT_RETENTION_DAYS = Number(process.env.VM_LOG_HOT_RETENTION_DAYS || 30);
const ARCHIVE_RETENTION_DAYS = Number(process.env.VM_LOG_ARCHIVE_RETENTION_DAYS || 90);

const DISK_WARN_PCT = Number(process.env.LOG_DISK_WARN_PCT || 85);
const DISK_CRITICAL_PCT = Number(process.env.LOG_DISK_CRITICAL_PCT || 92);

const VALID_CATEGORIES = new Set([
  'provisioning',
  'lifecycle',
  'console-sessions',
  'anomalies',
  'activity',
]);

const SENSITIVE_KEY_PATTERN = /(pass(word|wd)?|secret|token|jwt|auth(orization)?|cookie|private[_-]?key|api[_-]?key|card[_-]?num|cvv|cvc|otp|ssn|pin)/i;

const CSV_HEADER =
  'Date,Time,UTC_Timestamp,VM_Name,Category,Level,Actor_Role,Actor_Email,Public_IP,Action,Status,Duration_ms,Details,Error\r\n';

let diskGuardCache = {
  checkedAt: 0,
  drives: {},
  paused: false,
  warning: false,
};

/**
 * Sanitize VM name to prevent path traversal when constructing log paths.
 */
export function sanitizeVmName(vmName) {
  if (!vmName || typeof vmName !== 'string') return '';
  return vmName.trim().replace(/[^a-zA-Z0-9._-]/g, '');
}

/**
 * Format local Date (YYYY-MM-DD) and Time (HH:mm:ss) + UTC ISO timestamp.
 */
export function buildTimestamps(dateObj = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
  const time = `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
  return {
    date,
    time,
    timestamp: dateObj.toISOString(),
  };
}

/**
 * Recursively redact secrets and sensitive fields before logging.
 */
export function redactSensitive(value, depth = 0) {
  if (depth > 8) return '[TRUNCATED]';
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    let cleaned = value;
    cleaned = cleaned.replace(/(Bearer\s+)[A-Za-z0-9._\-+/=]+/gi, '$1[REDACTED]');
    cleaned = cleaned.replace(/((?:password|passwd|pwd|secret|token|apikey|api_key)\s*[:=]\s*)(["']?)[^\s"',;}\]]+\2/gi, '$1[REDACTED]');
    cleaned = cleaned.replace(/-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]');
    if (cleaned.length > 4000) {
      cleaned = `${cleaned.slice(0, 4000)}... [TRUNCATED ${cleaned.length - 4000} chars]`;
    }
    return cleaned;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => redactSensitive(item, depth + 1));
  }

  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(k)) {
        out[k] = v ? '[REDACTED]' : '';
      } else {
        out[k] = redactSensitive(v, depth + 1);
      }
    }
    return out;
  }

  return value;
}

/**
 * Escape a value safely for RFC-4180 Excel CSV columns.
 */
function csvEscape(val) {
  if (val === null || val === undefined) return '""';
  const str = typeof val === 'string' ? val : JSON.stringify(val);
  const singleLine = str.replace(/\r?\n/g, ' ');
  return `"${singleLine.replace(/"/g, '""')}"`;
}

/**
 * Format a details object/string concisely for human-readable columns.
 */
function formatDetailsSummary(details) {
  if (details === null || details === undefined) return '-';
  if (typeof details === 'string') return details.replace(/\r?\n/g, ' ').trim() || '-';
  if (typeof details === 'object') {
    const parts = [];
    for (const [k, v] of Object.entries(details)) {
      if (v === null || v === undefined || v === '') continue;
      const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
      parts.push(`${k}=${valStr}`);
    }
    return parts.join(' | ') || '-';
  }
  return String(details);
}

/**
 * Pad/truncate a column cell for clean fixed-width human-readable .log tables.
 */
function padCol(val, width) {
  const s = String(val ?? '-').replace(/\r?\n/g, ' ');
  if (s.length > width) return `${s.slice(0, Math.max(1, width - 3))}...`;
  return s.padEnd(width, ' ');
}

function buildTableHeader(title) {
  const bar = '='.repeat(156);
  const sep = '-'.repeat(156);
  const cols = [
    padCol('DATE', 10),
    padCol('TIME', 8),
    padCol('LEVEL', 8),
    padCol('ROLE', 7),
    padCol('ACTOR', 26),
    padCol('PUBLIC IP', 16),
    padCol('ACTION', 24),
    padCol('STATUS', 10),
    'DETAILS',
  ].join(' | ');
  return `${bar}\r\n  ${title}\r\n${bar}\r\n${cols}\r\n${sep}\r\n`;
}

function formatTableRow(record) {
  const detailText = record.error
    ? `${formatDetailsSummary(record.details)} [ERROR: ${record.error}]`
    : formatDetailsSummary(record.details);
  return (
    [
      padCol(record.date, 10),
      padCol(record.time, 8),
      padCol(record.level, 8),
      padCol(record.actorRole || 'SYSTEM', 7),
      padCol(record.actor || 'system', 26),
      padCol(record.actorIp || 'N/A', 16),
      padCol(record.action, 24),
      padCol(record.status, 10),
      detailText,
    ].join(' | ') + '\r\n'
  );
}

function formatCsvRow(record) {
  return (
    [
      csvEscape(record.date),
      csvEscape(record.time),
      csvEscape(record.timestamp),
      csvEscape(record.vmName || 'SYSTEM'),
      csvEscape(record.category || 'system'),
      csvEscape(record.level),
      csvEscape(record.actorRole || 'SYSTEM'),
      csvEscape(record.actor || 'system'),
      csvEscape(record.actorIp || 'N/A'),
      csvEscape(record.action),
      csvEscape(record.status),
      csvEscape(record.durationMs ?? ''),
      csvEscape(formatDetailsSummary(record.details)),
      csvEscape(record.error || ''),
    ].join(',') + '\r\n'
  );
}

/**
 * Inspect disk usage on a given drive path using Node's native fs.statfsSync.
 */
function inspectDrive(drivePath) {
  try {
    if (!fs.existsSync(drivePath)) {
      return { path: drivePath, available: false };
    }
    if (typeof fs.statfsSync !== 'function') {
      return { path: drivePath, available: true, supported: false };
    }
    const st = fs.statfsSync(drivePath);
    const totalBytes = Number(st.blocks) * Number(st.bsize);
    const freeBytes = Number(st.bavail) * Number(st.bsize);
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const usedPercent = totalBytes > 0 ? Number(((usedBytes / totalBytes) * 100).toFixed(2)) : 0;

    return {
      path: drivePath,
      available: true,
      totalGb: Number((totalBytes / 1024 ** 3).toFixed(2)),
      freeGb: Number((freeBytes / 1024 ** 3).toFixed(2)),
      usedGb: Number((usedBytes / 1024 ** 3).toFixed(2)),
      usedPercent,
      status:
        usedPercent >= DISK_CRITICAL_PCT
          ? 'CRITICAL'
          : usedPercent >= DISK_WARN_PCT
            ? 'WARNING'
            : 'HEALTHY',
    };
  } catch (err) {
    return { path: drivePath, available: false, error: err.message };
  }
}

/**
 * Returns live Disk Guard health for D:\ (VM storage) and E:\ (Synology NAS).
 */
export function getDiskHealth(force = false) {
  const now = Date.now();
  if (!force && now - diskGuardCache.checkedAt < 60000) {
    return diskGuardCache;
  }

  const primaryRoot = path.parse(CUSTOMER_VMS_ROOT).root || 'D:\\';
  const nasRoot = path.parse(ARCHIVE_ROOT_PRIMARY).root || 'E:\\';

  const primary = inspectDrive(primaryRoot);
  const nas = inspectDrive(nasRoot);

  const paused = Boolean(primary.available && typeof primary.usedPercent === 'number' && primary.usedPercent >= DISK_CRITICAL_PCT);
  const warning = Boolean(primary.available && typeof primary.usedPercent === 'number' && primary.usedPercent >= DISK_WARN_PCT);

  diskGuardCache = {
    checkedAt: now,
    checkedAtIso: new Date(now).toISOString(),
    thresholds: { warnPercent: DISK_WARN_PCT, criticalPercent: DISK_CRITICAL_PCT },
    paused,
    warning,
    drives: { primary, nas },
  };

  return diskGuardCache;
}

/**
 * Rotate a file (.jsonl, .csv, or .log) if it exceeds MAX_FILE_BYTES, gzip-compressing old files
 * and pruning beyond MAX_ROTATED_FILES.
 */
function rotateIfNeeded(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const stats = fs.statSync(filePath);
    if (stats.size < MAX_FILE_BYTES) return;

    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedRaw = path.join(dir, `${base}.${stamp}${ext}`);
    const rotatedGz = `${rotatedRaw}.gz`;

    fs.renameSync(filePath, rotatedRaw);

    try {
      const content = fs.readFileSync(rotatedRaw);
      const compressed = zlib.gzipSync(content, { level: 6 });
      fs.writeFileSync(rotatedGz, compressed);
      fs.unlinkSync(rotatedRaw);
    } catch (_) {
      // Keep uncompressed rotated file safely if gzip fails
    }

    const archives = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith(`${base}.`) && (f.endsWith(`${ext}.gz`) || f.endsWith(ext)))
      .map((f) => {
        const full = path.join(dir, f);
        let mtime = 0;
        try { mtime = fs.statSync(full).mtimeMs; } catch (_) {}
        return { name: f, full, mtime };
      })
      .sort((a, b) => b.mtime - a.mtime);

    for (const old of archives.slice(MAX_ROTATED_FILES)) {
      try { fs.unlinkSync(old.full); } catch (_) {}
    }
  } catch (err) {
    console.error('[VM LOGGER ROTATE ERROR]:', err.message);
  }
}

/**
 * Append a row to an Excel-compatible CSV file (auto-writes UTF-8 BOM + Header if new).
 */
function appendCsvFile(filePath, record) {
  rotateIfNeeded(filePath);
  const exists = fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
  if (!exists) {
    fs.writeFileSync(filePath, `\uFEFF${CSV_HEADER}`, 'utf8');
  }
  fs.appendFileSync(filePath, formatCsvRow(record), 'utf8');
}

/**
 * Append a row to a human-readable column-aligned .log table (auto-writes header if new).
 */
function appendTableLogFile(filePath, title, record) {
  rotateIfNeeded(filePath);
  const exists = fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
  if (!exists) {
    fs.writeFileSync(filePath, buildTableHeader(title), 'utf8');
  }
  fs.appendFileSync(filePath, formatTableRow(record), 'utf8');
}

/**
 * Append a structured, sanitized entry to the central Hyper-V agent system logs
 * (agent.jsonl + agent.csv + agent.log).
 */
export function appendSystemLog(entry) {
  try {
    const health = getDiskHealth();
    if (health.paused && entry.level !== 'CRITICAL' && entry.level !== 'ERROR') {
      return false;
    }

    if (!fs.existsSync(SYSTEM_LOGS_ROOT)) {
      fs.mkdirSync(SYSTEM_LOGS_ROOT, { recursive: true });
    }

    const ts = buildTimestamps(entry.timestamp ? new Date(entry.timestamp) : new Date());
    const record = redactSensitive({
      date: entry.date || ts.date,
      time: entry.time || ts.time,
      timestamp: entry.timestamp || ts.timestamp,
      level: (entry.level || 'INFO').toUpperCase(),
      category: entry.category || 'system',
      source: entry.source || 'hyperv-agent',
      action: entry.action || 'EVENT',
      vmName: entry.vmName || null,
      status: entry.status || 'INFO',
      durationMs: entry.durationMs ?? null,
      actorRole: (entry.actorRole || 'SYSTEM').toUpperCase(),
      actor: entry.actor || 'system',
      actorIp: entry.actorIp || 'N/A',
      details: entry.details || null,
      error: entry.error || null,
    });

    const jsonlFile = path.join(SYSTEM_LOGS_ROOT, 'agent.jsonl');
    rotateIfNeeded(jsonlFile);
    fs.appendFileSync(jsonlFile, `${JSON.stringify(record)}\n`, 'utf8');

    appendCsvFile(path.join(SYSTEM_LOGS_ROOT, 'agent.csv'), record);
    appendTableLogFile(path.join(SYSTEM_LOGS_ROOT, 'agent.log'), 'ATECH CLOUD - CENTRAL HYPER-V HOST & ADMIN AUDIT LOG', record);
    return true;
  } catch (err) {
    console.error('[SYSTEM LOGGER ERROR]:', err.message);
    return false;
  }
}

/**
 * Append a structured, sanitized entry to D:\CUSTOMER-VMS\<vmName>\Logs\:
 *   - <category>.csv  (Excel column-wise sheet for that category)
 *   - <category>.log  (Human-readable column-aligned table for Notepad/VS Code)
 *   - <category>.jsonl (Fast JSONL for portal API)
 *   - ALL_EVENTS.csv  (Master Excel sheet combining every category for this VM)
 */
export function appendVmLog(vmName, category, entry = {}) {
  const safeName = sanitizeVmName(vmName);
  if (!safeName) return false;

  const safeCategory = VALID_CATEGORIES.has(category) ? category : 'activity';
  const level = (entry.level || 'INFO').toUpperCase();

  // Disk Guard: never let non-critical logs fill D:\ and crash running VMs
  const health = getDiskHealth();
  if (health.paused && level !== 'CRITICAL' && level !== 'ERROR') {
    return false;
  }

  try {
    const vmDir = path.join(CUSTOMER_VMS_ROOT, safeName);
    const logsDir = path.join(vmDir, 'Logs');

    if (!fs.existsSync(vmDir) && safeCategory !== 'provisioning') {
      appendSystemLog({ ...entry, vmName: safeName, category: safeCategory, source: `vm-fallback:${safeCategory}` });
      return false;
    }

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const ts = buildTimestamps(entry.timestamp ? new Date(entry.timestamp) : new Date());
    const record = redactSensitive({
      date: entry.date || ts.date,
      time: entry.time || ts.time,
      timestamp: entry.timestamp || ts.timestamp,
      vmName: safeName,
      category: safeCategory,
      level,
      action: entry.action || 'EVENT',
      status: entry.status || 'SUCCESS',
      source: entry.source || 'hyperv-agent',
      actorRole: (entry.actorRole || (entry.actor ? 'USER' : 'SYSTEM')).toUpperCase(),
      actor: entry.actor || 'system',
      actorIp: entry.actorIp || 'N/A',
      durationMs: entry.durationMs ?? null,
      details: entry.details || null,
      error: entry.error || null,
    });

    // 1. Machine-readable JSONL
    const jsonlFile = path.join(logsDir, `${safeCategory}.jsonl`);
    rotateIfNeeded(jsonlFile);
    fs.appendFileSync(jsonlFile, `${JSON.stringify(record)}\n`, 'utf8');

    // 2. Category Excel-ready CSV
    appendCsvFile(path.join(logsDir, `${safeCategory}.csv`), record);

    // 3. Master combined Excel-ready CSV for this VM
    appendCsvFile(path.join(logsDir, 'ALL_EVENTS.csv'), record);

    // 4. Human-readable fixed-width column table (.log)
    const title = `VM: ${safeName}  |  CATEGORY: ${safeCategory.toUpperCase()}`;
    appendTableLogFile(path.join(logsDir, `${safeCategory}.log`), title, record);

    // Mirror critical / lifecycle / provisioning / admin actions to central host audit log
    if (
      safeCategory === 'provisioning' ||
      safeCategory === 'lifecycle' ||
      record.actorRole === 'ADMIN' ||
      level === 'ERROR' ||
      level === 'CRITICAL'
    ) {
      appendSystemLog(record);
    }

    return true;
  } catch (err) {
    console.error(`[VM LOGGER ERROR] (${safeName}/${safeCategory}):`, err.message);
    return false;
  }
}

/**
 * Archive D:\CUSTOMER-VMS\<vmName>\Logs to E:\SYNOLOGY-LOGS\archived\<vmName>_<timestamp>
 * BEFORE a VM is destroyed, preserving forensic/billing/legal evidence.
 */
export function archiveVmLogs(vmName, reason = 'VM_DESTROYED') {
  const safeName = sanitizeVmName(vmName);
  if (!safeName) return { archived: false, reason: 'Invalid VM name' };

  const sourceLogsDir = path.join(CUSTOMER_VMS_ROOT, safeName, 'Logs');
  if (!fs.existsSync(sourceLogsDir)) {
    return { archived: false, reason: 'No Logs directory found' };
  }

  try {
    appendVmLog(safeName, 'lifecycle', {
      level: 'WARN',
      action: 'LOGS_ARCHIVED',
      status: 'SUCCESS',
      details: { reason },
    });

    const nasRoot = path.parse(ARCHIVE_ROOT_PRIMARY).root || 'E:\\';
    const archiveBase = fs.existsSync(nasRoot) ? ARCHIVE_ROOT_PRIMARY : ARCHIVE_ROOT_FALLBACK;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const targetDir = path.join(archiveBase, `${safeName}_${stamp}`);

    fs.mkdirSync(targetDir, { recursive: true });

    const files = fs.readdirSync(sourceLogsDir);
    let copiedCount = 0;
    for (const file of files) {
      const src = path.join(sourceLogsDir, file);
      const dst = path.join(targetDir, file);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dst);
        copiedCount++;
      }
    }

    appendSystemLog({
      level: 'INFO',
      action: 'VM_LOGS_ARCHIVED',
      vmName: safeName,
      status: 'SUCCESS',
      details: { targetDir, copiedCount, reason },
    });

    return { archived: true, targetDir, copiedCount };
  } catch (err) {
    console.error(`[VM LOGGER ARCHIVE ERROR] (${safeName}):`, err.message);
    return { archived: false, error: err.message };
  }
}

/**
 * Read JSONL records from a single log file (supports .jsonl and .jsonl.gz).
 */
function readJsonlFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = filePath.endsWith('.gz')
      ? zlib.gunzipSync(fs.readFileSync(filePath)).toString('utf8')
      : fs.readFileSync(filePath, 'utf8');

    const entries = [];
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        entries.push(JSON.parse(trimmed));
      } catch (_) {}
    }
    return entries;
  } catch (_) {
    return [];
  }
}

/**
 * Read structured logs for a specific VM from D:\CUSTOMER-VMS\<vmName>\Logs\
 * (and optionally archived folders on E:\ for admins investigating destroyed VMs).
 */
export function readVmLogs(vmName, { category = 'all', level = '', search = '', limit = 100, includeArchived = false } = {}) {
  const safeName = sanitizeVmName(vmName);
  if (!safeName) return { vmName: '', total: 0, logs: [] };

  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 1000);
  const dirsToScan = [];

  const activeLogsDir = path.join(CUSTOMER_VMS_ROOT, safeName, 'Logs');
  if (fs.existsSync(activeLogsDir)) {
    dirsToScan.push({ dir: activeLogsDir, archived: false });
  }

  if (includeArchived) {
    for (const root of [ARCHIVE_ROOT_PRIMARY, ARCHIVE_ROOT_FALLBACK]) {
      if (!fs.existsSync(root)) continue;
      try {
        const matches = fs
          .readdirSync(root)
          .filter((d) => d.startsWith(`${safeName}_`))
          .map((d) => path.join(root, d))
          .filter((full) => fs.statSync(full).isDirectory());
        for (const m of matches) {
          dirsToScan.push({ dir: m, archived: true });
        }
      } catch (_) {}
    }
  }

  const wantedCats =
    category && category !== 'all' && VALID_CATEGORIES.has(category)
      ? [category]
      : Array.from(VALID_CATEGORIES);

  const allEntries = [];
  for (const { dir, archived } of dirsToScan) {
    for (const cat of wantedCats) {
      const activeFile = path.join(dir, `${cat}.jsonl`);
      if (fs.existsSync(activeFile)) {
        const items = readJsonlFile(activeFile);
        for (const item of items) {
          allEntries.push(archived ? { ...item, archived: true } : item);
        }
      }
    }
  }

  const upperLevel = (level || '').toUpperCase();
  const lowerSearch = (search || '').toLowerCase();

  const filtered = allEntries.filter((entry) => {
    if (upperLevel && (entry.level || '').toUpperCase() !== upperLevel) return false;
    if (lowerSearch) {
      const blob = JSON.stringify(entry).toLowerCase();
      if (!blob.includes(lowerSearch)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  return {
    vmName: safeName,
    total: filtered.length,
    logs: filtered.slice(0, safeLimit),
  };
}

/**
 * Background retention cleanup:
 * - Purges rotated *.gz files older than HOT_RETENTION_DAYS inside D:\CUSTOMER-VMS\*\Logs
 * - Purges archived VM log folders/zips older than ARCHIVE_RETENTION_DAYS on E:\ / fallback
 */
export function runRetentionCleanup() {
  const now = Date.now();
  const hotCutoff = now - HOT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const archiveCutoff = now - ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let purgedHot = 0;
  let purgedArchives = 0;

  try {
    if (fs.existsSync(CUSTOMER_VMS_ROOT)) {
      for (const vmFolder of fs.readdirSync(CUSTOMER_VMS_ROOT)) {
        const logsDir = path.join(CUSTOMER_VMS_ROOT, vmFolder, 'Logs');
        if (!fs.existsSync(logsDir)) continue;
        for (const file of fs.readdirSync(logsDir)) {
          if (!file.endsWith('.gz')) continue;
          const full = path.join(logsDir, file);
          try {
            if (fs.statSync(full).mtimeMs < hotCutoff) {
              fs.unlinkSync(full);
              purgedHot++;
            }
          } catch (_) {}
        }
      }
    }

    for (const root of [ARCHIVE_ROOT_PRIMARY, ARCHIVE_ROOT_FALLBACK]) {
      if (!fs.existsSync(root)) continue;
      for (const item of fs.readdirSync(root)) {
        const full = path.join(root, item);
        try {
          if (fs.statSync(full).mtimeMs < archiveCutoff) {
            fs.rmSync(full, { recursive: true, force: true });
            purgedArchives++;
          }
        } catch (_) {}
      }
    }

    if (purgedHot > 0 || purgedArchives > 0) {
      appendSystemLog({
        level: 'INFO',
        action: 'RETENTION_CLEANUP',
        status: 'SUCCESS',
        details: { purgedHot, purgedArchives, hotRetentionDays: HOT_RETENTION_DAYS, archiveRetentionDays: ARCHIVE_RETENTION_DAYS },
      });
    }
  } catch (err) {
    console.error('[VM LOGGER RETENTION ERROR]:', err.message);
  }

  return { purgedHot, purgedArchives };
}

export default {
  sanitizeVmName,
  buildTimestamps,
  redactSensitive,
  getDiskHealth,
  appendSystemLog,
  appendVmLog,
  archiveVmLogs,
  readVmLogs,
  runRetentionCleanup,
};
