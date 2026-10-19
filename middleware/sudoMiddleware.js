// ==============================================================================
// Middleware: sudoMiddleware.js
// Purpose: Enforces Step-Up Authentication (SUDO mode) for sensitive operations:
//          - Server termination / OS reinstall
//          - Root/Admin password reset
//          - Adding/deleting SSH keys or API credentials
//          - Modifying billing methods or contact emails
// Stateful: Grants a 15-minute privileged session window once verified
// ==============================================================================

import jwt from 'jsonwebtoken';

export const requireSudoMode = (req, res, next) => {
  const sudoToken =
    req.cookies?.atc_sudo_token ||
    req.headers['x-sudo-token'] ||
    req.body?.sudoToken;

  if (!sudoToken) {
    return res.status(403).json({
      sudoRequired: true,
      error: 'Privileged administrative authorization required (SUDO mode). Please verify your identity with a one-time security code.',
    });
  }

  const secret = process.env.JWT_SECRET || 'sudo_secret_fallback';
  try {
    const decoded = jwt.verify(sudoToken, secret);
    if (!decoded.sudo || (req.user && decoded.userId !== req.user.userId)) {
      return res.status(403).json({
        sudoRequired: true,
        error: 'Privileged session expired or unauthorized for this user. Please re-authenticate.',
      });
    }

    req.sudoSession = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      sudoRequired: true,
      error: 'Privileged session expired. Please re-enter a verification code.',
    });
  }
};

export default requireSudoMode;
