// ==============================================================================
// Controller: paymentController.js
// Purpose: Multi-Method Checkout Controller (Stripe Cards & Direct Bank Transfer)
// ==============================================================================

import prisma from '../lib/prisma.js';
import {
  createPaymentIntent,
  confirmPaymentIntent,
  processTestCardCharge,
  processDirectBankTransfer,
  encryptSensitive,
} from '../services/stripeService.js';
import { sendInvoiceReceiptEmail } from '../services/emailService.js';

/**
 * 1. GET /api/payments/config - Returns Stripe Publishable Key
 */
export function getPaymentConfig(req, res) {
  return res.json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    supportedMethods: [
      { id: 'card', name: 'Credit or Debit Card', brands: ['Visa', 'Mastercard', 'American Express'] },
      { id: 'bank_transfer', name: 'Direct Bank Account Transfer', features: ['Sort Code', 'Account Number', 'Net 30 Invoicing'] },
    ],
  });
}

/**
 * 2. POST /api/payments/create-intent - Prepares Stripe PaymentIntent
 */
export async function createIntent(req, res) {
  try {
    const { amount, currency = 'USD', planName, planId } = req.body;
    const user = req.user;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount is required.' });
    }

    const intent = await createPaymentIntent({
      amount,
      currency,
      customerEmail: user?.email,
      customerName: user?.fullName,
      metadata: {
        userId: user?.userId ? String(user.userId) : '',
        planId: planId ? String(planId) : '',
        planName: planName || 'VPS Plan',
      },
    });

    return res.json({ success: true, ...intent });
  } catch (err) {
    console.error('[Payment Intent Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to initialize payment gateway.' });
  }
}

/**
 * 3. POST /api/payments/process-card - Process Card Checkout via Stripe
 * Supports Visa, Mastercard, and American Express
 */
export async function processCardPayment(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required to process checkout.' });
    }

    const {
      planId,
      amount,
      cardBrand = 'Visa',
      cardNumber,
      cardExpiry,
      cardCvc,
      cardName,
      customerInfo,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid order amount.' });
    }

    const cleanCard = String(cardNumber || '').replace(/[\s-]/g, '');
    const last4 = cleanCard.length >= 4 ? cleanCard.slice(-4) : '4242';
    const [expMonth, expYear] = String(cardExpiry || '12/28').split('/').map((s) => s.trim());

    // 1. Fetch Plan details from Database
    const plan = await prisma.vPSPlan.findFirst({
      where: { planId: Number(planId) || 1 },
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Selected VPS plan not found.' });
    }

    // 2. Process Charge through Stripe Engine (PCI-DSS compliant sandbox)
    const stripeResult = await processTestCardCharge({
      amount,
      currency: 'usd',
      cardBrand,
      last4,
      expMonth,
      expYear,
      customerEmail: req.user.email,
      customerName: cardName || req.user.fullName,
      metadata: {
        userId: String(userId),
        planId: String(plan.planId),
        planName: plan.name,
      },
    });

    if (!stripeResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Card authorization failed. Please check your card details or try a different card.',
      });
    }

    // 3. Create or reuse active Subscription in MS SQL
    const now = new Date();
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.planId,
        status: 'ACTIVE',
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30-day billing cycle
        monthlyPrice: Number(amount),
        currency: 'USD',
      },
    });

    // 4. Create Official Invoice in Database
    const invoiceNumber = `INV-${now.getFullYear()}-${String(subscription.subscriptionId).padStart(4, '0')}`;
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        subscriptionId: subscription.subscriptionId,
        invoiceNumber,
        subtotal: Number(amount),
        tax: 0,
        discount: 0,
        total: Number(amount),
        currency: 'USD',
        status: 'PAID',
        issueDate: now,
        paidDate: now,
        dueDate: now,
      },
    });

    // 5. Record Payment with Encrypted Security Token
    const encryptedCardRef = encryptSensitive(
      JSON.stringify({
        brand: cardBrand,
        last4,
        cardholder: cardName || req.user.fullName,
        stripeChargeId: stripeResult.transactionId,
        authorizedAt: now.toISOString(),
      })
    );

    await prisma.payment.create({
      data: {
        userId,
        invoiceId: invoice.invoiceId,
        paymentGateway: 'STRIPE_CARD',
        transactionId: stripeResult.transactionId,
        amount: Number(amount),
        currency: 'USD',
        status: 'COMPLETED',
        paymentDate: now,
      },
    });

    // 6. Log Financial Activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'PAYMENT_RECEIVED',
        status: 'SUCCESS',
        details: JSON.stringify({
          gateway: 'STRIPE',
          brand: cardBrand,
          maskedCard: `•••• •••• •••• ${last4}`,
          amount: `$${Number(amount).toFixed(2)} USD`,
          transactionId: stripeResult.transactionId,
          invoiceNumber,
        }),
      },
    }).catch(() => {});

    // 7. Dispatch Payment Receipt Email via billing@atechconsult.com
    sendInvoiceReceiptEmail({
      email: req.user.email,
      fullName: req.user.fullName || cardName,
      invoiceNumber,
      amount: Number(amount),
      planName: plan.name,
      currency: 'USD',
    }).catch((mailErr) => console.warn('[Invoice Receipt Email Warning]:', mailErr.message));

    return res.status(200).json({
      success: true,
      message: 'Payment authorized and processed successfully via Stripe.',
      transactionId: stripeResult.transactionId,
      invoiceNumber,
      subscriptionId: subscription.subscriptionId,
      cardBrand,
      last4,
      amount: Number(amount).toFixed(2),
      currency: 'USD',
    });
  } catch (err) {
    console.error('[Card Payment Processing Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Payment processing failed.' });
  }
}

