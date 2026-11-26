// ==============================================================================
// Controller: paymentController.js
// Purpose: Multi-Method Checkout Controller (Stripe Cards & Direct Bank Transfer)
// ==============================================================================

import prisma from '../lib/prisma.js';
import {
  stripe,
  getOrCreateStripeCustomer,
  createPaymentIntent,
  retrievePaymentIntent,
  chargeSavedPaymentMethod,
  encodeStripePaymentMethodRef,
  decodeStripePaymentMethodRef,
  formatCardBrand,
  processDirectBankTransfer,
  encryptSensitive,
} from '../services/stripeService.js';
import { sendInvoiceReceiptEmail, sendPaymentFailedEmail } from '../services/emailService.js';

/**
 * Shared Server-Side Anti-Tampering Price Verification for Card Checkout
 */
async function calculateCardOrderPricing({ planId, term = '1m', couponCode, submittedAmount }) {
  const plan = await prisma.vPSPlan.findFirst({
    where: { planId: Number(planId) || 1 },
  });

  if (!plan) {
    const err = new Error('Selected VPS plan not found.');
    err.statusCode = 404;
    throw err;
  }

  const baseMonthly = Number(plan.monthlyPrice);
  const isYearlyOrder = term === '12m' || term === 'yearly';
  const isMultiYearOrder = term === '24m';
  let expectedSubtotal = baseMonthly;
  if (isYearlyOrder) {
    expectedSubtotal = Number((baseMonthly * 12 * 0.95).toFixed(2));
  } else if (isMultiYearOrder) {
    expectedSubtotal = Number((baseMonthly * 24 * 0.85).toFixed(2));
  }

  let couponDiscount = 0;
  if (couponCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: String(couponCode).trim().toUpperCase() },
    });
    const now = new Date();
    if (
      promo &&
      promo.isActive &&
      (!promo.expiresAt || new Date(promo.expiresAt) > now) &&
      (!promo.validFrom || new Date(promo.validFrom) <= now) &&
      promo.timesUsed < promo.maxUses &&
      (!promo.applicablePlanId || promo.applicablePlanId === plan.planId)
    ) {
      if (promo.discountType === 'PERCENT') {
        couponDiscount = Number(((expectedSubtotal * Number(promo.discountValue)) / 100).toFixed(2));
      } else {
        couponDiscount = Math.min(expectedSubtotal, Number(promo.discountValue));
      }
    }
  }

  const netSubtotal = Math.max(0.50, Number((expectedSubtotal - couponDiscount).toFixed(2)));
  // Adjustment #4: When customer pays from credit card, charge 1.5% fee on whole amount, TAX is 0%.
  const expectedFee = Number((netSubtotal * 0.015).toFixed(2));
  const expectedTotal = Number((netSubtotal + expectedFee).toFixed(2));
  const minAuthorizedPrice = Math.max(0.50, expectedTotal);

  const numericSubmitted = Number(submittedAmount);
  if (!Number.isFinite(numericSubmitted) || numericSubmitted < (minAuthorizedPrice - 0.50)) {
    const err = new Error('Order price validation failed. The submitted amount does not match the configured plan pricing.');
    err.statusCode = 400;
    err.isTampering = true;
    err.minAuthorizedPrice = minAuthorizedPrice;
    throw err;
  }

  const authorizedAmount = Number(Math.max(0.50, numericSubmitted).toFixed(2));

  return {
    plan,
    netSubtotal,
    couponDiscount,
    expectedFee,
    expectedTotal,
    minAuthorizedPrice,
    authorizedAmount,
  };
}

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
 * 2. POST /api/payments/create-intent - Prepares a real Stripe PaymentIntent (Live & Test mode)
 */
