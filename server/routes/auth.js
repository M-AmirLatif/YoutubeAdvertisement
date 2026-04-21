import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { makeReferralCode } from '../utils/youtube.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { REFERRAL_BONUS } from '../config/business.js';

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
}

function publicUser(user) {
  const json = user.toObject ? user.toObject() : user;
  delete json.passwordHash;
  return json;
}

const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, keyPrefix: 'auth' });

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', authLimiter, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const referralCode = String(req.body.referralCode || '').trim().toUpperCase();
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }
    if (username.length < 3 || username.length > 40) {
      return res.status(400).json({ message: 'Username must be 3 to 40 characters.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email is already registered.' });

    const referrer = referralCode ? await User.findOne({ referralCode }) : null;
    if (referralCode && !referrer) {
      return res.status(400).json({ message: 'Referral code was not found.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email,
      passwordHash,
      referralCode: makeReferralCode(username),
      referredBy: referrer?._id || null
    });

    if (referrer) {
      referrer.balance += REFERRAL_BONUS;
      referrer.referralEarnings += REFERRAL_BONUS;
      await referrer.save();
      await Transaction.create({
        user: referrer._id,
        type: 'referral',
        amount: REFERRAL_BONUS,
        status: 'approved',
        notes: `Referral bonus for inviting ${username}`
      });
    }

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
    if (user.isSuspended) return res.status(403).json({ message: 'This account is suspended. Contact support.' });

    const valid = await bcrypt.compare(password || '', user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/request-password-reset', authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email });
    const genericMessage = 'If that email exists, a password reset token has been created.';

    if (!user || user.isSuspended) {
      return res.json({ message: genericMessage });
    }

    const token = crypto.randomBytes(24).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60_000);
    await user.save();

    if (process.env.NODE_ENV === 'production') {
      return res.json({ message: genericMessage });
    }

    res.json({ message: genericMessage, resetToken: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const token = String(req.body.token || '').trim();
    const password = String(req.body.password || '');
    if (!token || password.length < 6) {
      return res.status(400).json({ message: 'Valid reset token and a 6 character password are required.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token.' });

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = '';
    user.passwordResetExpiresAt = null;
    await user.save();

    res.json({ message: 'Password has been reset. You can sign in now.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
