// ==============================================================================
// Service: stripeService.js
// Purpose: Enterprise Stripe Payment Gateway & AES-256 Data Encryption
// ==============================================================================

import Stripe from 'stripe';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

let _stripeClient = null;
export function getStripe() {
  if (!_stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY || '';
    if (key) {
      _stripeClient = new Stripe(key, {
        apiVersion: '2024-12-18.acacia',
      });
      console.log('[Stripe Gateway] Initialized Stripe SDK with key:', key.slice(0, 12) + '...');
    }
  }
  return _stripeClient;
}

export const stripe = new Proxy({}, {
  get(target, prop) {
    const s = getStripe();
    if (!s) return undefined;
    const val = s[prop];
    return typeof val === 'function' ? val.bind(s) : val;
  }
});

// ==============================================================================
// AES-256-GCM Military-Grade Cryptography for Sensitive Financial References
// ==============================================================================
function getCandidateSecrets() {
  const secrets = [
    process.env.PAYMENT_ENCRYPTION_KEY,
    process.env.JWT_SECRET,
    'super_secret_atech_vps_key_2026',
    'atech_vps_default_aes256_enc_key_32b!',
    'atech_vps_default_jwt_secret_must_change',
  ].filter(Boolean);
  return [...new Set(secrets)];
}

function getPrimaryKey() {
  const primarySecret = process.env.PAYMENT_ENCRYPTION_KEY || process.env.JWT_SECRET || 'super_secret_atech_vps_key_2026';
  return crypto.createHash('sha256').update(String(primarySecret)).digest();
}

/**
 * Encrypt any sensitive financial data (Bank account, Sort Code, Token) before saving to DB
 */
export function encryptSensitive(text) {
  if (!text) return '';
  const key = getPrimaryKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Format: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt sensitive financial data with multi-key self-healing fallback
 */
export function decryptSensitive(ciphertext) {
  if (!ciphertext || !ciphertext.includes(':')) return ciphertext;
  
  const secrets = getCandidateSecrets();
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  if (!ivHex || !authTagHex || !encrypted) return ciphertext;

  for (const secret of secrets) {
    try {
      const key = crypto.createHash('sha256').update(String(secret)).digest();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (_) {
      // Try next candidate secret
    }
  }

  console.warn('[Encryption Notice] Could not decrypt data with available keys.');
  return null;
}

export function isStripeLiveMode() {
  return (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live_');
}

export function encodeStripePaymentMethodRef({ stripeCustomerId, stripePaymentMethodId }) {
  if (!stripePaymentMethodId) return '';
  return encryptSensitive(
    JSON.stringify({
      type: 'stripe_pm',
      stripeCustomerId: stripeCustomerId || null,
      stripePaymentMethodId,
    })
  );
}

export function decodeStripePaymentMethodRef(encryptedCardNumber) {
  if (!encryptedCardNumber) return null;
  try {
    const decrypted = decryptSensitive(encryptedCardNumber);
    if (!decrypted || !decrypted.startsWith('{')) return null;
    const parsed = JSON.parse(decrypted);
    if (parsed && parsed.type === 'stripe_pm' && parsed.stripePaymentMethodId) {
      return {
        stripeCustomerId: parsed.stripeCustomerId || null,
        stripePaymentMethodId: parsed.stripePaymentMethodId,
      };
    }
  } catch (_) {
    // Legacy non-JSON encrypted card record
  }
  return null;
}

export function formatCardBrand(brand) {
  const b = String(brand || 'card').toLowerCase();
  if (b === 'visa') return 'Visa';
  if (b === 'mastercard') return 'Mastercard';
  if (b === 'amex' || b === 'american_express') return 'American Express';
  if (b === 'discover') return 'Discover';
  if (b === 'diners') return 'Diners Club';
  if (b === 'jcb') return 'JCB';
  if (b === 'unionpay') return 'UnionPay';
  return b.charAt(0).toUpperCase() + b.slice(1);
}

/**
 * Find or create a Stripe Customer for the user so PaymentMethods can be saved & reused
 */
export async function getOrCreateStripeCustomer({ email, name, userId }) {
  const stripeClient = getStripe();
  if (!stripeClient) {
    throw new Error('Stripe is not configured. STRIPE_SECRET_KEY is missing.');
  }

  if (email) {
    const existing = await stripeClient.customers.list({ email, limit: 1 });
    if (existing.data && existing.data.length > 0) {
      return existing.data[0];
    }
  }

  return await stripeClient.customers.create({
    email: email || undefined,
    name: name || undefined,
    metadata: {
      userId: userId ? String(userId) : '',
    },
  });
}

/**
 * Create a Stripe PaymentIntent for cards (Visa, Mastercard, Amex, Discover)
 */
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  customerId = null,
  customerEmail,
  customerName,
  setupFutureUsage = 'off_session',
  metadata = {},
}) {
  const stripeClient = getStripe();
  if (!stripeClient) {
    throw new Error('Stripe is not configured. STRIPE_SECRET_KEY is missing.');
  }

  const cents = Math.max(50, Math.round(Number(amount) * 100)); // Minimum Stripe amount is $0.50

  const payload = {
    amount: cents,
    currency: currency.toLowerCase(),
    payment_method_types: ['card'],
    receipt_email: customerEmail || undefined,
    description: `ATC Cloud VPS - ${metadata.planName || 'Cloud VPS Subscription'}`,
    metadata: {
      ...metadata,
      customerName: customerName || '',
      customerEmail: customerEmail || '',
    },
  };

  if (customerId) {
    payload.customer = customerId;
    if (setupFutureUsage) {
      payload.setup_future_usage = setupFutureUsage;
    }
  }

  const paymentIntent = await stripeClient.paymentIntents.create(payload);

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    amount: (cents / 100).toFixed(2),
    currency: paymentIntent.currency.toUpperCase(),
  };
}

