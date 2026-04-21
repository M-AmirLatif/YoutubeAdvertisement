import express from 'express';
import User from '../models/User.js';
import Video from '../models/Video.js';
import Progress from '../models/Progress.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', async (_req, res) => {
  const [users, admins, activeVideos, completedTasks, pendingDeposits, pendingWithdrawals, totals] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'admin' }),
    Video.countDocuments({ isActive: true }),
    Progress.countDocuments({ completed: true }),
    Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
    Transaction.countDocuments({ type: 'withdrawal', status: 'pending' }),
    Transaction.aggregate([
      { $match: { status: { $in: ['approved', 'paid'] } } },
      { $group: { _id: '$type', amount: { $sum: '$amount' } } }
    ])
  ]);

  res.json({
    stats: {
      users,
      admins,
      activeVideos,
      completedTasks,
      pendingDeposits,
      pendingWithdrawals,
      totals: Object.fromEntries(totals.map((item) => [item._id, item.amount]))
    }
  });
});

router.get('/users', async (_req, res) => {
  const users = await User.find()
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ users });
});

router.put('/users/:id', async (req, res) => {
  const { role, balance, isSuspended } = req.body;
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found.' });
  if (target.isOwner && !req.user.isOwner) {
    return res.status(403).json({ message: 'Only the owner can update the owner account.' });
  }

  const updates = {};
  if (['user', 'admin'].includes(role)) updates.role = role;
  if (balance !== undefined && Number.isFinite(Number(balance))) updates.balance = Number(balance);
  if (typeof isSuspended === 'boolean') updates.isSuspended = isSuspended;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' }).select('-passwordHash');
  await AuditLog.create({
    actor: req.user._id,
    action: 'user.update',
    targetType: 'User',
    targetId: user._id,
    details: updates
  });
  res.json({ user });
});

router.get('/audit-logs', async (_req, res) => {
  const logs = await AuditLog.find()
    .populate('actor', 'username email')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ logs });
});

export default router;
