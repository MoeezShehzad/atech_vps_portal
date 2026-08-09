import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy Setup
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

// --- OAUTH ROUTES ---
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5174/login?error=oauth_failed' }),
  (req, res) => {
    // 1. Generate a JWT token using the authenticated user's ID
    const token = jwt.sign(
      { userId: req.user.userId, email: req.user.email },
      process.env.JWT_SECRET || 'supersecretjwt',
      { expiresIn: '7d' }
    );

    // 2. Encode user data safely for URL transport
    const userData = encodeURIComponent(JSON.stringify(req.user));

    // 3. Redirect to frontend AuthCallback handler with token and user data
    res.redirect(`http://localhost:5174/auth/callback?token=${token}&user=${userData}`);
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});