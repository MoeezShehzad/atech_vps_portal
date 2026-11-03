import bcrypt from 'bcryptjs';
import { generateAccessToken, createAndStoreRefreshToken, setRefreshTokenCookie } from './authController.js';
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

    const { name, companySize, billingEmail, taxId, ownerPassword } = req.body;

    // Strict Security: Non-owner admins must provide Account Owner's password to authorize org-wide profile updates
    if (!isOwner) {
      if (!ownerPassword) {
        return res.status(403).json({
          requiresOwnerPassword: true,
          error: `Owner authorization required. Please enter the Account Owner's password (${org.owner.fullName || org.owner.email}) to modify company settings.`,
        });
      }

      const ownerUser = await prisma.user.findUnique({
        where: { userId: org.ownerId },
      });

      if (!ownerUser || !ownerUser.passwordHash) {
        return res.status(403).json({
          error: 'Unable to verify owner authorization credentials. Please contact the owner directly.',
        });
      }

      const isPasswordValid = await bcrypt.compare(ownerPassword, ownerUser.passwordHash);
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

      if (!isPasswordValid) {
        await prisma.securityLog.create({
          data: {
            userId,
            action: 'OWNER_AUTHORIZATION_FAILED',
            ipAddress: clientIp,
            result: 'FAILURE',
            details: `Unauthorized attempt to update organization settings for ${org.name} (OrgId: ${org.orgId}) with invalid owner password`,
          },
        }).catch(() => {});

        return res.status(401).json({
          error: "Invalid Account Owner password. Authorization denied.",
        });
      }

      await prisma.securityLog.create({
        data: {
          userId,
          action: 'COMPANY_SETTINGS_MODIFIED_WITH_OWNER_ELEVATION',
          ipAddress: clientIp,
          result: 'SUCCESS',
          details: `Organization ${org.name} settings updated by member ${userId} authorized via owner password elevation`,
        },
      }).catch(() => {});
    }

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
        role: ['admin', 'devops', 'viewer'].includes(role) ? role : 'devops',
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

    const validRoles = ['admin', 'devops', 'viewer'];
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

    // Strict Security: Non-owner admins must provide Account Owner password to modify member roles
    if (!isOwner) {
      const ownerPassword = req.body?.ownerPassword || req.headers['x-owner-password'];
      if (!ownerPassword) {
        return res.status(403).json({
          requiresOwnerPassword: true,
          error: `Owner authorization required. Please enter the Account Owner's password (${org.owner.fullName || org.owner.email}) to modify member access roles.`,
        });
      }

      const ownerUser = await prisma.user.findUnique({
        where: { userId: org.ownerId },
      });

      const isPasswordValid = ownerUser?.passwordHash && (await bcrypt.compare(ownerPassword, ownerUser.passwordHash));
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid Account Owner password. Authorization denied.",
        });
      }
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

    // Strict Security: Non-owner admins must provide Account Owner password to remove team members or revoke invites
    if (!isOwner) {
      const ownerPassword = req.body?.ownerPassword || req.headers['x-owner-password'] || req.query?.ownerPassword;
      if (!ownerPassword) {
        return res.status(403).json({
          requiresOwnerPassword: true,
          error: `Owner authorization required. Please enter the Account Owner's password (${org.owner.fullName || org.owner.email}) to revoke team access.`,
        });
      }

      const ownerUser = await prisma.user.findUnique({
        where: { userId: org.ownerId },
      });

      const isPasswordValid = ownerUser?.passwordHash && (await bcrypt.compare(ownerPassword, ownerUser.passwordHash));
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid Account Owner password. Authorization denied.",
        });
      }
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

/**
 * Automatically link pending organization invitations to a user account
 * based on matching email address.
 */
export const autoLinkPendingInvites = async (userId, userEmail) => {
  if (!userId || !userEmail) return [];
  try {
    const normalizedEmail = userEmail.toLowerCase().trim();
    const pendingInvites = await prisma.organizationMember.findMany({
      where: {
        invitedEmail: normalizedEmail,
        status: 'invited',
      },
      include: {
        organization: true,
      },
    });

    if (pendingInvites.length === 0) return [];

    const activated = [];
    for (const invite of pendingInvites) {
      const updated = await prisma.organizationMember.update({
        where: { memberId: invite.memberId },
        data: {
          userId,
          status: 'active',
          joinedAt: new Date(),
        },
      });
      activated.push(updated);
      console.log(`[AutoLink] Connected User ${userId} (${normalizedEmail}) to Organization ${invite.orgId} (${invite.organization?.name}) as ${invite.role}`);
    }
    return activated;
  } catch (err) {
    console.error('[autoLinkPendingInvites Error]:', err.message);
    return [];
  }
};

/**
 * GET /api/company/invite/:token
 * Public endpoint: Retrieve details of an organization invite by its secure token.
 */