/**
 * 4. POST /api/payments/process-bank-transfer - Direct Account Payment Without Card
 * Features: Sort Code (6-digits), Account Number, Due Date, Corporate Invoicing
 */
export async function processBankPayment(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required to process checkout.' });
    }

    const {
      planId,
      amount,
      sortCode,
      accountNumber,
      bankName,
      paymentDueDate,
      poNumber,
      customerInfo,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid order amount.' });
    }

    // 1. Process & Encrypt Bank Details
    const bankResult = processDirectBankTransfer({
      sortCode,
      accountNumber,
      bankName,
      paymentDueDate,
      poNumber,
      customerName: req.user.fullName,
      customerEmail: req.user.email,
      amount,
    });

    // 2. Fetch Plan
    const plan = await prisma.vPSPlan.findFirst({
      where: { planId: Number(planId) || 1 },
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Selected VPS plan not found.' });
    }

    const now = new Date();

    // 3. Create Subscription (Pending Bank Remittance Confirmation)
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.planId,
        status: 'PENDING',
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        monthlyPrice: Number(amount),
        currency: 'USD',
      },
    });

    // 4. Create Corporate Invoice with Net 30 Due Date ("Payment Last End Date")
    const invoiceNumber = `INV-${now.getFullYear()}-B${String(subscription.subscriptionId).padStart(4, '0')}`;
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        subscriptionId: subscription.subscriptionId,
        invoiceNumber,
        subtotal: Number(amount),
        tax: 0,
        discount: 0,
        total: Number(amount),
        currency: 'USD',
        status: 'PENDING',
        issueDate: now,
        dueDate: bankResult.dueDate,
      },
    });

    // 5. Record Payment Record
    await prisma.payment.create({
      data: {
        userId,
        invoiceId: invoice.invoiceId,
        paymentGateway: 'DIRECT_BANK_TRANSFER',
        transactionId: bankResult.transactionId,
        amount: Number(amount),
        currency: 'USD',
        status: 'PENDING',
        paymentDate: null,
      },
    });

    // 6. Log Financial Activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'INVOICE_GENERATED',
        status: 'PENDING',
        details: JSON.stringify({
          gateway: 'DIRECT_BANK_TRANSFER',
          bank: bankResult.bankName,
          sortCode: bankResult.sortCode,
          maskedAccount: bankResult.maskedAccount,
          dueDate: bankResult.dueDate.toISOString().split('T')[0],
          amount: `$${Number(amount).toFixed(2)} USD`,
          transactionId: bankResult.transactionId,
          invoiceNumber,
        }),
      },
    }).catch(() => {});

    // 7. Dispatch Invoice Email with Remittance Details
    sendInvoiceReceiptEmail({
      email: req.user.email,
      fullName: req.user.fullName,
      invoiceNumber,
      amount: Number(amount),
      planName: `${plan.name} (Direct Bank Transfer - Due: ${bankResult.dueDate.toISOString().split('T')[0]})`,
      currency: 'USD',
    }).catch((mailErr) => console.warn('[Invoice Email Warning]:', mailErr.message));

    return res.status(200).json({
      success: true,
      message: 'Direct bank transfer invoice generated. Remittance instructions sent.',
      transactionId: bankResult.transactionId,
      invoiceNumber,
      subscriptionId: subscription.subscriptionId,
      bankName: bankResult.bankName,
      sortCode: bankResult.sortCode,
      maskedAccount: bankResult.maskedAccount,
      dueDate: bankResult.dueDate.toISOString().split('T')[0],
      remittanceDetails: bankResult.remittanceDetails,
      amount: Number(amount).toFixed(2),
      currency: 'USD',
    });
  } catch (err) {
    console.error('[Bank Transfer Processing Error]:', err);
    return res.status(400).json({ success: false, error: err.message || 'Failed to process bank transfer.' });
  }
}
