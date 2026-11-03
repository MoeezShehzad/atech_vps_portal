import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyMembers,
  inviteCompanyMember,
  updateMemberRole,
  removeCompanyMember,
  getMyOrganizations,
  getInviteDetails,
  acceptCompanyInvite,
  activateInvitedUser,
} from '../controllers/companyController.js';

const router = express.Router();

// Public invitation token inspection route
router.get('/invite/:token', getInviteDetails);

// Public invitation account activation route (new user registers and activates via invite)
router.post('/invite/activate', activateInvitedUser);

// All following company routes require authenticated user session
router.use(authenticateToken);

// Accept invitation (for existing/logged-in users)
router.post('/invite/accept', acceptCompanyInvite);

router.get('/my-organizations', getMyOrganizations);
router.get('/profile', getCompanyProfile);
router.patch('/profile', updateCompanyProfile);
router.get('/members', getCompanyMembers);
router.post('/members/invite', inviteCompanyMember);
router.patch('/members/:memberId/role', updateMemberRole);
router.delete('/members/:memberId', removeCompanyMember);

export default router;
