import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { sendVerificationEmail, sendTeamInvitationEmail } from '../services/emailService.js';

/**
 * Helper to retrieve or automatically initialize the user's organization.
 * Ensures backward compatibility with users registered before the table existed.
 */
export async function getOrCreateUserOrg(userId) {
  // 1. Check if user owns an organization
  let org = await prisma.organization.findFirst({
    where: { ownerId: userId },
    include: {
      owner: {
        select: {
          userId: true,
          fullName: true,
          email: true,
          companyName: true,
          companySize: true,
          avatar_url: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              userId: true,
              fullName: true,
              email: true,
              avatar_url: true,
            },
          },
        },
        orderBy: { invitedAt: 'desc' },
      },
    },
  });

  if (org) return org;

  // 2. Check if user is a member of an organization
  const membership = await prisma.organizationMember.findFirst({
    where: { userId, status: 'active' },
    include: {
      organization: {
        include: {
          owner: {
            select: {
              userId: true,
              fullName: true,
              email: true,
              companyName: true,
              companySize: true,
              avatar_url: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  userId: true,
                  fullName: true,
                  email: true,
                  avatar_url: true,
                },
              },
            },
            orderBy: { invitedAt: 'desc' },
          },
        },
      },
    },
  });

  if (membership) return membership.organization;

  // 3. If user is accountType === 'company' or has companyName, auto-provision their organization
  const user = await prisma.user.findUnique({
    where: { userId },
  });

  if (user && (user.accountType === 'company' || user.companyName)) {
    const orgName = (user.companyName && user.companyName.trim()) || `${user.fullName}'s Organization`;
    const newOrg = await prisma.organization.create({
      data: {
        name: orgName,
        ownerId: user.userId,
        companySize: user.companySize || '10-49',
        billingEmail: user.email,
      },
    });

    // Auto-add owner as an active member with role 'owner'
    await prisma.organizationMember.create({
      data: {
        orgId: newOrg.orgId,
        userId: user.userId,
        invitedEmail: user.email,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
      },
    });

    return await prisma.organization.findUnique({
      where: { orgId: newOrg.orgId },
      include: {
        owner: {
          select: {
            userId: true,
            fullName: true,
            email: true,
            companyName: true,
            companySize: true,
            avatar_url: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                userId: true,
                fullName: true,
                email: true,
                avatar_url: true,
              },
            },
          },
          orderBy: { invitedAt: 'desc' },
        },
      },
    });
  }

  return null;
}

/**
 * GET /api/company/profile
 * Returns organization details, owner, and active member count.
 */
export const getCompanyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const org = await getOrCreateUserOrg(userId);

    if (!org) {
      return res.status(404).json({
        error: 'No organization found for this user account.',
      });
    }

    const isOwner = org.ownerId === userId;
    const currentMember = org.members.find((m) => m.userId === userId);
    const currentUserRole = isOwner ? 'owner' : currentMember?.role || 'viewer';

    return res.json({
      success: true,
      organization: {
        orgId: org.orgId,
        name: org.name,
        companySize: org.companySize,
        billingEmail: org.billingEmail,
        taxId: org.taxId,
        createdAt: org.createdAt,
        owner: org.owner,
        totalMembers: org.members.filter((m) => m.status === 'active').length,
        pendingInvites: org.members.filter((m) => m.status === 'invited').length,
        currentUserRole,
        isOwner,
      },
    });
  } catch (err) {
    console.error('[getCompanyProfile Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve company profile.' });
  }
};

/**
 * PATCH /api/company/profile
 * Update company name, size, billing email, or tax ID.
 */
