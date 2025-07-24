const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;


// Passport Google Strategy setup here
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.emails[0].value,
          googleId: profile.id,
          name: profile.displayName,
        },
      });
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google Auth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login-failure', session: false }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user.id, email: req.user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'User Signed up', token });
  }
);

router.get('/login-failure', (req, res) => {
  res.status(401).send('Failed to authenticate.');
});

module.exports = router;