export const getInviteDetails = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ error: 'Invite token is required.' });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { inviteToken: token },
      include: {
        organization: {
          include: {
            owner: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    if (!membership) {
      return res.status(404).json({
        valid: false,
        error: 'This invitation link is invalid or has expired.',
      });
    }

    // Check if a registered user already exists for this invited email
    const existingUser = await prisma.user.findUnique({
      where: { email: membership.invitedEmail.toLowerCase().trim() },
      select: { userId: true, fullName: true, email: true },
    });

    return res.json({
      valid: true,
      invite: {
        memberId: membership.memberId,
        invitedEmail: membership.invitedEmail,
        role: membership.role,
        status: membership.status,
        organization: {
          orgId: membership.organization.orgId,
          name: membership.organization.name,
          companySize: membership.organization.companySize,
          ownerName: membership.organization.owner.fullName,
        },
        userExists: !!existingUser,
      },
    });
  } catch (err) {
    console.error('[getInviteDetails Error]:', err);
    return res.status(500).json({ error: 'Failed to verify invitation token.' });
  }
};

/**
 * POST /api/company/invite/accept
 * Authenticated endpoint: Accept an invitation and link the current user to the organization.
 */
export const acceptCompanyInvite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email.toLowerCase().trim();
    const { token } = req.body;

    let membership = null;
    if (token) {
      membership = await prisma.organizationMember.findFirst({
        where: { inviteToken: token },
        include: {
          organization: {
            include: {
              owner: { select: { fullName: true, email: true } },
            },
          },
        },
      });
    }

    // Fallback: search for any pending invite matching the user's email
    if (!membership) {
      membership = await prisma.organizationMember.findFirst({
        where: {
          invitedEmail: userEmail,
          status: 'invited',
        },
        include: {
          organization: {
            include: {
              owner: { select: { fullName: true, email: true } },
            },
          },
        },
      });
    }

    if (!membership) {
      // Check if user is already an active member of this or another org
      const activeMember = await prisma.organizationMember.findFirst({
        where: { userId, status: 'active' },
        include: { organization: true },
      });

      if (activeMember) {
        return res.json({
          success: true,
          message: 'You are already an active member of this organization workspace.',
          organization: {
            orgId: activeMember.orgId,
            name: activeMember.organization.name,
            role: activeMember.role,
          },
        });
      }

      return res.status(404).json({ error: 'No pending invitation found for your account.' });
    }

    // If already active with this user
    if (membership.status === 'active' && membership.userId === userId) {
      return res.json({
        success: true,
        message: 'You are already an active member of this workspace.',
        organization: {
          orgId: membership.orgId,
          name: membership.organization.name,
          role: membership.role,
        },
      });
    }

    // Activate the membership and link userId
    const updated = await prisma.organizationMember.update({
      where: { memberId: membership.memberId },
      data: {
        userId,
        status: 'active',
        joinedAt: new Date(),
      },
      include: {
        organization: true,
      },
    });

    return res.json({
      success: true,
      message: `You have successfully joined ${updated.organization.name}!`,
      organization: {
        orgId: updated.orgId,
        name: updated.organization.name,
        role: updated.role,
      },
    });
  } catch (err) {
    console.error('[acceptCompanyInvite Error]:', err);
    return res.status(500).json({ error: 'Failed to accept invitation.' });
  }
};


/**
 * POST /api/company/invite/activate
 * Public endpoint: Allows an invited user without an existing account
 * to choose a password, activate their account, and immediately join the organization.
 */
export const activateInvitedUser = async (req, res) => {
  try {
    const { token, fullName, password } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required.' });
    }

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter a valid full name (at least 2 characters).' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Lookup pending invite
    const membership = await prisma.organizationMember.findFirst({
      where: {
        inviteToken: token,
        status: 'invited',
      },
      include: {
        organization: {
          include: {
            owner: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    if (!membership) {
      return res.status(400).json({
        error: 'This invitation token is invalid, has expired, or has already been accepted.',
      });
    }

    const normalizedEmail = membership.invitedEmail.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'An account with this email address already exists. Please sign in to accept the invitation.',
        userExists: true,
      });
    }

    // Securely hash the chosen password
    const passwordHash = await bcrypt.hash(password, 10);

    // Find default Customer role
    const customerRole = await prisma.role.findUnique({
      where: { roleName: 'Customer' },
    });

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    // Execute atomic creation & activation
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          passwordHash,
          emailVerified: true,
          accountType: 'individual',
          isActive: true,
          provider: 'LOCAL',
          lastLoginAt: new Date(),
        },
      });

      if (customerRole) {
        await tx.userRole.create({
          data: {
            userId: createdUser.userId,
            roleId: customerRole.roleId,
          },
        });
      }

      await tx.organizationMember.update({
        where: { memberId: membership.memberId },
        data: {
          userId: createdUser.userId,
          status: 'active',
          joinedAt: new Date(),
          inviteToken: null,
        },
      });

      return createdUser;
    });

    // Auto-link any other pending invites
    await autoLinkPendingInvites(newUser.userId, newUser.email);

    // Audit log
    await prisma.securityLog.create({
      data: {
        userId: newUser.userId,
        action: 'INVITED_USER_ACCOUNT_ACTIVATION',
        ipAddress: clientIp,
        result: 'SUCCESS',
        details: `Activated account and joined organization ${membership.organization.name} as ${membership.role}`,
      },
    }).catch(() => {});

    const roles = ['Customer'];
    const accessToken = generateAccessToken(newUser.userId, newUser.email, roles);
    const refreshToken = await createAndStoreRefreshToken(newUser.userId);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: `Welcome to ${membership.organization.name}! Your account has been activated.`,
      accessToken,
      user: {
        userId: newUser.userId,
        fullName: newUser.fullName,
        email: newUser.email,
        accountType: newUser.accountType,
        roles,
      },
      organization: {
        orgId: membership.organization.orgId,
        name: membership.organization.name,
        role: membership.role,
      },
    });
  } catch (err) {
    console.error('[activateInvitedUser Error]:', err);
    return res.status(500).json({ error: 'Failed to activate account. ' + err.message });
  }
};
