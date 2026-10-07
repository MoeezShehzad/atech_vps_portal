import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
  getSSHKeys,
  addSSHKey,
  deleteSSHKey,
  generateSSHKeyPair,
} from '../controllers/sshKeyController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getSSHKeys);
router.post('/', addSSHKey);
router.delete('/:keyId', deleteSSHKey);
router.post('/generate', generateSSHKeyPair);

export default router;
