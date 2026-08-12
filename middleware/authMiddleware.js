/*This file defines the authentication middleware for the API, which verifies JWT tokens in incoming requests. It checks for the presence of an authorization header, extracts the token, and verifies it using a secret key. If the token is valid, it attaches the decoded user information to the request object for further processing in subsequent route handlers. */

import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing or malformed.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwt', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    req.user = {
      ...decoded,
      userId: decoded.userId || decoded.id || decoded.sub,
    };

    next();
  });
};

export default authenticateToken;