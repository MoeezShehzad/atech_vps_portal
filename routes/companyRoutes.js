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
} from '../controllers/companyController.js';

const router = express.Router();

// All company routes require authenticated user session
router.use(authenticateToken);

router.get('/my-organizations', getMyOrganizations);
router.get('/profile', getCompanyProfile);
router.patch('/profile', updateCompanyProfile);
router.get('/members', getCompanyMembers);
router.post('/members/invite', inviteCompanyMember);
router.patch('/members/:memberId/role', updateMemberRole);
router.delete('/members/:memberId', removeCompanyMember);

export default router;
