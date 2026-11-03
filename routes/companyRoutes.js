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
} from '../controllers/companyController.js';

const router = express.Router();

// Public invitation token inspection route
router.get('/invite/:token', getInviteDetails);

// All following company routes require authenticated user session
router.use(authenticateToken);

// Accept invitation
router.post('/invite/accept', acceptCompanyInvite);

router.get('/my-organizations', getMyOrganizations);
router.get('/profile', getCompanyProfile);
router.patch('/profile', updateCompanyProfile);
router.get('/members', getCompanyMembers);
router.post('/members/invite', inviteCompanyMember);
router.patch('/members/:memberId/role', updateMemberRole);
router.delete('/members/:memberId', removeCompanyMember);

export default router;
