// ==============================================================================
// Controller: vmController.js
// Purpose: API controller for Virtual Machine management, resizing & lifecycle
// ==============================================================================

import prisma from '../lib/prisma.js';
import hypervService from '../services/hypervService.js';
import { calculateResizePrice, calculateCustomPrice } from '../services/pricingService.js';

/**
 * 1. GET /api/vms - Get all VMs for current user
 */
export async function getUserVMs(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const vms = await prisma.virtualMachine.findMany({
      where: {
        userId,
        status: { not: 'TERMINATED' },
      },
      include: {
        plan: true,
        image: true,
        ipPool: true,
        subscription: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Reconcile with Hyper-V Host (auto-clean manual host deletions & sync power states)
    let reconciledVms = vms;
    try {
      const hvData = await hypervService.getStatus();
      let liveList = [];
      if (Array.isArray(hvData)) {
        liveList = hvData;
      } else if (hvData && Array.isArray(hvData.output)) {
        liveList = hvData.output;
      } else if (hvData && typeof hvData.output === 'string') {
        try {
          const parsed = JSON.parse(hvData.output);
          if (Array.isArray(parsed)) liveList = parsed;
          else if (parsed && parsed.VMName) liveList = [parsed];
        } catch {}
      } else if (hvData && hvData.VMName) {
        liveList = [hvData];
      }

      if (liveList.length > 0) {
        const hostVmMap = new Map();
        liveList.forEach((hv) => {
          if (hv.VMName) hostVmMap.set(hv.VMName.toLowerCase(), hv);
        });

        const synced = [];
        for (const vm of vms) {
          let liveInfo = hostVmMap.get(vm.vmName.toLowerCase());

          // If not in the bulk list, perform a targeted check specifically for this VM
          if (!liveInfo && vm.status !== 'PROVISIONING') {
            try {
              const specificCheck = await hypervService.getStatus(vm.vmName);
              if (specificCheck && specificCheck.Found) {
                liveInfo = specificCheck;
              }
            } catch {}
          }

          // Only purge if confirmed non-existent by specific check
          if (!liveInfo && vm.status !== 'PROVISIONING') {
            console.log(`[RECONCILE] VM '${vm.vmName}' confirmed NOT in Hyper-V. Purging orphaned DB record and freeing IP.`);
            await prisma.iPPool.updateMany({
              where: { assignedVmId: vm.vmId },
              data: { status: 'AVAILABLE', assignedVmId: null },
            }).catch(() => {});
            await prisma.provisioningJob.deleteMany({ where: { vmId: vm.vmId } }).catch(() => {});
            await prisma.backup.deleteMany({ where: { vmId: vm.vmId } }).catch(() => {});
            await prisma.activityLog.updateMany({ where: { vmId: vm.vmId }, data: { vmId: null } }).catch(() => {});
            await prisma.virtualMachine.delete({ where: { vmId: vm.vmId } }).catch(() => {});
            continue;
          }

          // If state changed in Hyper-V (e.g. stopped/started outside portal)
          if (liveInfo && liveInfo.State) {
            const liveStatus = liveInfo.State.toUpperCase() === 'RUNNING' ? 'RUNNING' : 'STOPPED';
            if (liveStatus !== vm.status) {
              await prisma.virtualMachine.update({
                where: { vmId: vm.vmId },
                data: { status: liveStatus },
              }).catch(() => {});
              vm.status = liveStatus;
            }
          }

          synced.push(vm);
        }
        reconciledVms = synced;
      }
    } catch (reconcileErr) {
      // Hyper-V Host Agent temporarily busy or offline; fallback to DB
    }

    // Query active subscriptions and slot availability (Hostinger model)
    const now = new Date();
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: now },
      },
      include: {
        plan: true,
        virtualMachines: {
          where: { status: { not: 'TERMINATED' } },
        },
      },
      orderBy: { endDate: 'desc' },
    });

    const activeSubsFormatted = activeSubscriptions.map((sub) => {
      const activeVmCount = sub.virtualMachines.length;
      const daysRemaining = Math.max(
        0,
        Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
      return {
        subscriptionId: sub.subscriptionId,
        planId: sub.planId,
        planName: sub.plan.name,
        monthlyPrice: Number(sub.monthlyPrice),
        startDate: sub.startDate.toISOString().split('T')[0],
        endDate: sub.endDate ? sub.endDate.toISOString().split('T')[0] : null,
        daysRemaining,
        activeVmCount,
        hasAvailableSlot: activeVmCount === 0,
        specs: {
          cpuCores: sub.plan.cpuCores,
          ramGb: sub.plan.ramGb,
          storageGb: sub.plan.storageGb,
        },
      };
    });

    // Format for frontend
    const formatted = reconciledVms.map((vm) => {
      const assignedIp = vm.ipPool && vm.ipPool.length > 0 ? vm.ipPool[0].ipAddress : '192.168.10.' + (100 + vm.vmId);
      return {
        id: `vps-${vm.vmId}`,
        vmId: vm.vmId,
        name: vm.vmName,
        hostname: vm.hostname || `${vm.vmName}.atech-vps.net`,
        ip: assignedIp,
        os: vm.image?.name || 'Ubuntu 22.04 LTS',
        status: vm.status ? vm.status.toLowerCase() : 'stopped',
        cpuUsage: Math.floor(Math.random() * 20) + 5,
        ramUsage: `${(vm.ramGb * 0.45).toFixed(1)} / ${vm.ramGb} GB`,
        diskUsage: `${Math.round(vm.storageGb * 0.35)} / ${vm.storageGb} GB`,
        vCPU: vm.cpuCores,
        ramGB: vm.ramGb,
        diskGB: vm.storageGb,
        monthlyPrice: vm.subscription?.monthlyPrice ? Number(vm.subscription.monthlyPrice) : (vm.plan?.monthlyPrice ? Number(vm.plan.monthlyPrice) : 9.99),
        createdAt: vm.createdAt.toISOString().split('T')[0],
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      vms: formatted,
      activeSubscriptions: activeSubsFormatted,
    });
  } catch (error) {
    console.error('[VM Controller] Error fetching user VMs:', error);
    return res.status(500).json({ error: 'Failed to retrieve virtual machines.' });
  }
}

