// ==============================================================================
// Controller: policyController.js
// Purpose: Multi-target Legal Policy Versioning, Archiving, & User Notification Engine
// Targets: Terms of Service, Privacy Policy, Refund Policy, etc.
// ==============================================================================

import prisma from '../lib/prisma.js';
import { startBroadcastCampaign } from '../services/safeBroadcastService.js';

/**
 * Normalizes policy type slug
 */
function normalizePolicyType(type) {
  if (!type) return '';
  const lower = String(type).trim().toLowerCase();
  if (lower === 'terms' || lower === 'terms-and-conditions' || lower === 'tos') {
    return 'terms-of-service';
  }
  if (lower === 'privacy') {
    return 'privacy-policy';
  }
  if (lower === 'refund' || lower === 'cancellation') {
    return 'refund-policy';
  }
  return lower;
}

/**
 * GET /api/policies/:policyType
 * Public endpoint: Returns the currently active (effective) policy version
 */
export async function getPublicPolicy(req, res) {
  try {
    const policyType = normalizePolicyType(req.params.policyType);
    if (!policyType) {
      return res.status(400).json({ error: 'Valid policyType parameter required' });
    }

    const policy = await prisma.legalPolicyVersion.findFirst({
      where: {
        policyType,
        isCurrent: true,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        policyType: true,
        title: true,
        version: true,
        content: true,
        summaryOfChanges: true,
        effectiveAt: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    if (!policy) {
      return res.status(404).json({
        error: 'Active policy version not found in database',
        fallbackNeeded: true,
      });
    }

    return res.json({ success: true, policy });
  } catch (error) {
    console.error('[getPublicPolicy Error]:', error);
    return res.status(500).json({ error: 'Failed to retrieve policy version' });
  }
}

/**
 * GET /api/policies/:policyType/versions
 * Public endpoint: Lists all public / archived versions of a policy
 */
export async function getPolicyVersions(req, res) {
  try {
    const policyType = normalizePolicyType(req.params.policyType);
    if (!policyType) {
      return res.status(400).json({ error: 'Valid policyType parameter required' });
    }

    const versions = await prisma.legalPolicyVersion.findMany({
      where: {
        policyType,
        status: { in: ['PUBLISHED', 'ARCHIVED'] },
      },
      select: {
        id: true,
        policyType: true,
        title: true,
        version: true,
        summaryOfChanges: true,
        status: true,
        isCurrent: true,
        effectiveAt: true,
        publishedAt: true,
        archivedAt: true,
      },
      orderBy: { effectiveAt: 'desc' },
    });

    return res.json({ success: true, versions });
  } catch (error) {
    console.error('[getPolicyVersions Error]:', error);
    return res.status(500).json({ error: 'Failed to list policy versions' });
  }
}

/**
 * GET /api/policies/:policyType/versions/:version
 * Public endpoint: Retrieves a specific historical/archived version
 */
export async function getPolicyVersionDetail(req, res) {
  try {
    const policyType = normalizePolicyType(req.params.policyType);
    const { version } = req.params;

    const policy = await prisma.legalPolicyVersion.findFirst({
      where: {
        policyType,
        version,
        status: { in: ['PUBLISHED', 'ARCHIVED'] },
      },
      select: {
        id: true,
        policyType: true,
        title: true,
        version: true,
        content: true,
        summaryOfChanges: true,
        status: true,
        isCurrent: true,
        effectiveAt: true,
        publishedAt: true,
        archivedAt: true,
      },
    });

    if (!policy) {
      return res.status(404).json({ error: 'Historical policy version not found' });
    }

    return res.json({ success: true, policy });
  } catch (error) {
    console.error('[getPolicyVersionDetail Error]:', error);
    return res.status(500).json({ error: 'Failed to retrieve historical policy version' });
  }
}

// ==============================================================================
// Admin Management Suite (Protected by authenticateToken + requireAdmin)
// ==============================================================================

/**
 * GET /api/policies/admin/all
 * Lists all policy versions across all types including DRAFTS and ARCHIVES
 */
export async function getAdminPolicies(req, res) {
  try {
    const policies = await prisma.legalPolicyVersion.findMany({
      include: {
        createdBy: {
          select: {
            userId: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { policyType: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return res.json({ success: true, policies });
  } catch (error) {
    console.error('[getAdminPolicies Error]:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin policies' });
  }
}

/**
 * POST /api/policies/admin
 * Creates a new policy draft or directly publishes as active
 */
export async function createAdminPolicyVersion(req, res) {
  try {
    const {
      policyType: rawType,
      title,
      version,
      content,
      summaryOfChanges,
      status = 'DRAFT',
      effectiveAt,
      makeCurrent = false,
    } = req.body;

    const policyType = normalizePolicyType(rawType);
    if (!policyType || !title || !version || !content) {
      return res.status(400).json({
        error: 'policyType, title, version, and content are required fields',
      });
    }

    const userId = req.user?.userId ? Number(req.user.userId) : null;
    const now = new Date();
    const effectiveDate = effectiveAt ? new Date(effectiveAt) : now;

    let createdRecord;

    if (makeCurrent) {
      // Run atomic transaction: Archive currently active version and set new one as current
      createdRecord = await prisma.$transaction(async (tx) => {
        await tx.legalPolicyVersion.updateMany({
          where: {
            policyType,
            isCurrent: true,
          },
          data: {
            isCurrent: false,
            status: 'ARCHIVED',
            archivedAt: now,
          },
        });

        return tx.legalPolicyVersion.create({
          data: {
            policyType,
            title: title.trim(),
            version: version.trim(),
            content,
            summaryOfChanges: summaryOfChanges ? summaryOfChanges.trim() : null,
            status: 'PUBLISHED',
            isCurrent: true,
            effectiveAt: effectiveDate,
            publishedAt: now,
            createdById: userId,
          },
        });
      });
    } else {
      createdRecord = await prisma.legalPolicyVersion.create({
        data: {
          policyType,
          title: title.trim(),
          version: version.trim(),
          content,
          summaryOfChanges: summaryOfChanges ? summaryOfChanges.trim() : null,
          status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
          isCurrent: false,
          effectiveAt: effectiveDate,
          publishedAt: status === 'PUBLISHED' ? now : null,
          createdById: userId,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Policy ${createdRecord.version} created successfully`,
      policy: createdRecord,
    });
  } catch (error) {
    console.error('[createAdminPolicyVersion Error]:', error);
    return res.status(500).json({ error: 'Failed to create policy version' });
  }
}

/**
 * PUT /api/policies/admin/:id
 * Updates an existing draft or active policy version
 */
export async function updateAdminPolicyVersion(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid policy ID' });
    }

    const existing = await prisma.legalPolicyVersion.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Policy version not found' });
    }

    const {
      title,
      version,
      content,
      summaryOfChanges,
      effectiveAt,
      status,
    } = req.body;

    const dataToUpdate = {
      updatedAt: new Date(),
    };

    if (title !== undefined) dataToUpdate.title = title.trim();
    if (version !== undefined) dataToUpdate.version = version.trim();
    if (content !== undefined) dataToUpdate.content = content;
    if (summaryOfChanges !== undefined) dataToUpdate.summaryOfChanges = summaryOfChanges ? summaryOfChanges.trim() : null;
    if (effectiveAt !== undefined) dataToUpdate.effectiveAt = new Date(effectiveAt);
    if (status !== undefined && !existing.isCurrent) {
      dataToUpdate.status = status;
    }

    const updated = await prisma.legalPolicyVersion.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json({
      success: true,
      message: 'Policy updated successfully',
      policy: updated,
    });
  } catch (error) {
    console.error('[updateAdminPolicyVersion Error]:', error);
    return res.status(500).json({ error: 'Failed to update policy version' });
  }
}

/**
 * POST /api/policies/admin/:id/publish
 * Sets a specific policy version as CURRENT and actively published,
 * automatically archiving the previously current version.
 */
export async function publishAdminPolicyVersion(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid policy ID' });
    }

    const target = await prisma.legalPolicyVersion.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ error: 'Policy version not found' });
    }

    const now = new Date();

    const published = await prisma.$transaction(async (tx) => {
      // 1. Archive previous current version of the same policyType
      await tx.legalPolicyVersion.updateMany({
        where: {
          policyType: target.policyType,
          isCurrent: true,
          id: { not: id },
        },
        data: {
          isCurrent: false,
          status: 'ARCHIVED',
          archivedAt: now,
        },
      });

      // 2. Set target version as current & published
      return tx.legalPolicyVersion.update({
        where: { id },
        data: {
          isCurrent: true,
          status: 'PUBLISHED',
          publishedAt: target.publishedAt || now,
          archivedAt: null,
          updatedAt: now,
        },
      });
    });

    return res.json({
      success: true,
      message: `Version ${published.version} is now the active live ${published.title}`,
      policy: published,
    });
  } catch (error) {
    console.error('[publishAdminPolicyVersion Error]:', error);
    return res.status(500).json({ error: 'Failed to activate policy version' });
  }
}

/**
 * DELETE /api/policies/admin/:id
 * Deletes a draft or archived policy version (Blocks deleting the currently live active policy)
 */
export async function deleteAdminPolicyVersion(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid policy ID' });
    }

    const target = await prisma.legalPolicyVersion.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ error: 'Policy version not found' });
    }

    if (target.isCurrent) {
      return res.status(400).json({
        error: 'Cannot delete the currently active policy version. Please activate another version first or change its status.',
      });
    }

    await prisma.legalPolicyVersion.delete({ where: { id } });

    return res.json({
      success: true,
      message: `Policy version ${target.version} deleted successfully`,
    });
  } catch (error) {
    console.error('[deleteAdminPolicyVersion Error]:', error);
    return res.status(500).json({ error: 'Failed to delete policy version' });
  }
}

/**
 * POST /api/policies/admin/:id/broadcast
 * MANUALLY triggers email broadcast to users regarding the updated policy.
 * Only sends when admin explicitly clicks the broadcast button.
 */
export async function broadcastPolicyUpdate(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid policy ID' });
    }

    const policy = await prisma.legalPolicyVersion.findUnique({ where: { id } });
    if (!policy) {
      return res.status(404).json({ error: 'Policy version not found' });
    }

    const {
      customMessage,
      targetAudience = 'ALL_USERS',
      channels = { inApp: true, email: true },
    } = req.body;

    const effectiveDateStr = new Date(policy.effectiveAt).toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const portalBaseUrl = process.env.VITE_APP_URL || process.env.BASE_URL || 'https://atechconsult.com';
    const policyUrl = `${portalBaseUrl}/${policy.policyType}`;

    // Format clean professional notification copy
    const broadcastTitle = `Important Notice: Updated ${policy.title} (${policy.version})`;
    
    let broadcastMessage = `Dear Valued Customer,\n\nWe have updated our ${policy.title} (${policy.version}), effective as of ${effectiveDateStr}.\n\n`;
    
    if (policy.summaryOfChanges) {
      broadcastMessage += `Key Changes & Updates:\n${policy.summaryOfChanges}\n\n`;
    }
    
    if (customMessage) {
      broadcastMessage += `Note from Management:\n${customMessage}\n\n`;
    }

    broadcastMessage += `Please review the complete updated terms at your convenience:\n${policyUrl}\n\nThank you for choosing Atech Cloud & VPS Services.`;

    const adminEmail = req.user?.email || 'admin@atechconsult.com';

    // Dispatch via safe throttled broadcast campaign
    const campaignResult = await startBroadcastCampaign({
      title: broadcastTitle,
      message: broadcastMessage,
      targetAudience,
      channels,
      adminEmail,
    });

    // Update audit record on the policy version
    const now = new Date();
    await prisma.legalPolicyVersion.update({
      where: { id },
      data: {
        lastNotifiedAt: now,
        notifiedCount: { increment: 1 },
      },
    });

    return res.json({
      success: true,
      message: `Broadcast notification successfully queued for ${campaignResult.totalRecipients || 'all'} users.`,
      jobId: campaignResult.jobId,
      effectiveDate: effectiveDateStr,
      lastNotifiedAt: now,
    });
  } catch (error) {
    console.error('[broadcastPolicyUpdate Error]:', error);
    return res.status(500).json({ error: 'Failed to initiate policy notification broadcast' });
  }
}
