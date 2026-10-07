// ==============================================================================
// Routes: billingRoutes.js
// Purpose: API endpoints for subscriptions, invoices, and billing history
// ==============================================================================

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import { getBillingOverview, getInvoiceDetails } from '../controllers/billingController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/overview', getBillingOverview);
router.get('/invoices/:id', getInvoiceDetails);

export default router;
