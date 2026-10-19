// ==============================================================================
// Routes: paymentRoutes.js
// Purpose: API endpoints for Stripe Payments and Direct Bank Account Payments
// ==============================================================================

import express from 'express';
import {
  getPaymentConfig,
  createIntent,
  processCardPayment,
  processBankPayment,
  getSavedPaymentMethod,
  handleStripeWebhook,
} from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Stripe Webhook Endpoint (Raw Body Verified)
router.post('/webhook', handleStripeWebhook);

// Public route to retrieve publishable key & supported payment options
router.get('/config', getPaymentConfig);

// Authenticated payment processing routes
router.get('/saved-method', authenticateToken, getSavedPaymentMethod);
router.post('/create-intent', authenticateToken, createIntent);
router.post('/process-card', authenticateToken, processCardPayment);
router.post('/process-bank-transfer', authenticateToken, processBankPayment);

export default router;
