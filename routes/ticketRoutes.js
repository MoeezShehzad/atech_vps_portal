// ==============================================================================
// Routes: ticketRoutes.js
// Purpose: Mounts customer support ticket endpoints with JWT authentication
// ==============================================================================

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getUserTickets,
  createTicket,
  getTicketDetails,
  closeUserTicket,
} from '../controllers/ticketController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUserTickets);
router.post('/', createTicket);
router.get('/:id', getTicketDetails);
router.patch('/:id/close', closeUserTicket);

export default router;
