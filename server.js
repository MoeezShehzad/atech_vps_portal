import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors'; // Added CORS import
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import userRoutes from './routes/user.js';

const app = express();
const prisma = new PrismaClient();

// 1. CORS Configuration (Must be placed before routes & body parsers)
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
}));

// 3. Passport & Body parser middlewares
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// 4. User Routes mounting
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);

// 5. Passport Google Strategy Setup
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

      // Check if user exists in database
      let user = await prisma.user.findUnique({
        where: { email }
      });

      // If user doesn't exist, create a new record
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            fullName,
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

// 6. OAuth Routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5174/login?error=oauth_failed' }),
  (req, res) => {
    // Generate JWT token using user.userId or user.id
    const userId = req.user.userId || req.user.id;
    const token = jwt.sign(
      { userId, email: req.user.email },
      process.env.JWT_SECRET || 'supersecretjwt',
      { expiresIn: '7d' }
    );

    const userData = encodeURIComponent(JSON.stringify(req.user));
    res.redirect(`http://localhost:5174/auth/callback?token=${token}&user=${userData}`);
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});