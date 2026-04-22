import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Transaction from '../models/Transaction.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', requireAuth, async (req, res) => {
  const [completedToday, totalCompleted, transactions, directReferrals, levelTwoReferrals] = await Promise.all([
    Progress.countDocuments({
      user: req.user._id,
      completed: true,
      completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }),
    Progress.countDocuments({ user: req.user._id, completed: true }),
    Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(8),
    User.countDocuments({ referredBy: req.user._id }),
    User.aggregate([
      { $match: { referredBy: req.user._id } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'referredBy',
          as: 'children'
        }
      },
      { $project: { count: { $size: '$children' } } },
      { $group: { _id: null, total: { $sum: '$count' } } }
    ])
  ]);

  res.json({
    user: req.user,
    stats: {
      completedToday,
      totalCompleted,
      directReferrals,
      levelTwoReferrals: levelTwoReferrals[0]?.total || 0,
      dailyLimit: req.user.activePlan.dailyLimit,
      progressPercent: Math.min(100, Math.round((completedToday / req.user.activePlan.dailyLimit) * 100))
    },
    transactions
  });
});

router.put('/profile', requireAuth, async (req, res) => {
  const { username, email, password } = req.body;
  const updates = {};
  if (username) updates.username = username;
  if (email) updates.email = email.toLowerCase();
  if (password) {
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    updates.passwordHash = await bcrypt.hash(password, 12);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash');
  res.json({ user });
});

export default router;