export async function createIntent(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required to initialize payment.' });
    }

    const {
      amount,
      currency = 'USD',
      planName,
      planId,
      term = '1m',
      couponCode,
      useSavedMethod = false,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount is required.' });
    }

    let pricing;
    try {
      pricing = await calculateCardOrderPricing({
        planId,
        term,
        couponCode,
        submittedAmount: amount,
      });
    } catch (priceErr) {
      if (priceErr.isTampering) {
        console.warn(`[SECURITY ALERT] Price tampering attempt detected for User #${userId}: submitted $${amount}, required min $${priceErr.minAuthorizedPrice}`);
      }
      return res.status(priceErr.statusCode || 400).json({ success: false, error: priceErr.message });
    }

    let stripeCustomer = null;
    try {
      stripeCustomer = await getOrCreateStripeCustomer({
        email: req.user?.email,
        name: req.user?.fullName,
        userId,
      });
    } catch (custErr) {
      console.warn('[Stripe Customer Warning] Continuing without Stripe Customer (check rk_live_ Customers:Write permission):', custErr.message);
    }

    const intentMetadata = {
      userId: String(userId),
      planId: String(pricing.plan.planId),
      planName: planName || pricing.plan.name || 'VPS Plan',
      term: String(term || '1m'),
      couponCode: couponCode ? String(couponCode).trim().toUpperCase() : '',
    };

    if (useSavedMethod) {
      const savedMethod = await prisma.userPaymentMethod.findFirst({
        where: { userId, isDefault: true },
        orderBy: { createdAt: 'desc' },
      });

      const stripeRef = savedMethod ? decodeStripePaymentMethodRef(savedMethod.encryptedCardNumber) : null;
      if (!stripeRef || !stripeRef.stripePaymentMethodId) {
        return res.status(400).json({
          success: false,
          requiresNewCard: true,
          error: 'Your saved card needs to be re-entered once for live Stripe verification.',
        });
      }

      const chargeResult = await chargeSavedPaymentMethod({
        amount: pricing.authorizedAmount,
        currency,
        customerId: stripeRef.stripeCustomerId || stripeCustomer?.id,
        paymentMethodId: stripeRef.stripePaymentMethodId,
        customerEmail: req.user?.email,
        customerName: savedMethod.cardholderName || req.user?.fullName,
        metadata: intentMetadata,
        offSession: false,
      });

      return res.json({
        success: true,
        paymentIntentId: chargeResult.paymentIntentId,
        clientSecret: chargeResult.clientSecret,
        status: chargeResult.status,
        requiresAction: chargeResult.requiresAction,
        amount: chargeResult.amount,
        currency: chargeResult.currency,
      });
    }

    const intent = await createPaymentIntent({
      amount: pricing.authorizedAmount,
      currency,
      customerId: stripeCustomer?.id || null,
      customerEmail: req.user?.email,
      customerName: req.user?.fullName,
      setupFutureUsage: stripeCustomer?.id ? 'off_session' : null,
      metadata: intentMetadata,
    });

    return res.json({ success: true, ...intent });
  } catch (err) {
    console.error('[Payment Intent Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to initialize payment gateway.' });
  }
}

/**
 * 3. POST /api/payments/process-card - Verify confirmed Stripe PaymentIntent & finalize VPS order
 * Supports Visa, Mastercard, American Express, and Discover in both Live and Test mode
 */