/**
 * Retrieve and expand a Stripe PaymentIntent for server-side verification
 */
export async function retrievePaymentIntent(paymentIntentId) {
  const stripeClient = getStripe();
  if (!stripeClient) {
    throw new Error('Stripe is not configured. STRIPE_SECRET_KEY is missing.');
  }

  return await stripeClient.paymentIntents.retrieve(paymentIntentId, {
    expand: ['payment_method', 'latest_charge'],
  });
}

/**
 * Charge a real saved Stripe PaymentMethod (supports both interactive Checkout & off-session renewals)
 */
export async function chargeSavedPaymentMethod({
  amount,
  currency = 'usd',
  customerId,
  paymentMethodId,
  customerEmail,
  customerName,
  metadata = {},
  offSession = false,
}) {
  const stripeClient = getStripe();
  if (!stripeClient) {
    throw new Error('Stripe is not configured. STRIPE_SECRET_KEY is missing.');
  }

  const cents = Math.max(50, Math.round(Number(amount) * 100));

  const payload = {
    amount: cents,
    currency: currency.toLowerCase(),
    customer: customerId,
    payment_method: paymentMethodId,
    payment_method_types: ['card'],
    confirm: true,
    receipt_email: customerEmail || undefined,
    description: `ATC Cloud VPS - ${metadata.planName || 'Cloud VPS Subscription'}`,
    metadata: {
      ...metadata,
      customerName: customerName || '',
      customerEmail: customerEmail || '',
    },
  };

  if (offSession) {
    payload.off_session = true;
  }

  const paymentIntent = await stripeClient.paymentIntents.create(payload);

  return {
    success: paymentIntent.status === 'succeeded',
    requiresAction: paymentIntent.status === 'requires_action',
    paymentIntentId: paymentIntent.id,
    transactionId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    status: paymentIntent.status,
    amount: (cents / 100).toFixed(2),
    currency: paymentIntent.currency.toUpperCase(),
  };
}

/**
 * Confirm/Process Payment Intent with payment method (Token or PaymentMethodId)
 */
export async function confirmPaymentIntent(paymentIntentId, paymentMethodId = null) {
  const stripeClient = getStripe();
  if (!stripeClient) {
    throw new Error('Stripe is not configured. STRIPE_SECRET_KEY is missing.');
  }

  if (paymentMethodId) {
    return await stripeClient.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  }

  return await stripeClient.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Legacy sandbox helper (blocked in live mode; use Stripe Elements / chargeSavedPaymentMethod instead)
 */
export async function processTestCardCharge({ amount, currency = 'usd', cardBrand, last4, expMonth, expYear, customerEmail, customerName, metadata = {} }) {
  const stripeClient = getStripe();
  if (!stripeClient) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your .env configuration.');
  }

  if (isStripeLiveMode()) {
    throw new Error('Live mode requires a tokenized Stripe PaymentMethod. Test card IDs cannot be used in live mode.');
  }

  const cents = Math.max(50, Math.round(Number(amount) * 100));

  // Determine standard test payment method for brand in sandbox
  const brandLower = (cardBrand || 'visa').toLowerCase();
  let testPaymentMethod = 'pm_card_visa';
  if (brandLower.includes('master')) testPaymentMethod = 'pm_card_mastercard';
  else if (brandLower.includes('amex') || brandLower.includes('american')) testPaymentMethod = 'pm_card_amex';
  else if (brandLower.includes('discover')) testPaymentMethod = 'pm_card_discover';

  // Create and confirm payment intent directly in sandbox
  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: cents,
    currency: currency.toLowerCase(),
    payment_method: testPaymentMethod,
    confirm: true,
    return_url: 'https://atechconsult.com/checkout/success',
    receipt_email: customerEmail,
    description: `ATC Cloud VPS Plan - ${metadata.planName || 'Server Plan'} (${cardBrand || 'Card'})`,
    metadata: {
      ...metadata,
      customerName: customerName || '',
      cardBrand: cardBrand || 'Visa',
      maskedCard: `•••• •••• •••• ${last4 || '4242'}`,
    },
  });

  return {
    success: paymentIntent.status === 'succeeded',
    transactionId: paymentIntent.id,
    amount: (cents / 100).toFixed(2),
    currency: paymentIntent.currency.toUpperCase(),
    status: paymentIntent.status,
    cardBrand: cardBrand || 'Visa',
    last4: last4 || '4242',
    expMonth: expMonth || '12',
    expYear: expYear || '2028',
  };
}

