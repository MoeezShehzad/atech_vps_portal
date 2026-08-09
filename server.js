import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import userRoutes from './routes/user.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const prisma = new PrismaClient();

// 1. CORS Configuration
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Cookie Parser Middleware
app.use(cookieParser());

// 3. Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
}));

// 4. Passport & Body parser middlewares
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// 5. Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);

// 6. Passport Google Strategy Setup
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/api/auth/google/callback"
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0]?.value;
      const fullName = profile.displayName;

      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }

      let user = await prisma.user.findUnique({
        where: { email },
        include: {
          userRoles: {
            include: { role: true }
          }
        }
      });

      if (!user) {
        // Fetch or assign default Customer role
        const customerRole = await prisma.role.findUnique({
          where: { roleName: 'Customer' }
        });

        user = await prisma.$transaction(async (tx) => {
          const createdUser = await tx.user.create({
            data: { email, fullName }
          });

          if (customerRole) {
            await tx.userRole.create({
              data: {
                userId: createdUser.userId,
                roleId: customerRole.roleId
              }
            });
          }

          return createdUser;
        });

        // Re-fetch user with userRoles populated
        user = await prisma.user.findUnique({
          where: { userId: user.userId },
          include: {
            userRoles: {
              include: { role: true }
            }
          }
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// 7. OAuth Routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5174/login?error=oauth_failed', session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const roles = user.userRoles?.map((ur) => ur.role.roleName) || ['Customer'];

      // 1. Generate short-lived Access Token (15m)
      const accessToken = jwt.sign(
        { userId: user.userId, email: user.email, roles },
        process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access-secret',
        { expiresIn: '15m' }
      );

      // 2. Generate long-lived Refresh Token (7d)
      const refreshToken = jwt.sign(
        { userId: user.userId },
        process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        { expiresIn: '7d' }
      );

      // 3. Store Refresh Token in DB
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // 4. Set HttpOnly Cookie for Refresh Token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // 5. Update last login
      await prisma.user.update({
        where: { userId: user.userId },
        data: { lastLoginAt: new Date() }
      });

      // 6. Redirect to frontend OAuth callback page with accessToken and user state
      const userObj = {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || null,
        roles
      };

      const userDataStr = encodeURIComponent(JSON.stringify(userObj));
      res.redirect(`http://localhost:5174/auth/callback?token=${accessToken}&user=${userDataStr}`);
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      res.redirect('http://localhost:5174/login?error=oauth_failed');
    }
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});