export async function processCardPayment(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required to process checkout.' });
    }

    const {
      paymentIntentId,
      planId,
      amount,
      cardName,
      term = '1m',
      couponCode,
    } = req.body;

    if (!paymentIntentId || typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
      return res.status(400).json({
        success: false,
        error: 'A confirmed Stripe paymentIntentId is required. Please complete card verification via Stripe Checkout.',
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid order amount.' });
    }

    // Idempotency guard: if this PaymentIntent was already recorded, return existing confirmation
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId: paymentIntentId },
      include: { invoice: true },
    });
    if (existingPayment && existingPayment.userId === userId) {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and processed via Stripe.',
        transactionId: existingPayment.transactionId,
        invoiceNumber: existingPayment.invoice?.invoiceNumber || '',
        subscriptionId: existingPayment.invoice?.subscriptionId,
        cardBrand: 'Card',
        last4: '••••',
        subtotal: Number(existingPayment.invoice?.subtotal || existingPayment.amount),
        processingFee: Number((Number(existingPayment.amount) - Number(existingPayment.invoice?.subtotal || existingPayment.amount)).toFixed(2)),
        tax: 0,
        amount: Number(existingPayment.amount).toFixed(2),
        currency: existingPayment.currency || 'USD',
      });
    }

    // 1. Server-Side Anti-Tampering Price Verification
    let pricing;
    try {
      pricing = await calculateCardOrderPricing({
        planId,
        term,
        couponCode,
        submittedAmount: amount,
      });
    } catch (priceErr) {
      if (priceErr.isTampering) {
        console.warn(`[SECURITY ALERT] Price tampering attempt detected for User #${userId}: submitted $${amount}, required min $${priceErr.minAuthorizedPrice}`);
      }
      return res.status(priceErr.statusCode || 400).json({ success: false, error: priceErr.message });
    }

    const { plan, netSubtotal, couponDiscount, expectedFee, minAuthorizedPrice } = pricing;

    // 2. Verify the real Stripe PaymentIntent directly with Stripe API
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: `Card payment has not succeeded yet (status: ${paymentIntent?.status || 'unknown'}). Please try again.`,
      });
    }

    if (paymentIntent.metadata?.userId && String(paymentIntent.metadata.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        error: 'PaymentIntent ownership mismatch.',
      });
    }

    const minExpectedCents = Math.round((minAuthorizedPrice - 0.50) * 100);
    if ((paymentIntent.amount_received || 0) < minExpectedCents) {
      return res.status(400).json({
        success: false,
        error: 'Paid amount does not match the required order total.',
      });
    }

    // Extract verified card metadata from Stripe PaymentMethod / Charge
    const pmObj = typeof paymentIntent.payment_method === 'object' ? paymentIntent.payment_method : null;
    const chargeCard = paymentIntent.latest_charge && typeof paymentIntent.latest_charge === 'object'
      ? paymentIntent.latest_charge.payment_method_details?.card
      : null;
    const cardInfo = pmObj?.card || chargeCard || {};

    const effectiveBrand = formatCardBrand(cardInfo.brand || 'Card');
    const effectiveLast4 = String(cardInfo.last4 || '0000').slice(-4);
    const effectiveExpMonth = String(cardInfo.exp_month || 12).padStart(2, '0');
    const effectiveExpYear = String(cardInfo.exp_year || new Date().getFullYear() + 3);
    const effectiveCardName = cardName || pmObj?.billing_details?.name || req.user.fullName || 'Authorized Customer';
    const stripePaymentMethodId = pmObj?.id || (typeof paymentIntent.payment_method === 'string' ? paymentIntent.payment_method : null);
    const stripeCustomerId = typeof paymentIntent.customer === 'string'
      ? paymentIntent.customer
      : (paymentIntent.customer?.id || null);

    // Save tokenized Stripe PaymentMethod reference (no raw PAN or CVC stored)
    if (stripePaymentMethodId) {
      try {
        const existingSaved = await prisma.userPaymentMethod.findFirst({
          where: { userId, isDefault: true },
          orderBy: { createdAt: 'desc' },
        });
        const existingStripeRef = existingSaved ? decodeStripePaymentMethodRef(existingSaved.encryptedCardNumber) : null;

        if (!existingSaved || !existingStripeRef) {
          if (existingSaved) {
            await prisma.userPaymentMethod.updateMany({
              where: { userId, isDefault: true },
              data: { isDefault: false },
            });
          }
          await prisma.userPaymentMethod.create({
            data: {
              userId,
              cardBrand: effectiveBrand,
              last4: effectiveLast4,
              expMonth: effectiveExpMonth,
              expYear: effectiveExpYear,
              cardholderName: effectiveCardName,
              encryptedCardNumber: encodeStripePaymentMethodRef({ stripeCustomerId, stripePaymentMethodId }),
              encryptedCvc: '',
              isDefault: true,
            },
          });
        } else if (existingStripeRef.stripePaymentMethodId !== stripePaymentMethodId) {
          await prisma.userPaymentMethod.create({
            data: {
              userId,
              cardBrand: effectiveBrand,
              last4: effectiveLast4,
              expMonth: effectiveExpMonth,
              expYear: effectiveExpYear,
              cardholderName: effectiveCardName,
              encryptedCardNumber: encodeStripePaymentMethodRef({ stripeCustomerId, stripePaymentMethodId }),
              encryptedCvc: '',
              isDefault: false,
            },
          });
        }
      } catch (savePmErr) {
        console.warn('[Save Stripe PaymentMethod Warning]:', savePmErr.message);
      }
    }

    const paidAmount = Number((paymentIntent.amount_received / 100).toFixed(2));
    const paidCurrency = (paymentIntent.currency || 'usd').toUpperCase();

    // 3. Create active Subscription in MS SQL with term awareness (Yearly = 365 days, non-refundable)
    const isYearly = term === '12m' || term === 'yearly';
    const durationDays = isYearly ? 365 : (term === '24m' ? 730 : 30);
    const now = new Date();
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.planId,
        status: 'ACTIVE',
        startDate: now,
        endDate: new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000),
        monthlyPrice: isYearly ? Number((paidAmount / 12).toFixed(2)) : paidAmount,
        currency: paidCurrency,
      },
    });

    // Increment coupon usage if used
    if (couponCode) {
      try {
        await prisma.promoCode.update({
          where: { code: String(couponCode).trim().toUpperCase() },
          data: { timesUsed: { increment: 1 } },
        });
      } catch (_) {}
    }

    // 4. Create Official Invoice in Database
    const invoiceNumber = `INV-${now.getFullYear()}-${String(subscription.subscriptionId).padStart(4, '0')}`;
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        subscriptionId: subscription.subscriptionId,
        invoiceNumber,
        subtotal: Number(req.body.subtotal || netSubtotal),
        tax: 0,
        discount: couponDiscount,
        total: paidAmount,
        currency: paidCurrency,
        status: 'PAID',
        issueDate: now,
        paidDate: now,
        dueDate: now,
      },
    });

    // 5. Record Payment
    await prisma.payment.create({
      data: {
        userId,
        invoiceId: invoice.invoiceId,
        paymentGateway: 'STRIPE_CARD',
        transactionId: paymentIntent.id,
        amount: paidAmount,
        currency: paidCurrency,
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
        details: `Payment of $${paidAmount.toFixed(2)} ${paidCurrency} processed via ${effectiveBrand} (•••• ${effectiveLast4}) for ${invoiceNumber}`,
      },
    }).catch(() => {});

    // 7. Dispatch Payment Receipt Email via billing@atechconsult.com
    sendInvoiceReceiptEmail({
      email: req.user.email,
      fullName: req.user.fullName || effectiveCardName,
      invoiceNumber,
      amount: paidAmount,
      subtotal: Number(req.body.subtotal || netSubtotal),
      processingFee: expectedFee,
      tax: 0,
      planName: plan.name,
      currency: paidCurrency,
    }).catch((mailErr) => console.warn('[Invoice Receipt Email Warning]:', mailErr.message));

    return res.status(200).json({
      success: true,
      message: 'Payment authorized and processed successfully via Stripe.',
      transactionId: paymentIntent.id,
      invoiceNumber,
      subscriptionId: subscription.subscriptionId,
      cardBrand: effectiveBrand,
      last4: effectiveLast4,
      subtotal: Number(req.body.subtotal || netSubtotal),
      processingFee: expectedFee,
      tax: 0,
      amount: paidAmount.toFixed(2),
      currency: paidCurrency,
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
      term = '1m',
      couponCode,
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

    // Server-Side Anti-Tampering Price Verification
    const baseMonthly = Number(plan.monthlyPrice);
    const isYearly = term === '12m' || term === 'yearly';
    const isMultiYear = term === '24m';
    let expectedSubtotal = baseMonthly;
    if (isYearly) {
      expectedSubtotal = Number((baseMonthly * 12 * 0.95).toFixed(2));
    } else if (isMultiYear) {
      expectedSubtotal = Number((baseMonthly * 24 * 0.85).toFixed(2));
    }

    let couponDiscount = 0;
    if (couponCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: String(couponCode).trim().toUpperCase() },
      });
      const nowTime = new Date();
      if (
        promo &&
        promo.isActive &&
        (!promo.expiresAt || new Date(promo.expiresAt) > nowTime) &&
        (!promo.validFrom || new Date(promo.validFrom) <= nowTime) &&
        promo.timesUsed < promo.maxUses &&
        (!promo.applicablePlanId || promo.applicablePlanId === plan.planId)
      ) {
        if (promo.discountType === 'PERCENT') {
          couponDiscount = Number(((expectedSubtotal * Number(promo.discountValue)) / 100).toFixed(2));
        } else {
          couponDiscount = Math.min(expectedSubtotal, Number(promo.discountValue));
        }
      }
    }

    const minAuthorizedPrice = Math.max(0.50, Number((expectedSubtotal - couponDiscount).toFixed(2)));
    if (Number(amount) < (minAuthorizedPrice - 0.50)) {
      console.warn(`[SECURITY ALERT] Price tampering attempt detected for User #${userId} (Bank Transfer): submitted $${amount}, required min $${minAuthorizedPrice}`);
      return res.status(400).json({
        success: false,
        error: 'Order price validation failed. The submitted amount does not match the configured plan pricing.',
      });
    }

    const now = new Date();
    const durationDays = isYearly ? 365 : (term === '24m' ? 730 : 30);

    // 3. Create Subscription (Pending Bank Remittance Confirmation)
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.planId,
        status: 'PENDING',
        startDate: now,
        endDate: new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000),
        monthlyPrice: isYearly ? Number((Number(amount) / 12).toFixed(2)) : Number(amount),
        currency: 'USD',
      },
    });

    // Increment coupon usage if used
    if (couponCode) {
      try {
        await prisma.promoCode.update({
          where: { code: String(couponCode).trim().toUpperCase() },
          data: { timesUsed: { increment: 1 } },
        });
      } catch (_) {}
    }

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
        details: `Invoice ${invoiceNumber} generated for Direct Bank Transfer of $${Number(amount).toFixed(2)} USD`,
      },
    }).catch(() => {});

    // 7. Dispatch Invoice Email with Remittance Details
    sendInvoiceReceiptEmail({
      email: req.user.email,
      fullName: req.user.fullName,
      invoiceNumber,
      amount: Number(amount),
      subtotal: Number(req.body.subtotal || amount),
      processingFee: 0,
      tax: 0,
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
      subtotal: Number(req.body.subtotal || amount),
      processingFee: 0,
      tax: 0,
      amount: Number(amount).toFixed(2),
      currency: 'USD',
    });
  } catch (err) {
    console.error('[Bank Transfer Processing Error]:', err);
    return res.status(400).json({ success: false, error: err.message || 'Failed to process bank transfer.' });
  }
}

