// ==============================================================================
// Routes: billingRoutes.js
// Purpose: API endpoints for subscriptions, invoices, and billing history
// ==============================================================================

import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import { 
  getBillingOverview, 
  getInvoiceDetails,
  cancelTrialSubscription,
  getRevealedPaymentMethod,
  activateTrialSubscription,
  reactivateSubscriptionEndpoint,
  simulateSuspensionEndpoint,
  deactivateSubscriptionEndpoint,
} from '../controllers/billingController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/overview', getBillingOverview);
router.get('/invoices/:id', getInvoiceDetails);
router.post('/cancel-trial', cancelTrialSubscription);
router.post('/activate-trial', activateTrialSubscription);
router.get('/payment-method/reveal', getRevealedPaymentMethod);
router.post('/reactivate-subscription', reactivateSubscriptionEndpoint);
router.post('/simulate-suspension', simulateSuspensionEndpoint);
router.post('/deactivate-subscription', deactivateSubscriptionEndpoint);

export default router;