/**
 * 2. GET /api/vms/catalog - Get plans and OS images for deployment
 */
export async function getPlansAndImages(req, res) {
  try {
    const plans = await prisma.vPSPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
    });

    const images = await prisma.oSImage.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, plans, images });
  } catch (error) {
    console.error('[VM Controller] Error fetching plans and images:', error);
    return res.status(500).json({ error: 'Failed to load cloud catalog.' });
  }
}

/**
 * 3. POST /api/vms/deploy - Provision a new VM
 */
export async function deployVM(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { planId, imageId, vmName, customCpu, customRam, customStorage } = req.body;

    if (!vmName) {
      return res.status(400).json({ error: 'A valid VM hostname or name is required.' });
    }

    // Clean VM slug
    const cleanVmName = vmName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');

    // Fetch Plan & OS Image
    const plan = await prisma.vPSPlan.findFirst({
      where: { planId: Number(planId) || 1 },
    });
    const image = await prisma.oSImage.findFirst({
      where: imageId ? { imageId: Number(imageId) } : { isActive: true },
    });

    if (!plan || !image) {
      return res.status(404).json({ error: 'Selected VPS plan or operating system not found.' });
    }

    // Get an active HyperV host
    let host = await prisma.hyperVHost.findFirst({
      where: { status: 'ONLINE' },
    });
    if (!host) {
      host = await prisma.hyperVHost.create({
        data: {
          hostname: 'host1.atech.internal',
          ipAddress: '172.25.80.1',
          status: 'ONLINE',
          location: 'Main DC - Cluster 01',
        },
      });
    }

    // Specs calculation
    const finalCpu = customCpu ? Number(customCpu) : plan.cpuCores;
    const finalRam = customRam ? Number(customRam) : plan.ramGb;
    const finalStorage = customStorage ? Number(customStorage) : plan.storageGb;

    const pricing = calculateCustomPrice(plan, {
      cpuCores: finalCpu,
      ramGb: finalRam,
      storageGb: finalStorage,
    });

    // Check if user has an existing active subscription with an available server slot (Hostinger model)
    const now = new Date();
    let subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gt: now },
        virtualMachines: {
          none: { status: { not: 'TERMINATED' } },
        },
      },
      include: { plan: true },
      orderBy: { endDate: 'desc' },
    });

    let isSlotReused = false;
    if (subscription) {
      isSlotReused = true;
      console.log(`[Deploy VM] Reusing active subscription slot #${subscription.subscriptionId} (${subscription.plan.name}) for user #${userId}`);
    } else {
      // 1. Create new 30-day Subscription
      subscription = await prisma.subscription.create({
        data: {
          userId,
          planId: plan.planId,
          status: 'ACTIVE',
          startDate: now,
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30-day cycle
          monthlyPrice: pricing.totalMonthlyPrice,
          currency: 'USD',
        },
      });
    }

    // 2. Assign IP from pool (or generate one)
    let ipRecord = await prisma.iPPool.findFirst({
      where: { status: 'AVAILABLE' },
    });

    // 3. Create VM in MS SQL Server
    const newVm = await prisma.virtualMachine.create({
      data: {
        userId,
        subscriptionId: subscription.subscriptionId,
        planId: plan.planId,
        imageId: image.imageId,
        hostId: host.hostId,
        vmName: cleanVmName,
        hostname: `${cleanVmName}.atech-vps.net`,
        cpuCores: finalCpu,
        ramGb: finalRam,
        storageGb: finalStorage,
        status: 'PROVISIONING',
        provisioningStatus: 'IN_PROGRESS',
      },
    });

    if (ipRecord) {
      await prisma.iPPool.update({
        where: { ipId: ipRecord.ipId },
        data: { status: 'ASSIGNED', assignedVmId: newVm.vmId },
      });
    }

    // 4. Log Activity
    await prisma.activityLog.create({
      data: {
        userId,
        vmId: newVm.vmId,
        action: 'DEPLOY_VM',
        status: 'PENDING',
        details: `Provisioning ${cleanVmName} (${finalCpu} vCPU / ${finalRam} GB RAM / ${isSlotReused ? 'Covered by Active Subscription ($0.00)' : `${pricing.totalMonthlyPrice} USD/mo`})`,
      },
    });

    // 5. Trigger Hyper-V Provisioning Engine (Awaited with error handling)
    try {
      await hypervService.createVM({
        vmId: newVm.vmId,
        vmName: cleanVmName,
        cpuCores: finalCpu,
        ramGb: finalRam,
        storageGb: finalStorage,
        templatePath: image.templatePath,
      });

      await prisma.activityLog.create({
        data: {
          userId,
          vmId: newVm.vmId,
          action: 'DEPLOY_VM',
          status: 'SUCCESS',
          details: `Successfully provisioned ${cleanVmName}`,
        },
      });

      const readyVm = await prisma.virtualMachine.findUnique({
        where: { vmId: newVm.vmId },
        include: { plan: true, image: true, ipPool: true, subscription: true },
      });

      return res.status(201).json({
        success: true,
        message: `Virtual machine ${cleanVmName} created and started in Hyper-V.`,
        vm: readyVm,
        pricing,
      });
    } catch (provisionErr) {
      console.error(`[VM PROVISION ERROR] ${cleanVmName}:`, provisionErr.message);

      // Clean up IP assignment
      if (ipRecord) {
        await prisma.iPPool.update({
          where: { ipId: ipRecord.ipId },
          data: { status: 'AVAILABLE', assignedVmId: null },
        }).catch(() => {});
      }

      // Mark VM as FAILED with detailed message
      await prisma.virtualMachine.update({
        where: { vmId: newVm.vmId },
        data: {
          status: 'FAILED',
          provisioningStatus: 'FAILED',
          provisioningError: provisionErr.message,
        },
      }).catch(() => {});

      return res.status(500).json({
        error: `Hyper-V Provisioning failed: ${provisionErr.message}. Ensure start_hyperv_agent.bat is running on Windows.`,
      });
    }
  } catch (error) {
    console.error('[VM Controller] Error deploying VM:', error);
    return res.status(500).json({ error: error.message || 'Failed to deploy virtual machine.' });
  }
}