export const updateCompanyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const org = await getOrCreateUserOrg(userId);

    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    // Only Owner or Admin can update organization settings
    const isOwner = org.ownerId === userId;
    const member = org.members.find((m) => m.userId === userId);
    if (!isOwner && member?.role !== 'admin') {
      return res.status(403).json({ error: 'Only company owners and admins can update company details.' });
    }

    const { name, companySize, billingEmail, taxId } = req.body;

    const updated = await prisma.organization.update({
      where: { orgId: org.orgId },
      data: {
        name: name ? name.trim() : undefined,
        companySize: companySize || undefined,
        billingEmail: billingEmail ? billingEmail.trim().toLowerCase() : undefined,
        taxId: taxId !== undefined ? taxId.trim() : undefined,
      },
    });

    return res.json({
      success: true,
      message: 'Company profile updated successfully.',
      organization: updated,
    });
  } catch (err) {
    console.error('[updateCompanyProfile Error]:', err);
    return res.status(500).json({ error: 'Failed to update company profile.' });
  }
};

/**
 * GET /api/company/members
 * Returns list of team members and invitations.
 */
export const getCompanyMembers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const org = await getOrCreateUserOrg(userId);

    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const formattedMembers = org.members.map((m) => {
      const isOwner = m.userId === org.ownerId || m.role === 'owner';
      return {
        memberId: m.memberId,
        userId: m.userId,
        fullName: m.user?.fullName || (isOwner ? org.owner.fullName : 'Invited Member'),
        email: m.user?.email || m.invitedEmail,
        avatarUrl: m.user?.avatar_url || null,
        role: isOwner ? 'owner' : m.role,
        status: m.status,
        invitedAt: m.invitedAt,
        joinedAt: m.joinedAt,
        isOwner,
      };
    });

    return res.json({
      success: true,
      members: formattedMembers,
    });
  } catch (err) {
    console.error('[getCompanyMembers Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve team members.' });
  }
};

/**
 * POST /api/company/members/invite
 * Invite a new member by email with a role assignment.
 */
