import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';
import { MIN_WITHDRAWAL_AMOUNT, plans } from '../config/business.js';

const router = express.Router();

function getDepositWallets() {
  const depositWallets = {
    'USDT-TRC20': process.env.DEPOSIT_WALLET_TRC20 || process.env.DEPOSIT_WALLET_ADDRESS || '',
    'USDT-BEP20': process.env.DEPOSIT_WALLET_BEP20 || process.env.DEPOSIT_WALLET_ADDRESS || ''
  };
  if (process.env.DEPOSIT_WALLET_ERC20) {
    depositWallets['USDT-ERC20'] = process.env.DEPOSIT_WALLET_ERC20;
  }
  return depositWallets;
}

function validNetworks() {
  return Object.entries(getDepositWallets())
    .filter(([, wallet]) => Boolean(wallet))
    .map(([network]) => network);
}

router.get('/plans', requireAuth, (_req, res) => {
  const depositWallets = getDepositWallets();

  res.json({
    plans,
    minWithdrawal: MIN_WITHDRAWAL_AMOUNT,
    depositWallet: process.env.DEPOSIT_WALLET_ADDRESS || '',
    depositWallets
  });
});

router.get('/', requireAuth, async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ transactions });
});

router.get('/admin/all', requireAuth, requireAdmin, async (_req, res) => {
  const transactions = await Transaction.find()
    .populate('user', 'username email role balance')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ transactions });
});

router.post('/deposit', requireAuth, async (req, res) => {
  const { planName, walletAddress, network, proof } = req.body;
  const plan = plans.find((item) => item.name === planName);
  const allowedNetworks = validNetworks();
  if (!plan) return res.status(400).json({ message: 'Select a valid plan.' });
  if (allowedNetworks.length && !allowedNetworks.includes(network)) {
    return res.status(400).json({ message: 'Select a supported USDT network.' });
  }
  if (plan.price > 0 && (!proof || String(proof).trim().length < 6)) {
    return res.status(400).json({ message: 'Enter a transaction hash or payment proof reference.' });
  }
  const proofValue = String(proof || '').trim();
  if (proofValue) {
    const duplicate = await Transaction.findOne({
      type: 'deposit',
      proof: proofValue,
      status: { $ne: 'rejected' }
    });
    if (duplicate) {
      return res.status(409).json({ message: 'This transaction hash/proof has already been submitted.' });
    }
  }

  let transaction;
  try {
    transaction = await Transaction.create({
      user: req.user._id,
      type: 'deposit',
      amount: plan.price,
      plan: plan.name,
      walletAddress,
      network,
      proof: proofValue,
      status: plan.price > 0 ? 'pending' : 'approved',
      notes: plan.price > 0 ? 'USDT deposit request' : 'Free plan activated'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This transaction hash/proof has already been submitted.' });
    }
    throw error;
  }

  if (plan.price <= 0) {
    await User.findByIdAndUpdate(req.user._id, { activePlan: plan });
  }

  res.status(201).json({ transaction, plan });
});

router.post('/withdraw', requireAuth, async (req, res) => {
  const { amount, walletAddress, network } = req.body;
  const numericAmount = Number(amount);
  const allowedNetworks = validNetworks();
  if (!numericAmount || numericAmount <= 0) return res.status(400).json({ message: 'Enter a valid amount.' });
  if (allowedNetworks.length && !allowedNetworks.includes(network)) {
    return res.status(400).json({ message: 'Select a supported USDT network.' });
  }
  if (numericAmount < MIN_WITHDRAWAL_AMOUNT) {
    return res.status(400).json({ message: `Minimum withdrawal is $${MIN_WITHDRAWAL_AMOUNT.toFixed(2)}.` });
  }
  if (!walletAddress || String(walletAddress).trim().length < 10) {
    return res.status(400).json({ message: 'Enter a valid USDT wallet address.' });
  }
  const user = await User.findOneAndUpdate(
    { _id: req.user._id, balance: { $gte: numericAmount } },
    { $inc: { balance: -numericAmount, totalWithdrawn: numericAmount } },
    { new: true }
  );
  if (!user) return res.status(400).json({ message: 'Insufficient balance.' });

  let transaction;
  try {
    transaction = await Transaction.create({
      user: req.user._id,
      type: 'withdrawal',
      amount: numericAmount,
      walletAddress: String(walletAddress).trim(),
      network,
      status: 'pending',
      notes: 'USDT withdrawal request'
    });
  } catch (error) {
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { balance: numericAmount, totalWithdrawn: -numericAmount }
    });
    throw error;
  }

  res.status(201).json({ transaction });
});

router.put('/admin/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status, notes } = req.body;
  if (!['pending', 'approved', 'rejected', 'paid'].includes(status)) {
    return res.status(400).json({ message: 'Invalid transaction status.' });
  }

  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });

  const previousStatus = transaction.status;
  const finalForType = transaction.type === 'deposit' ? ['approved', 'rejected'] : ['paid', 'rejected'];
  if (finalForType.includes(previousStatus)) {
    return res.status(400).json({ message: `This ${transaction.type} request is already ${previousStatus}.` });
  }
  if (transaction.type === 'deposit' && !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Deposits can only be approved or rejected.' });
  }
  if (transaction.type === 'withdrawal' && !['paid', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Withdrawals can only be marked paid or rejected.' });
  }
  const creditedStatuses = ['approved', 'paid'];
  transaction.status = status;
  transaction.reviewedBy = req.user._id;
  transaction.reviewedAt = new Date();
  if (notes) transaction.notes = String(notes).trim();
  await transaction.save();

  if (transaction.type === 'deposit' && !creditedStatuses.includes(previousStatus) && creditedStatuses.includes(status)) {
    const plan = plans.find((item) => item.name === transaction.plan);
    if (plan) await User.findByIdAndUpdate(transaction.user, { activePlan: plan });
  }

  if (transaction.type === 'withdrawal' && previousStatus !== 'rejected' && status === 'rejected') {
    await User.findByIdAndUpdate(transaction.user, {
      $inc: { balance: transaction.amount, totalWithdrawn: -transaction.amount }
    });
  }

  if (transaction.type === 'withdrawal' && previousStatus === 'rejected' && status !== 'rejected') {
    await User.findByIdAndUpdate(transaction.user, {
      $inc: { balance: -transaction.amount, totalWithdrawn: transaction.amount }
    });
  }

  await AuditLog.create({
    actor: req.user._id,
    action: `transaction.${status}`,
    targetType: 'Transaction',
    targetId: transaction._id,
    details: { previousStatus, type: transaction.type, amount: transaction.amount, notes: transaction.notes }
  });

  const populated = await Transaction.findById(transaction._id).populate('user', 'username email role balance');
  res.json({ transaction: populated });
});

export default router;