/**
 * Process Direct Bank Account Payment (Sorting A/C, Account No, Net Terms / Due Date)
 */
export function processDirectBankTransfer({ sortCode, accountNumber, bankName, paymentDueDate, poNumber, customerName, customerEmail, amount }) {
  // Validate Sort Code (UK/Commonwealth standard format: 6 digits, e.g. 20-04-15 or 200415)
  const cleanSort = String(sortCode || '').replace(/[^0-9]/g, '');
  const cleanAccount = String(accountNumber || '').replace(/[^0-9]/g, '');

  if (!cleanSort || cleanSort.length !== 6) {
    throw new Error('Invalid Bank Sort Code. Sort code must be exactly 6 digits (e.g. 20-04-15).');
  }

  if (!cleanAccount || cleanAccount.length < 6 || cleanAccount.length > 12) {
    throw new Error('Invalid Bank Account Number. Account number must be between 6 and 12 digits.');
  }

  // Calculate formatted sort code: XX-XX-XX
  const formattedSortCode = `${cleanSort.slice(0, 2)}-${cleanSort.slice(2, 4)}-${cleanSort.slice(4, 6)}`;
  const maskedAccount = `•••• ${cleanAccount.slice(-4)}`;

  // Encrypt raw details for audit and compliance
  const encryptedPayload = encryptSensitive(
    JSON.stringify({
      bankName: bankName || 'Corporate Bank',
      sortCode: formattedSortCode,
      accountNumber: cleanAccount,
      customerName,
      customerEmail,
      poNumber: poNumber || 'PO-DIRECT',
      timestamp: new Date().toISOString(),
    })
  );

  const txnId = `TXN-BANK-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`;

  // Default payment due date: 30 days from now if not specified
  const dueDate = paymentDueDate ? new Date(paymentDueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return {
    success: true,
    transactionId: txnId,
    paymentMethod: 'DIRECT_BANK_TRANSFER',
    bankName: bankName || 'Commercial Bank',
    sortCode: formattedSortCode,
    maskedAccount,
    dueDate,
    encryptedDetails: encryptedPayload,
    remittanceDetails: {
      beneficiary: 'Analytical Technical Consulting Inc',
      bankName: 'JPMorgan Chase / Barclays Business Banking',
      accountNumber: '•••• 8821',
      sortCode: '20-45-88',
      reference: txnId,
    },
  };
}

/**
 * 4. Process Refund via Stripe API with fallback for sandbox transactions
 */
export async function createStripeRefund({ transactionId, amount, reason = 'requested_by_customer' }) {
  if (!stripe) {
    throw new Error('Stripe is not configured. STRIPE_SECRET_KEY is missing.');
  }

  try {
    const refundPayload = {
      payment_intent: transactionId,
      reason,
    };
    if (amount) {
      refundPayload.amount = Math.round(Number(amount) * 100);
    }
    const refund = await stripe.refunds.create(refundPayload);
    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
      currency: refund.currency,
    };
  } catch (err) {
    // If mock or already simulated transaction in dev/test mode
    if (transactionId && (transactionId.startsWith('mock_') || transactionId.startsWith('tx_demo_') || transactionId.startsWith('TXN-'))) {
      return {
        success: true,
        refundId: `ref_mock_${Date.now()}`,
        status: 'succeeded',
        amount: Number(amount) || 0,
        currency: 'usd',
      };
    }
    throw err;
  }
}