export const inviteCompanyMember = async (req, res) => {
  try {
    const userId = req.user.userId;
    const org = await getOrCreateUserOrg(userId);

    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const isOwner = org.ownerId === userId;
    const member = org.members.find((m) => m.userId === userId);
    if (!isOwner && member?.role !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can invite team members.' });
    }

    const { email, role = 'devops' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is already in this organization
    const existingMember = org.members.find(
      (m) => (m.user?.email || m.invitedEmail).toLowerCase() === normalizedEmail
    );

    if (existingMember) {
      if (existingMember.status === 'active') {
        return res.status(400).json({ error: 'A user with this email is already an active member of this organization.' });
      }
      return res.status(400).json({ error: 'An invitation is already pending for this email address.' });
    }

    // Check if user already exists in ATC Cloud
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const inviteToken = crypto.randomBytes(32).toString('hex');

    const newMember = await prisma.organizationMember.create({
      data: {
        orgId: org.orgId,
        userId: existingUser ? existingUser.userId : null,
        invitedEmail: normalizedEmail,
        role: ['admin', 'devops', 'viewer', 'billing'].includes(role) ? role : 'devops',
        status: existingUser ? 'active' : 'invited',
        inviteToken,
        joinedAt: existingUser ? new Date() : null,
      },
      include: {
        user: {
          select: {
            userId: true,
            fullName: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    // Dispatch team invitation email via Corporate SMTP
    const inviterName = org.owner.fullName || "Your Team Administrator";
    sendTeamInvitationEmail({
      email: normalizedEmail,
      inviterName,
      companyName: org.name,
      role: newMember.role,
      inviteToken,
      isExistingUser: !!existingUser,
    }).catch((emailErr) => {
      console.error("[Team Invite Email Dispatch Warning]:", emailErr);
    });

    return res.status(201).json({
      success: true,
      message: existingUser
        ? `Added ${existingUser.fullName} directly to your organization team! An email notification has been sent.`
        : `Invitation email sent to ${normalizedEmail}.`,
      member: {
        memberId: newMember.memberId,
        userId: newMember.userId,
        fullName: newMember.user?.fullName || 'Invited Member',
        email: newMember.invitedEmail,
        avatarUrl: newMember.user?.avatar_url || null,
        role: newMember.role,
        status: newMember.status,
        invitedAt: newMember.invitedAt,
        joinedAt: newMember.joinedAt,
        isOwner: false,
      },
    });
  } catch (err) {
    console.error('[inviteCompanyMember Error]:', err);
    return res.status(500).json({ error: 'Failed to dispatch team invitation.' });
  }
};

/**
 * PATCH /api/company/members/:memberId/role
 * Change a member's role.
 */
export const updateMemberRole = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { memberId } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'devops', 'viewer', 'billing'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected.' });
    }

    const org = await getOrCreateUserOrg(userId);
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const isOwner = org.ownerId === userId;
    const callerMember = org.members.find((m) => m.userId === userId);
    if (!isOwner && callerMember?.role !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can modify member roles.' });
    }

    const target = await prisma.organizationMember.findUnique({
      where: { memberId: parseInt(memberId, 10) },
    });

    if (!target || target.orgId !== org.orgId) {
      return res.status(404).json({ error: 'Member not found in your organization.' });
    }

    if (target.role === 'owner' || target.userId === org.ownerId) {
      return res.status(400).json({ error: 'Cannot change the role of the organization owner.' });
    }

    const updated = await prisma.organizationMember.update({
      where: { memberId: target.memberId },
      data: { role },
    });

    return res.json({
      success: true,
      message: 'Member role updated successfully.',
      member: updated,
    });
  } catch (err) {
    console.error('[updateMemberRole Error]:', err);
    return res.status(500).json({ error: 'Failed to update member role.' });
  }
};

/**
 * DELETE /api/company/members/:memberId
 * Remove a member or revoke invitation.
 */
export const removeCompanyMember = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { memberId } = req.params;

    const org = await getOrCreateUserOrg(userId);
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    const isOwner = org.ownerId === userId;
    const callerMember = org.members.find((m) => m.userId === userId);
    if (!isOwner && callerMember?.role !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can remove team members.' });
    }

    const target = await prisma.organizationMember.findUnique({
      where: { memberId: parseInt(memberId, 10) },
    });

    if (!target || target.orgId !== org.orgId) {
      return res.status(404).json({ error: 'Member not found in your organization.' });
    }

    if (target.role === 'owner' || target.userId === org.ownerId) {
      return res.status(400).json({ error: 'Cannot remove the organization owner.' });
    }

    await prisma.organizationMember.delete({
      where: { memberId: target.memberId },
    });

    return res.json({
      success: true,
      message: 'Team member removed successfully.',
    });
  } catch (err) {
    console.error('[removeCompanyMember Error]:', err);
    return res.status(500).json({ error: 'Failed to remove team member.' });
  }
};

/**
 * GET /api/company/my-organizations
 * Returns all organizations the current user belongs to (as owner or active member).
 */
export const getMyOrganizations = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 1. Find orgs owned by user
    const owned = await prisma.organization.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { userId: true, fullName: true, email: true } },
        _count: { select: { members: true } },
      },
    });

    // 2. Find orgs where user is active member
    const memberships = await prisma.organizationMember.findMany({
      where: { userId, status: 'active' },
      include: {
        organization: {
          include: {
            owner: { select: { userId: true, fullName: true, email: true } },
            _count: { select: { members: true } },
          },
        },
      },
    });

    const orgMap = new Map();
    
    // Add owned
    owned.forEach((o) => {
      orgMap.set(o.orgId, {
        orgId: o.orgId,
        name: o.name,
        role: 'owner',
        isOwner: true,
        ownerId: o.ownerId,
        ownerName: o.owner.fullName,
        memberCount: o._count.members,
      });
    });

    // Add member orgs
    memberships.forEach((m) => {
      if (!orgMap.has(m.orgId)) {
        orgMap.set(m.orgId, {
          orgId: m.orgId,
          name: m.organization.name,
          role: m.role,
          isOwner: m.organization.ownerId === userId,
          ownerId: m.organization.ownerId,
          ownerName: m.organization.owner.fullName,
          memberCount: m.organization._count.members,
        });
      }
    });

    return res.json({
      success: true,
      organizations: Array.from(orgMap.values()),
    });
  } catch (err) {
    console.error('[getMyOrganizations Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve organizations.' });
  }
};
