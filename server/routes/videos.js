import express from 'express';
import Video from '../models/Video.js';
import Progress from '../models/Progress.js';
import AuditLog from '../models/AuditLog.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { extractYoutubeId } from '../utils/youtube.js';

const router = express.Router();

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
  const { title, youtubeUrl, reward, durationSeconds } = req.body;
  const youtubeId = extractYoutubeId(youtubeUrl || '');
  if (!title || !youtubeId) return res.status(400).json({ message: 'Valid title and YouTube URL are required.' });

  const video = await Video.create({ title, youtubeUrl, youtubeId, reward, durationSeconds });
  await AuditLog.create({
    actor: req.user._id,
    action: 'video.create',
    targetType: 'Video',
    targetId: video._id,
    details: { title, youtubeUrl, reward, durationSeconds }
  });
  res.status(201).json({ video });
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const updates = { ...req.body };
  if (updates.youtubeUrl) updates.youtubeId = extractYoutubeId(updates.youtubeUrl);
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
  const video = await Video.findByIdAndUpdate(req.params.id, { isActive: false }, { returnDocument: 'after' });
  if (!video) return res.status(404).json({ message: 'Video not found.' });
  await AuditLog.create({
    actor: req.user._id,
    action: 'video.deactivate',
    targetType: 'Video',
    targetId: video._id,
    details: { title: video.title }
  });
  res.json({ video });
});

export default router;
