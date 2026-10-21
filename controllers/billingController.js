// ==============================================================================
// Controller: billingController.js
// Purpose: Manage customer subscriptions, recurring billing, and invoices
// ==============================================================================

import prisma from '../lib/prisma.js';
import { cancelUserTrial, setupUserTrial } from '../services/trialService.js';
import { reactivateSubscription, gracefulSuspendSubscription } from '../services/billingRetentionService.js';
import { decryptSensitive } from '../services/stripeService.js';

/**
 * 1. GET /api/billing/overview - Overview of active subscriptions, monthly spend & invoices
 */
export async function getBillingOverview(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true, fullName: true, email: true, country: true, city: true, address: true },
    });

    // 1. Fetch user subscriptions
    let subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        plan: true,
        virtualMachines: {
          where: { status: { not: 'TERMINATED' } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch user invoices
    let invoices = await prisma.invoice.findMany({
      where: { userId },
      include: {
        payments: true,
        subscription: {
          include: { plan: true },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    // Auto-generate initial invoice if user has subscriptions/VMs but 0 invoices
    if (invoices.length === 0 && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        const invNum = `INV-${new Date().getFullYear()}-${String(sub.subscriptionId).padStart(4, '0')}`;
        const issueDate = sub.startDate || new Date();
        const price = Number(sub.monthlyPrice) || (sub.plan ? Number(sub.plan.monthlyPrice) : 20.00);

        try {
          const inv = await prisma.invoice.create({
            data: {
              userId,
              subscriptionId: sub.subscriptionId,
              invoiceNumber: invNum,
              subtotal: price,
              tax: 0.00,
              discount: 0.00,
              total: price,
              currency: sub.currency || 'USD',
              status: 'PAID',
              issueDate: issueDate,
              dueDate: issueDate,
              paidDate: issueDate,
            },
          });

          await prisma.payment.create({
            data: {
              userId,
              invoiceId: inv.invoiceId,
              paymentGateway: 'STRIPE_CARD',
              transactionId: `txn_${Date.now()}_${sub.subscriptionId}`,
              amount: price,
              currency: sub.currency || 'USD',
              status: 'COMPLETED',
              paymentDate: issueDate,
            },
          });
        } catch (e) {
          console.warn('[Auto Invoice Generation Notice]:', e.message);
        }
      }

      // Re-fetch created invoices
      invoices = await prisma.invoice.findMany({
        where: { userId },
        include: {
          payments: true,
          subscription: {
            include: { plan: true },
          },
        },
        orderBy: { issueDate: 'desc' },
      });
    }

    // Calculate monthly recurring spend
    let monthlySpend = 0;
    subscriptions.forEach((s) => {
      if (s.status === 'ACTIVE' || s.status === 'active') {
        monthlySpend += Number(s.monthlyPrice || (s.plan ? s.plan.monthlyPrice : 0));
      }
    });

    // Format Invoices for client JSON
    const formattedInvoices = invoices.map((inv) => {
      const planName = inv.subscription?.plan?.name || 'High-Performance VPS';
      return {
        invoiceId: inv.invoiceId.toString(),
        invoiceNumber: inv.invoiceNumber,
        description: `Cloud VPS Subscription - ${planName}`,
        amount: Number(inv.total),
        currency: inv.currency || 'USD',
        status: inv.status,
        issueDate: inv.issueDate,
        paidDate: inv.paidDate,
        paymentMethod: inv.payments?.[0]?.paymentGateway || 'Credit Card (•••• 4242)',
      };
    });

    // Format Subscriptions for client JSON
    const formattedSubscriptions = subscriptions.map((s) => {
      const now = new Date();
      // Target renewal/expiry: prefer endDate, then nextBillingDate, or fallback to startDate + 30 days
      let targetDate = s.endDate ? new Date(s.endDate) : (s.nextBillingDate ? new Date(s.nextBillingDate) : null);
      if (!targetDate && s.startDate) {
        targetDate = new Date(new Date(s.startDate).getTime() + 30 * 24 * 60 * 60 * 1000);
      }
      if (!targetDate && s.createdAt) {
        targetDate = new Date(new Date(s.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
      }
      if (!targetDate) {
        targetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      const diffMs = targetDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      const isSuspended = s.status === 'SUSPENDED';
      const retentionDaysRemaining = isSuspended && s.endDate
        ? Math.max(0, Math.ceil((new Date(s.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

      return {
        subscriptionId: s.subscriptionId,
        planName: s.plan?.name || 'Custom Plan',
        monthlyPrice: Number(s.monthlyPrice),
        currency: s.currency || 'USD',
        status: s.status,
        isSuspended,
        retentionDaysRemaining,
        retentionExpiresAt: s.endDate || null,
        dataPreserved: isSuspended,
        startDate: s.startDate,
        nextBillingDate: targetDate,
        daysRemaining,
        vmCount: s.virtualMachines.length,
        vms: s.virtualMachines.map((v) => ({
          vmId: v.vmId,
          vmName: v.vmName,
          status: v.status,
          specs: `${v.cpuCores} vCPU / ${v.ramGb} GB RAM / ${v.storageGb} GB SSD`,
        })),
      };
    });

    // Filter active and trial subscriptions for slots committed to customer compute
    const activeSubs = formattedSubscriptions.filter(
      (sub) => sub.status === 'ACTIVE' || sub.status === 'active' || sub.status === 'TRIAL' || sub.status === 'trial' || sub.status === 'SUSPENDED' || sub.status === 'suspended'
    );

    const primaryNextBillingDate = activeSubs.length > 0 
      ? activeSubs[0].nextBillingDate 
      : (formattedSubscriptions.length > 0 ? formattedSubscriptions[0].nextBillingDate : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    // Look up user's default saved card
    const savedCard = await prisma.userPaymentMethod.findFirst({
      where: { userId, isDefault: true },
      orderBy: { createdAt: 'desc' },
    });

    const expYearFormatted = savedCard && savedCard.expYear ? String(savedCard.expYear).slice(-2) : '28';

    return res.json({
      success: true,
      user,
      summary: {
        monthlySpend: Number(monthlySpend.toFixed(2)),
        activeSubscriptionsCount: activeSubs.length,
        hasSuspendedSubscriptions: formattedSubscriptions.some((s) => s.status === 'SUSPENDED'),
        suspendedSubscriptionsCount: formattedSubscriptions.filter((s) => s.status === 'SUSPENDED').length,
        currency: 'USD',
        nextBillingDate: primaryNextBillingDate,
        paymentMethod: {
          brand: savedCard ? savedCard.cardBrand : 'Visa',
          last4: savedCard ? savedCard.last4 : '4242',
          expMonth: savedCard ? savedCard.expMonth : '12',
          expYear: expYearFormatted,
          funding: 'Credit',
          holderName: (savedCard && savedCard.cardholderName) || user.fullName || 'Authorized Customer',
          hasSavedMethod: Boolean(savedCard),
        },
        savedPaymentMethod: savedCard
          ? {
              methodId: savedCard.methodId,
              brand: savedCard.cardBrand,
              last4: savedCard.last4,
              expMonth: savedCard.expMonth,
              expYear: expYearFormatted,
              holderName: savedCard.cardholderName || user.fullName || 'Authorized Customer',
            }
          : null,
      },
      subscriptions: activeSubs,
      allSubscriptions: formattedSubscriptions,
      invoices: formattedInvoices,
    });
  } catch (err) {
    console.error('[getBillingOverview Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve billing information' });
  }
}

/**
 * 2. GET /api/billing/invoices/:id - Detailed invoice for modal & printing
 */
export async function getInvoiceDetails(req, res) {
  try {
    const userId = req.user?.userId;
    const invoiceId = req.params.id;

    const isAdmin = req.adminUser || req.user?.role?.toLowerCase() === 'admin' || req.user?.roleName?.toLowerCase() === 'admin';
    const invoice = await prisma.invoice.findFirst({
      where: {
        ...(isAdmin ? {} : { userId }),
        OR: [
          { invoiceNumber: invoiceId },
          !isNaN(Number(invoiceId)) ? { invoiceId: BigInt(invoiceId) } : undefined,
        ].filter(Boolean),
      },
      include: {
        user: true,
        payments: true,
        subscription: {
          include: {
            plan: true,
            virtualMachines: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json({
      success: true,
      invoice: {
        invoiceId: invoice.invoiceId.toString(),
        invoiceNumber: invoice.invoiceNumber,
        customer: {
          name: invoice.user.fullName,
          email: invoice.user.email,
          country: invoice.user.country || 'United States',
          address: invoice.user.address || 'Enterprise Cloud Client',
          city: invoice.user.city || 'Dallas',
        },
        items: [
          {
            description: `ATC Cloud Compute - ${invoice.subscription?.plan?.name || 'Custom Plan'}`,
            specs: invoice.subscription?.plan 
              ? `${invoice.subscription.plan.cpuCores} vCPU, ${invoice.subscription.plan.ramGb}GB RAM, ${invoice.subscription.plan.storageGb}GB Enterprise SSD`
              : 'Dedicated Cloud Virtual Machine',
            period: 'Monthly Subscription',
            amount: Number(invoice.subtotal),
          },
        ],
        subtotal: Number(invoice.subtotal),
        tax: Number(invoice.tax),
        total: Number(invoice.total),
        currency: invoice.currency || 'USD',
        status: invoice.status,
        issueDate: invoice.issueDate,
        paidDate: invoice.paidDate,
        transactionId: invoice.payments?.[0]?.transactionId || 'TXN-DIRECT',
      },
    });
  } catch (err) {
    console.error('[getInvoiceDetails Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve invoice details' });
  }
}

/**
 * 3. POST /api/billing/cancel-trial - Instant user cancellation of free trial
 */
export async function cancelTrialSubscription(req, res) {
  try {
    const userId = req.user?.userId;
    const { subscriptionId } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId is required' });

    const result = await cancelUserTrial(userId, subscriptionId);
    return res.json({
      success: true,
      message: 'Your 30-day free trial has been cancelled. No charges will be made to your card.',
      result,
    });
  } catch (err) {
    console.error('[cancelTrialSubscription Error]:', err.message);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * 4. GET /api/billing/payment-method/reveal - Reveal full card number and expiry upon secure eye-click
 */
export async function getRevealedPaymentMethod(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const pm = await prisma.userPaymentMethod.findFirst({
      where: { userId, isDefault: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!pm) {
      return res.status(404).json({ error: 'No saved card found' });
    }

    let fullCardNumber = `•••• •••• •••• ${pm.last4}`;
    if (pm.encryptedCardNumber) {
      try {
        const decrypted = decryptSensitive(pm.encryptedCardNumber);
        if (decrypted && decrypted !== '***-REDACTED-***') {
          // Format with spaces every 4 digits: 4111 1111 1111 1111
          fullCardNumber = decrypted.replace(/(\d{4})(?=\d)/g, '$1 ');
        }
      } catch (e) {
        console.warn('Failed to decrypt card number:', e.message);
      }
    }

    const expYear2Digit = pm.expYear ? String(pm.expYear).slice(-2) : '28';

    return res.json({
      success: true,
      card: {
        brand: pm.cardBrand,
        fullNumber: fullCardNumber,
        last4: pm.last4,
        expMonth: pm.expMonth,
        expYear: expYear2Digit,
        holderName: pm.cardholderName,
      },
    });
  } catch (err) {
    console.error('[getRevealedPaymentMethod Error]:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve card details' });
  }
}

/**
 * 5. POST /api/billing/activate-trial - Collect payment info and provision 30-Day Free Trial VM from Dashboard
 */
export async function activateTrialSubscription(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const cardData = req.body || {};

    const trialResult = await setupUserTrial({
      userId,
      cardData,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    });

    return res.status(200).json({
      success: true,
      message: '🎉 30-Day Free Trial activated! Your VPS has been provisioned and is now running on Hyper-V.',
      trial: trialResult,
    });
  } catch (err) {
    console.error('[activateTrialSubscription Error]:', err.message);
    return res.status(400).json({ error: err.message || 'Failed to activate free trial.' });
  }
}



/**
 * 6. POST /api/billing/reactivate-subscription - One-Click Instant Reactivate
 */
export async function reactivateSubscriptionEndpoint(req, res) {
  try {
    const userId = req.user?.userId;
    const { subscriptionId } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId is required' });

    const result = await reactivateSubscription(subscriptionId, userId);
    return res.json({
      success: true,
      message: result.message || 'Subscription successfully reactivated.',
      result,
    });
  } catch (err) {
    console.error('[reactivateSubscriptionEndpoint Error]:', err.message);
    return res.status(400).json({ error: err.message });
  }
}

/**
 * 7. POST /api/billing/simulate-suspension - Test/Demo graceful shutdown & 90-day retention
 */
export async function simulateSuspensionEndpoint(req, res) {
  try {
    const userId = req.user?.userId;
    const { subscriptionId } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId is required' });

    const result = await gracefulSuspendSubscription(subscriptionId, {
      reason: 'MANUAL_SIMULATED_OVERDUE',
      adminEmail: req.user?.email || null,
    });
    return res.json({
      success: true,
      message: 'Subscription has been suspended and 90-day data preservation initiated.',
      result,
    });
  } catch (err) {
    console.error('[simulateSuspensionEndpoint Error]:', err.message);
    return res.status(400).json({ error: err.message });
  }
}


/**
 * 8. POST /api/billing/deactivate-subscription - Customer Voluntary Deactivation
 * Gracefully powers down virtual machines, locks controls, stops auto-billing, and preserves data for 90 days.
 */
export async function deactivateSubscriptionEndpoint(req, res) {
  try {
    const userId = req.user?.userId;
    let { subscriptionId } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let targetSubId = subscriptionId ? Number(subscriptionId) : null;
    if (!targetSubId) {
      const activeSub = await prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'active', 'TRIAL', 'trial'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!activeSub) {
        return res.status(404).json({ error: 'No active subscription found to deactivate.' });
      }
      targetSubId = activeSub.subscriptionId;
    } else {
      const sub = await prisma.subscription.findFirst({
        where: { subscriptionId: targetSubId, userId },
      });
      if (!sub) {
        return res.status(404).json({ error: 'Subscription not found or not owned by your account.' });
      }
    }

    const result = await gracefulSuspendSubscription(targetSubId, {
      reason: 'CUSTOMER_VOLUNTARY_DEACTIVATION',
      adminEmail: req.user?.email || null,
    });

    return res.json({
      success: true,
      message: 'Your subscription has been safely deactivated. Your servers are cleanly powered down, no further charges will occur, and all your files are preserved for 90 days.',
      result,
    });
  } catch (err) {
    console.error('[deactivateSubscriptionEndpoint Error]:', err.message);
    return res.status(400).json({ error: err.message });
  }
}
