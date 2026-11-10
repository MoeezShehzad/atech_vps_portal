const fs = require('fs');

// 1. Update controllers/billingController.js
let billingCode = fs.readFileSync('controllers/billingController.js', 'utf8').replace(/\r\n/g, '\n');

const deactivateFunc = `

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
`;

if (!billingCode.includes('deactivateSubscriptionEndpoint')) {
  billingCode += deactivateFunc;
  fs.writeFileSync('controllers/billingController.js', billingCode, 'utf8');
  console.log('Appended deactivateSubscriptionEndpoint to controllers/billingController.js');
}

// 2. Update routes/billingRoutes.js
let routesCode = fs.readFileSync('routes/billingRoutes.js', 'utf8').replace(/\r\n/g, '\n');
if (!routesCode.includes('deactivateSubscriptionEndpoint')) {
  routesCode = routesCode.replace(
    'simulateSuspensionEndpoint,',
    'simulateSuspensionEndpoint,\n  deactivateSubscriptionEndpoint,'
  );
  routesCode = routesCode.replace(
    "router.post('/simulate-suspension', simulateSuspensionEndpoint);",
    "router.post('/simulate-suspension', simulateSuspensionEndpoint);\nrouter.post('/deactivate-subscription', deactivateSubscriptionEndpoint);"
  );
  fs.writeFileSync('routes/billingRoutes.js', routesCode, 'utf8');
  console.log('Updated routes/billingRoutes.js');
}
