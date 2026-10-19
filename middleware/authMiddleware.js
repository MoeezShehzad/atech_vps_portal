/*This file defines the authentication middleware for the API, which verifies JWT tokens in incoming requests. It checks for the presence of an authorization header, extracts the token, and verifies it using a secret key. If the token is valid, it attaches the decoded user information to the request object for further processing in subsequent route handlers. */

import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing or malformed.' });
  }

  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'atc_cloud_default_jwt_secret_must_change';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const rolesArray = Array.isArray(decoded.roles)
      ? decoded.roles
      : decoded.role
      ? [decoded.role]
      : ['Customer'];

    req.user = {
      ...decoded,
      userId: decoded.userId || decoded.id || decoded.sub,
      roles: rolesArray,
      role: rolesArray.some((r) => String(r).toLowerCase() === 'admin' || String(r).toLowerCase() === 'superuser')
        ? 'Admin'
        : rolesArray[0] || 'Customer',
    };

    next();
  });
};

export default authenticateToken;