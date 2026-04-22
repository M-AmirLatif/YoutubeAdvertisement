import express from 'express';
import Progress from '../models/Progress.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { MIN_WATCH_SECONDS, REFERRAL_LEVEL_1_RATE, REFERRAL_LEVEL_2_RATE, TASK_COMPLETION_PERCENT } from '../config/business.js';

const router = express.Router();

router.post('/:videoId', requireAuth, rateLimit({ windowMs: 60_000, max: 120, keyPrefix: 'progress' }), async (req, res) => {
  const watchedSeconds = Math.max(0, Number(req.body.watchedSeconds || 0));
  const percent = Math.min(100, Math.max(0, Number(req.body.percent || 0)));
  const completed = Boolean(req.body.completed);
  const video = await Video.findById(req.params.videoId);
  if (!video || !video.isActive) return res.status(404).json({ message: 'Video not found.' });

  const existing = await Progress.findOne({ user: req.user._id, video: video._id });
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const completedToday = await Progress.countDocuments({
    user: req.user._id,
    completed: true,
    completedAt: { $gte: startOfDay }
  });
  const alreadyCompleted = Boolean(existing?.completed);
  const dailyLimitReached = completedToday >= req.user.activePlan.dailyLimit && !alreadyCompleted;
  const meetsMinimumWatch = watchedSeconds >= Math.min(MIN_WATCH_SECONDS, Math.max(1, video.durationSeconds - 2));
  const shouldComplete = !dailyLimitReached && meetsMinimumWatch && (completed || percent >= TASK_COMPLETION_PERCENT || watchedSeconds >= Math.max(1, video.durationSeconds - 2));

  const progress = await Progress.findOneAndUpdate(
    { user: req.user._id, video: video._id },
    {
      $max: { watchedSeconds, percent },
      $set: {
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || ''
      },
      ...(shouldComplete ? { completed: true, completedAt: existing?.completedAt || new Date() } : {})
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  if (dailyLimitReached) {
    return res.status(429).json({ message: 'Daily task limit reached for your active plan.', progress });
  }

  if (shouldComplete && !progress.rewardPaid) {
    progress.rewardPaid = true;
    await progress.save();
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { balance: video.reward, todayEarnings: video.reward }
    });
    await Transaction.create({
      user: req.user._id,
      type: 'earning',
      amount: video.reward,
      status: 'approved',
      notes: `Watched: ${video.title}`
    });

    if (req.user.referredBy && REFERRAL_LEVEL_1_RATE > 0) {
      const referrer = await User.findById(req.user.referredBy);
      if (referrer && !referrer.isSuspended) {
        const amount = Number((video.reward * REFERRAL_LEVEL_1_RATE).toFixed(4));
        await User.findByIdAndUpdate(referrer._id, {
          $inc: { balance: amount, referralEarnings: amount }
        });
        await Transaction.create({
          user: referrer._id,
          type: 'referral',
          amount,
          status: 'approved',
          notes: `Level 1 referral commission from ${req.user.username} watching ${video.title}`
        });

        if (referrer.referredBy && REFERRAL_LEVEL_2_RATE > 0) {
          const levelTwoReferrer = await User.findById(referrer.referredBy);
          if (levelTwoReferrer && !levelTwoReferrer.isSuspended) {
            const levelTwoAmount = Number((video.reward * REFERRAL_LEVEL_2_RATE).toFixed(4));
            await User.findByIdAndUpdate(levelTwoReferrer._id, {
              $inc: { balance: levelTwoAmount, referralEarnings: levelTwoAmount }
            });
            await Transaction.create({
              user: levelTwoReferrer._id,
              type: 'referral',
              amount: levelTwoAmount,
              status: 'approved',
              notes: `Level 2 referral commission from ${req.user.username} through ${referrer.username}`
            });
          }
        }
      }
    }
  }

  res.json({ progress });
});

export default router;