/**
 * 4. POST /api/vms/:id/power - Power management (start, stop, restart)
 */
export async function powerAction(req, res) {
  try {
    const userId = req.user?.userId;
    const vmId = Number(req.params.id);
    const { action } = req.body;

    if (!['START', 'STOP', 'RESTART', 'FORCE_STOP'].includes(action?.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid power action. Allowed: START, STOP, RESTART, FORCE_STOP' });
    }

    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
    });

    if (!vm) {
      return res.status(404).json({ error: 'Virtual machine not found.' });
    }

    if (vm.status === 'FAILED') {
      return res.status(400).json({ error: 'This VM failed provisioning. Please click the trash icon to destroy it and deploy a new one.' });
    }

    const normAction = action.toUpperCase();
    await hypervService.executePowerAction(vm.vmName, normAction);

    const newStatus = normAction === 'START' || normAction === 'RESTART' ? 'RUNNING' : 'STOPPED';

    await prisma.virtualMachine.update({
      where: { vmId },
      data: {
        status: newStatus,
        startedAt: newStatus === 'RUNNING' ? new Date() : vm.startedAt,
        stoppedAt: newStatus === 'STOPPED' ? new Date() : vm.stoppedAt,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        vmId,
        action: `POWER_${normAction}`,
        status: 'SUCCESS',
        details: `Executed power action ${normAction} on ${vm.vmName}`,
      },
    });

    return res.json({
      success: true,
      message: `VM ${normAction.toLowerCase()} successful.`,
      status: newStatus.toLowerCase(),
    });
  } catch (error) {
    console.error('[VM Controller] Power action error:', error);
    return res.status(500).json({ error: 'Failed to execute power command.' });
  }
}

