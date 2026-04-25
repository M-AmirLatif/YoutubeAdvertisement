import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Transaction from '../models/Transaction.js';
import { requireAuth } from '../middleware/auth.js';
import { getAppSettings } from '../utils/appSettings.js';
import { applyDailyPlanEarningIfDue, calculateDailyPlanAmount } from '../utils/planEarnings.js';
import { buildPlanPurchaseReferralMatch } from '../utils/referrals.js';

const router = express.Router();

router.get('/dashboard', requireAuth, async (req, res) => {
  const freshUser = await applyDailyPlanEarningIfDue(req.user);
  const user = freshUser || req.user;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [completedToday, totalCompleted, transactions, directReferrals, levelTwoReferrals, taskEarningsToday, planEarningsToday, referralEarningsToday, referralEarnings] = await Promise.all([
    Progress.countDocuments({
      user: user._id,
      completed: true,
      completedAt: { $gte: startOfDay }
    }),
    Progress.countDocuments({ user: user._id, completed: true }),
    Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(8),
    User.countDocuments({ referredBy: user._id }),
    User.aggregate([
      { $match: { referredBy: user._id } },
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
          user: user._id,
          status: 'approved',
          type: 'earning',
          earningSource: 'video_task',
          createdAt: { $gte: startOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: 'earning',
          earningSource: 'daily_plan',
          status: 'approved',
          createdAt: { $gte: startOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: buildPlanPurchaseReferralMatch({ user: user._id, createdAt: { $gte: startOfDay } }) },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: buildPlanPurchaseReferralMatch({ user: user._id }) },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const todayTaskEarnings = taskEarningsToday[0]?.total || 0;
  const todayPlanEarnings = planEarningsToday[0]?.total || 0;
  const todayReferralEarnings = referralEarningsToday[0]?.total || 0;
  const todayTotalEarnings = todayTaskEarnings + todayPlanEarnings + todayReferralEarnings;

  res.json({
    user: {
      ...user.toObject(),
      todayEarnings: todayTotalEarnings,
      referralEarnings: referralEarnings[0]?.total || user.referralEarnings || 0
    },
    stats: {
      completedToday,
      totalCompleted,
      directReferrals,
      levelTwoReferrals: levelTwoReferrals[0]?.total || 0,
      dailyLimit: user.activePlan.dailyLimit,
      progressPercent: Math.min(100, Math.round((completedToday / user.activePlan.dailyLimit) * 100)),
      referralEarnings: referralEarnings[0]?.total || user.referralEarnings || 0,
      taskEarningsToday: todayTaskEarnings,
      planEarningsToday: todayPlanEarnings,
      referralEarningsToday: todayReferralEarnings,
      totalEarningsToday: todayTotalEarnings,
      dailyPlanAmount: calculateDailyPlanAmount(user.activePlan),
      activePlanName: user.activePlan?.name || 'Free'
    },
    transactions
  });
});

router.get('/social-settings', requireAuth, async (req, res) => {
  const settings = await getAppSettings();
  res.json({
    socialLinks: settings.socialLinks,
    socialFollowCompleted: Boolean(req.user.socialFollowCompleted),
    socialFollowCompletedAt: req.user.socialFollowCompletedAt || null
  });
});

router.post('/social-follow', requireAuth, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      socialFollowCompleted: true,
      socialFollowCompletedAt: new Date()
    },
    { new: true }
  ).select('-passwordHash');

  res.json({
    user,
    socialFollowCompleted: true,
    socialFollowCompletedAt: user.socialFollowCompletedAt
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
      referralEarnings: await Transaction.aggregate([
        { $match: buildPlanPurchaseReferralMatch({ user: req.user._id }) },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then((rows) => rows[0]?.total || 0)
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
