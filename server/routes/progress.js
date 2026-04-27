import express from 'express';
import Progress from '../models/Progress.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { MIN_WATCH_SECONDS, TASK_COMPLETION_PERCENT } from '../config/business.js';

const router = express.Router();

router.post('/:videoId', requireAuth, rateLimit({ windowMs: 60_000, max: 120, keyPrefix: 'progress' }), async (req, res) => {
  const watchedSeconds = Math.max(0, Number(req.body.watchedSeconds || 0));
  const percent = Math.min(100, Math.max(0, Number(req.body.percent || 0)));
  const completed = Boolean(req.body.completed);
  const video = await Video.findById(req.params.videoId);
  if (!video || !video.isActive) return res.status(404).json({ message: 'Video not found.' });

  const existing = await Progress.findOne({ user: req.user._id, video: video._id });
  const alreadyCompleted = Boolean(existing?.completed);
  const meetsMinimumWatch = watchedSeconds >= Math.min(MIN_WATCH_SECONDS, Math.max(1, video.durationSeconds - 2));
  const shouldComplete = meetsMinimumWatch && (alreadyCompleted || completed || percent >= TASK_COMPLETION_PERCENT || watchedSeconds >= Math.max(1, video.durationSeconds - 2));

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

  if (shouldComplete) {
    const rewardClaim = await Progress.findOneAndUpdate(
      { _id: progress._id, rewardPaid: { $ne: true } },
      { $set: { rewardPaid: true } },
      { returnDocument: 'after' }
    );
    if (!rewardClaim) return res.json({ progress });
    progress.rewardPaid = true;

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { balance: video.reward, todayEarnings: video.reward }
    });
    await Transaction.create({
      user: req.user._id,
      type: 'earning',
      amount: video.reward,
      earningSource: 'video_task',
      status: 'approved',
      notes: `Watched: ${video.title}`
    });
  }

  res.json({ progress });
});

export default router;