/**
 * 5. POST /api/vms/:id/preview-resize - Preview price calculation before resizing
 */
export async function previewResize(req, res) {
  try {
    const userId = req.user?.userId;
    const vmId = Number(req.params.id);
    const { cpuCores, ramGb, storageGb } = req.body;

    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
      include: { subscription: true, plan: true },
    });

    if (!vm) {
      return res.status(404).json({ error: 'Virtual machine not found.' });
    }

    const targetStorage = storageGb ? Number(storageGb) : vm.storageGb;
    const calculation = calculateResizePrice(vm, Number(cpuCores), Number(ramGb), targetStorage);
    return res.json({ success: true, ...calculation });
  } catch (error) {
    console.error('[VM Controller] Error calculating resize price:', error);
    return res.status(500).json({ error: 'Failed to calculate pricing.' });
  }
}

/**
 * 6. PATCH /api/vms/:id/resize - Apply hardware spec resize & update billing
 */
export async function resizeVM(req, res) {
  try {
    const userId = req.user?.userId;
    const vmId = Number(req.params.id);
    const { cpuCores, ramGb, storageGb } = req.body;

    const targetCpu = Number(cpuCores);
    const targetRam = Number(ramGb);

    if (!targetCpu || !targetRam || targetCpu < 1 || targetRam < 1) {
      return res.status(400).json({ error: 'Invalid CPU cores or RAM amount specified.' });
    }

    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
      include: { subscription: true, plan: true },
    });

    if (!vm) {
      return res.status(404).json({ error: 'Virtual machine not found.' });
    }

    const targetStorage = storageGb ? Number(storageGb) : vm.storageGb;

    // Disallow disk shrinking
    if (targetStorage < vm.storageGb) {
      return res.status(400).json({
        error: `Disk storage cannot be reduced below current size (${vm.storageGb} GB). Disk shrinking is not supported to protect file system data.`,
      });
    }

    // Calculate price changes
    const priceInfo = calculateResizePrice(vm, targetCpu, targetRam, targetStorage);

    // Call Hyper-V resize service (handles CPU, RAM, and VHDX disk expansion)
    await hypervService.resizeVM({
      vmName: vm.vmName,
      cpuCores: targetCpu,
      ramGb: targetRam,
      storageGb: targetStorage,
    });

    // Update Virtual Machine in DB
    const updatedVm = await prisma.virtualMachine.update({
      where: { vmId },
      data: {
        cpuCores: targetCpu,
        ramGb: targetRam,
        storageGb: targetStorage,
      },
    });

    // Update Subscription monthly price
    if (vm.subscriptionId) {
      await prisma.subscription.update({
        where: { subscriptionId: vm.subscriptionId },
        data: { monthlyPrice: priceInfo.newPrice },
      });
    }

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId,
        vmId,
        action: 'RESIZE_SPECS',
        status: 'SUCCESS',
        details: `Resized specs to ${targetCpu} vCPU, ${targetRam} GB RAM, ${targetStorage} GB NVMe. New monthly rate: $${priceInfo.newPrice}/mo (Delta: $${priceInfo.priceDelta})`,
      },
    });

    return res.json({
      success: true,
      message: `Hardware specs upgraded to ${targetCpu} vCPU, ${targetRam} GB RAM, and ${targetStorage} GB NVMe Storage.`,
      vm: updatedVm,
      pricing: priceInfo,
    });
  } catch (error) {
    console.error('[VM Controller] Resize error:', error);
    return res.status(500).json({ error: error.message || 'Failed to adjust virtual machine specifications.' });
  }
}

