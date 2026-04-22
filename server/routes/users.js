import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Transaction from '../models/Transaction.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', requireAuth, async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [completedToday, totalCompleted, transactions, directReferrals, levelTwoReferrals, todaysEarnings] = await Promise.all([
    Progress.countDocuments({
      user: req.user._id,
      completed: true,
      completedAt: { $gte: startOfDay }
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
    ]),
    Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: { $in: ['earning', 'referral'] },
          status: 'approved',
          createdAt: { $gte: startOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  res.json({
    user: {
      ...req.user.toObject(),
      todayEarnings: todaysEarnings[0]?.total || 0
    },
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

router.get('/team', requireAuth, async (req, res) => {
  const level1 = await User.find({ referredBy: req.user._id })
    .select('username email phone referralCode referralEarnings balance createdAt')
    .sort({ createdAt: -1 });

  const level1Ids = level1.map((user) => user._id);
  const level2 = level1Ids.length
    ? await User.find({ referredBy: { $in: level1Ids } })
      .select('username email phone referralCode referralEarnings balance createdAt referredBy')
      .sort({ createdAt: -1 })
    : [];

  res.json({
    levels: {
      level1,
      level2
    },
    stats: {
      level1: level1.length,
      level2: level2.length,
      total: level1.length + level2.length,
      referralEarnings: req.user.referralEarnings || 0
    }
  });
});

router.put('/profile', requireAuth, async (req, res) => {
  const { username, phone, email, password } = req.body;
  const updates = {};
  if (username) updates.username = username;
  if (phone !== undefined) updates.phone = String(phone).trim();
  if (email) updates.email = email.toLowerCase();
  if (password) {
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    updates.passwordHash = await bcrypt.hash(password, 12);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash');
  res.json({ user });
});

export default router;
