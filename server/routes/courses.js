import express from 'express';
import Course from '../models/Course.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const course = await Course.create({
      title: String(req.body.title || '').trim(),
      description: String(req.body.description || '').trim(),
      videoUrl: String(req.body.videoUrl || '').trim(),
      channelUrl: String(req.body.channelUrl || '').trim(),
      driveUrl: String(req.body.driveUrl || '').trim()
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id, 
      {
        title: String(req.body.title || '').trim(),
        description: String(req.body.description || '').trim(),
        videoUrl: String(req.body.videoUrl || '').trim(),
        channelUrl: String(req.body.channelUrl || '').trim(),
        driveUrl: String(req.body.driveUrl || '').trim()
      },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
