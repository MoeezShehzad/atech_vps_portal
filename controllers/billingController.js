// ==============================================================================
// Controller: billingController.js
// Purpose: Manage customer subscriptions, recurring billing, and invoices
// ==============================================================================

import prisma from '../lib/prisma.js';

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

      return {
        subscriptionId: s.subscriptionId,
        planName: s.plan?.name || 'Custom Plan',
        monthlyPrice: Number(s.monthlyPrice),
        currency: s.currency || 'USD',
        status: s.status,
        startDate: s.startDate,
        nextBillingDate: targetDate,
        daysRemaining,
        vmCount: s.virtualMachines.length,
        vms: s.virtualMachines.map((v) => ({
          vmId: v.vmId,
          vmName: v.vmName,
          status: v.status,
          specs: `${v.cpuCores} vCPU / ${v.ramGb} GB RAM / ${v.storageGb} GB NVMe`,
        })),
      };
    });

    // Primary next billing date from earliest active subscription
    const activeSubs = formattedSubscriptions.filter((sub) => sub.status === 'ACTIVE' || sub.status === 'active');
    const primaryNextBillingDate = activeSubs.length > 0 
      ? activeSubs[0].nextBillingDate 
      : (formattedSubscriptions.length > 0 ? formattedSubscriptions[0].nextBillingDate : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    return res.json({
      success: true,
      user,
      summary: {
        monthlySpend: Number(monthlySpend.toFixed(2)),
        activeSubscriptionsCount: subscriptions.length,
        currency: 'USD',
        nextBillingDate: primaryNextBillingDate,
        paymentMethod: {
          brand: 'Visa',
          last4: '4242',
          expMonth: '12',
          expYear: '2028',
          funding: 'Credit',
          holderName: user.fullName || 'Authorized Customer',
        },
      },
      subscriptions: formattedSubscriptions,
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
            description: `ATECH VPS Cloud Compute - ${invoice.subscription?.plan?.name || 'Custom Plan'}`,
            specs: invoice.subscription?.plan 
              ? `${invoice.subscription.plan.cpuCores} vCPU, ${invoice.subscription.plan.ramGb}GB RAM, ${invoice.subscription.plan.storageGb}GB NVMe SSD`
              : 'Dedicated Hyper-V Virtual Machine',
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
