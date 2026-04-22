import express from 'express';
import Video from '../models/Video.js';
import Progress from '../models/Progress.js';
import AuditLog from '../models/AuditLog.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { extractYoutubeId } from '../utils/youtube.js';

const router = express.Router();

function normalizeVideoPayload(body, partial = false) {
  const updates = {};
  const errors = [];

  if (!partial || Object.prototype.hasOwnProperty.call(body, 'title')) {
    const title = String(body.title || '').trim();
    if (!title) errors.push('Task title is required.');
    else updates.title = title;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, 'youtubeUrl')) {
    const youtubeUrl = String(body.youtubeUrl || '').trim();
    const youtubeId = extractYoutubeId(youtubeUrl);
    if (!youtubeId) errors.push('A valid YouTube URL is required.');
    else {
      updates.youtubeUrl = youtubeUrl;
      updates.youtubeId = youtubeId;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, 'reward')) {
    const reward = Number(body.reward);
    if (!Number.isFinite(reward) || reward < 0) errors.push('Reward must be zero or greater.');
    else updates.reward = reward;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, 'durationSeconds')) {
    const durationSeconds = Number(body.durationSeconds);
    if (!Number.isFinite(durationSeconds) || durationSeconds < 1) errors.push('Duration must be at least 1 second.');
    else updates.durationSeconds = Math.round(durationSeconds);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    updates.isActive = Boolean(body.isActive);
  }

  return { updates, errors };
}

router.get('/', requireAuth, async (req, res) => {
  const videos = await Video.find({ isActive: true }).sort({ createdAt: -1 });
  const progress = await Progress.find({ user: req.user._id });
  res.json({ videos, progress });
});

router.get('/admin/all', requireAuth, requireAdmin, async (_req, res) => {
  const videos = await Video.find().sort({ createdAt: -1 });
  res.json({ videos });
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { updates, errors } = normalizeVideoPayload(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0] });

  const video = await Video.create(updates);
  await AuditLog.create({
    actor: req.user._id,
    action: 'video.create',
    targetType: 'Video',
    targetId: video._id,
    details: updates
  });
  res.status(201).json({ video });
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { updates, errors } = normalizeVideoPayload(req.body, true);
  if (errors.length) return res.status(400).json({ message: errors[0] });
  if (!Object.keys(updates).length) return res.status(400).json({ message: 'No valid task changes were provided.' });

  const video = await Video.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' });
  if (!video) return res.status(404).json({ message: 'Video not found.' });
  await AuditLog.create({
    actor: req.user._id,
    action: 'video.update',
    targetType: 'Video',
    targetId: video._id,
    details: updates
  });
  res.json({ video });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ message: 'Video not found.' });
  const progressResult = await Progress.deleteMany({ video: video._id });
  await Video.deleteOne({ _id: video._id });
  await AuditLog.create({
    actor: req.user._id,
    action: 'video.delete',
    targetType: 'Video',
    targetId: video._id,
    details: { title: video.title, youtubeUrl: video.youtubeUrl, deletedProgress: progressResult.deletedCount || 0 }
  });
  res.json({ message: 'Video deleted.', video, deletedProgress: progressResult.deletedCount || 0 });
});

export default router;