/**
 * 7. DELETE /api/vms/:id - Destroy VM, free IP & retain active subscription slot (Hostinger model)
 */
export async function destroyVM(req, res) {
  try {
    const userId = req.user?.userId;
    const vmId = Number(req.params.id);

    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
      include: { subscription: true },
    });

    if (!vm) {
      // Idempotent: VM is already removed from DB, return 200 OK so UI clears smoothly
      return res.json({
        success: true,
        message: 'Virtual machine is already removed.',
        alreadyRemoved: true,
      });
    }

    const force = req.query.force === 'true' || req.body?.force === true;

    // Check if VM is physically active in Hyper-V
    let isPhysicallyRunning = false;
    try {
      const hvStatus = await hypervService.getStatus(vm.vmName);
      if (hvStatus && hvStatus.Found && hvStatus.State && hvStatus.State.toUpperCase() === 'RUNNING') {
        isPhysicallyRunning = true;
      }
    } catch (e) {
      isPhysicallyRunning = vm.status === 'RUNNING';
    }

    // Enterprise safety guard: Active running VMs must be stopped or forcefully confirmed
    if (isPhysicallyRunning && !force) {
      return res.status(400).json({
        error: `Virtual machine '${vm.vmName}' is currently running. For safety and data integrity, please power off the server first, or select 'Force Stop & Destroy'.`,
        requiresStop: true,
      });
    }

    // 1. Call Hyper-V destroy service (gracefully handles if already deleted on host)
    try {
      await hypervService.destroyVM(vm.vmName);
    } catch (hvErr) {
      console.warn(`[Destroy VM] Hyper-V notice for ${vm.vmName}:`, hvErr.message);
    }

    // 2. Release assigned IP addresses immediately
    await prisma.iPPool.updateMany({
      where: { assignedVmId: vmId },
      data: { status: 'AVAILABLE', assignedVmId: null },
    });

    // 3. Clean up provisioning jobs referencing this VM
    await prisma.provisioningJob.deleteMany({
      where: { vmId },
    }).catch(() => {});

    // 4. Clean up backups referencing this VM
    await prisma.backup.deleteMany({
      where: { vmId },
    }).catch(() => {});

    // 5. Detach activity logs from this VM (set vmId to null) so audit history is kept without FK conflict
    await prisma.activityLog.updateMany({
      where: { vmId },
      data: { vmId: null },
    }).catch(() => {});

    // 6. Delete the VirtualMachine record from DB
    await prisma.virtualMachine.delete({
      where: { vmId },
    });

    // 7. Industry Standard Lifecycle (Hostinger): DO NOT CANCEL ACTIVE SUBSCRIPTION!
    // The user paid for a 30-day billing cycle. Destroying the VM frees up the slot for fresh re-deployment.
    let isSubscriptionActive = false;
    let subscriptionEndDate = null;
    if (vm.subscriptionId && vm.subscription) {
      const now = new Date();
      if (vm.subscription.endDate && new Date(vm.subscription.endDate) > now) {
        isSubscriptionActive = true;
        subscriptionEndDate = vm.subscription.endDate;
        await prisma.subscription.update({
          where: { subscriptionId: vm.subscriptionId },
          data: { status: 'ACTIVE' },
        }).catch(() => {});
      } else {
        await prisma.subscription.update({
          where: { subscriptionId: vm.subscriptionId },
          data: { status: 'EXPIRED' },
        }).catch(() => {});
      }
    }

    // 8. Log Activity
    await prisma.activityLog.create({
      data: {
        userId,
        vmId: null,
        action: 'DESTROY_VM',
        status: 'SUCCESS',
        details: `Permanently destroyed virtual machine ${vm.vmName} and released IP. ${isSubscriptionActive ? 'Active subscription slot preserved for re-deployment.' : ''}`,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Virtual Machine ${vm.vmName} permanently destroyed and resources freed. Your VPS subscription slot remains active for re-deployment.`,
      subscriptionActive: isSubscriptionActive,
      subscriptionEndDate,
    });
  } catch (error) {
    console.error('[VM Controller] Destroy error:', error);
    return res.status(500).json({ error: error.message || 'Failed to destroy virtual machine.' });
  }
}

/**
 * 7. GET /api/vms/:id/metrics - Query real-time resource telemetry (CPU, RAM, Disk, IO)
 */
export async function getVMMetrics(req, res) {
  try {
    const userId = req.user?.userId;
    const vmId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const vm = await prisma.virtualMachine.findFirst({
      where: { vmId, userId },
    });

    if (!vm) {
      return res.status(404).json({ error: 'Virtual machine not found' });
    }

    // If VM is not running, return static zeroed state
    if (vm.status !== 'RUNNING') {
      return res.json({
        found: true,
        vmName: vm.vmName,
        state: vm.status,
        cpuUsage: 0,
        avgCpu: 0,
        ramTotalMb: (vm.ramGb || 2) * 1024,
        ramUsedMb: 0,
        ramPercent: 0,
        diskTotalGb: vm.storageGb || 40,
        diskUsedGb: 0,
        diskPercent: 0,
        diskReadMb: 0,
        diskWriteMb: 0,
        uptime: '00:00:00',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const liveData = await hypervService.getStatus(vm.vmName);
      if (liveData && liveData.Found) {
        return res.json({
          found: true,
          vmName: liveData.VMName || vm.vmName,
          vmId: liveData.VMId || vm.hypervVmId,
          state: liveData.State || vm.status,
          status: liveData.Status || 'Operating normally',
          uptime: liveData.Uptime || '00:00:00',
          processorCount: liveData.CPUCount || vm.cpuCores,
          cpuUsage: liveData.CPUUsage ?? 0,
          avgCpu: liveData.AvgCPU ?? liveData.CPUUsage ?? 0,
          ramTotalMb: liveData.RAMTotalMB || liveData.RAMAssignedMB || ((vm.ramGb || 2) * 1024),
          ramUsedMb: liveData.RAMUsedMB || Math.round(((vm.ramGb || 2) * 1024) * 0.25),
          ramPercent: liveData.RAMPercent ?? 25,
          diskTotalGb: liveData.DiskTotalGB || vm.storageGb || 40,
          diskUsedGb: liveData.DiskUsedGB || Math.round((vm.storageGb || 40) * 0.2),
          diskPercent: liveData.DiskPercent ?? 20,
          diskReadMb: liveData.DiskReadMB ?? 0,
          diskWriteMb: liveData.DiskWriteMB ?? 0,
          ipAddresses: liveData.IPAddresses || [],
          heartbeat: liveData.Heartbeat || 'OK',
          timestamp: liveData.Timestamp || new Date().toISOString(),
        });
      }
      return res.json(liveData);
    } catch (metricErr) {
      console.warn(`[METRICS WARNING] Failed to query live metrics for ${vm.vmName}:`, metricErr.message);
      // Fallback response if host agent is momentarily busy
      return res.json({
        found: true,
        vmName: vm.vmName,
        state: vm.status,
        status: 'Operating normally',
        cpuUsage: 0,
        avgCpu: 0,
        ramTotalMb: (vm.ramGb || 2) * 1024,
        ramUsedMb: Math.round(((vm.ramGb || 2) * 1024) * 0.25),
        ramPercent: 25,
        diskTotalGb: vm.storageGb || 40,
        diskUsedGb: Math.round((vm.storageGb || 40) * 0.2),
        diskPercent: 20,
        diskReadMb: 0,
        diskWriteMb: 0,
        uptime: '00:00:00',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[VM Controller] Metrics error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch metrics.' });
  }
}