/**
 * 5. GET /api/payments/saved-method - Retrieve user's default saved card on file
 */
export async function getSavedPaymentMethod(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const pm = await prisma.userPaymentMethod.findFirst({
      where: { userId, isDefault: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!pm) {
      return res.json({ success: true, hasSavedMethod: false, method: null });
    }

    const stripeRef = decodeStripePaymentMethodRef(pm.encryptedCardNumber);

    return res.json({
      success: true,
      hasSavedMethod: true,
      method: {
        methodId: pm.methodId,
        brand: pm.cardBrand,
        last4: pm.last4,
        expMonth: pm.expMonth,
        expYear: pm.expYear,
        holderName: pm.cardholderName,
        isStripeBacked: Boolean(stripeRef && stripeRef.stripePaymentMethodId),
      },
    });
  } catch (err) {
    console.error('[getSavedPaymentMethod Error]:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve saved payment method.' });
  }
}

/**
 * 6. POST /api/payments/webhook - Stripe Webhook Signature Verification and Event Handling
 */
export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    if (!webhookSecret) {
      console.warn('[Stripe Webhook]: STRIPE_WEBHOOK_SECRET is not configured.');
      return res.status(200).json({ received: true, note: 'Webhook received; signature verification skipped because STRIPE_WEBHOOK_SECRET is unset.' });
    }
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;
  try {
    const rawBody = req.rawBody || req.body;
    if (stripe) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      return res.status(500).json({ error: 'Stripe is not initialized.' });
    }
  } catch (err) {
    console.error('[Stripe Webhook Signature Verification Failed]:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle verified events
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log(`[Stripe Webhook] Verified PaymentIntent succeeded: ${paymentIntent.id}`);
      try {
        const paymentRecord = await prisma.payment.findFirst({
          where: { transactionId: paymentIntent.id },
          include: { invoice: true },
        });
        if (paymentRecord && paymentRecord.status !== 'COMPLETED') {
          await prisma.$transaction([
            prisma.payment.update({
              where: { paymentId: paymentRecord.paymentId },
              data: { status: 'COMPLETED', paymentDate: new Date() },
            }),
            prisma.invoice.update({
              where: { invoiceId: paymentRecord.invoiceId },
              data: { status: 'PAID', paidDate: new Date() },
            }),
          ]);
          console.log(`[Stripe Webhook] Reconciled payment and invoice as Paid for ${paymentIntent.id}`);
        }
      } catch (dbErr) {
        console.error('[Stripe Webhook DB Error]:', dbErr);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.warn(`[Stripe Webhook] Verified PaymentIntent failed: ${paymentIntent.id}`);
      try {
        await prisma.payment.updateMany({
          where: { transactionId: paymentIntent.id },
          data: { status: 'FAILED' },
        });

        let recipientEmail = paymentIntent.receipt_email || paymentIntent.metadata?.customerEmail || '';
        let recipientName = paymentIntent.metadata?.customerName || '';

        if (!recipientEmail && paymentIntent.metadata?.userId) {
          const failedUser = await prisma.user.findUnique({
            where: { userId: Number(paymentIntent.metadata.userId) },
          });
          if (failedUser) {
            recipientEmail = failedUser.email;
            recipientName = recipientName || failedUser.fullName;
          }
        }

        if (recipientEmail) {
          sendPaymentFailedEmail({
            email: recipientEmail,
            fullName: recipientName,
            amount: paymentIntent.amount ? Number((paymentIntent.amount / 100).toFixed(2)) : undefined,
            currency: (paymentIntent.currency || 'usd').toUpperCase(),
            planName: paymentIntent.metadata?.planName || 'Cloud VPS Plan',
            failureReason: paymentIntent.last_payment_error?.message,
          }).catch((mailErr) => console.warn('[Webhook Failed Payment Email Warning]:', mailErr.message));
        }
      } catch (dbErr) {
        console.error('[Stripe Webhook DB Error]:', dbErr);
      }
      break;
    }
    default:
      console.log(`[Stripe Webhook] Received verified event ${event.type}`);
  }

  return res.json({ received: true });
}

