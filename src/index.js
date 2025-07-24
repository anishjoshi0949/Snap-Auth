require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const { applyCors, requestLogger } = require('./middleware');

const authRoutes = require('./routes/auth');          // normal signup/login routes
const googleAuthRoutes = require('./routes/googleAuth'); // google OAuth routes

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret';
const otpRoutes = require('./routes/auth'); // ✅ Added this line


// Middleware
app.use(express.json());
app.use(requestLogger);
app.use(applyCors);

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: false,
  },
}));

app.use(passport.initialize());
app.use(passport.session()); // only if you want session support, else skip

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', googleAuthRoutes);

app.get('/', (req, res) => {
  res.send('Auth API is running 🚀');
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
