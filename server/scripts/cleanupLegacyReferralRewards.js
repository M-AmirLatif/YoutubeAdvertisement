import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { buildLegacyReferralMatch, buildPlanPurchaseReferralMatch } from '../utils/referrals.js';

dotenv.config();

function roundAmount(value) {
  return Number(Number(value || 0).toFixed(4));
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/youtube-advertisement', {
    serverSelectionTimeoutMS: 5000
  });

  const legacyTransactions = await Transaction.find(buildLegacyReferralMatch())
    .select('_id user amount notes status')
    .lean();

  if (!legacyTransactions.length) {
    const validTotals = await Transaction.aggregate([
      { $match: buildPlanPurchaseReferralMatch() },
      { $group: { _id: '$user', total: { $sum: '$amount' } } }
    ]);
    const validMap = new Map(validTotals.map((item) => [String(item._id), roundAmount(item.total)]));
    const users = await User.find().select('_id referralEarnings').lean();
    for (const user of users) {
      const nextReferralEarnings = validMap.get(String(user._id)) || 0;
      if (roundAmount(user.referralEarnings) !== nextReferralEarnings) {
        await User.findByIdAndUpdate(user._id, { referralEarnings: nextReferralEarnings });
      }
    }
    console.log('No legacy referral rewards found. Referral totals were synchronized.');
    await mongoose.disconnect();
    return;
  }

  const removedByUser = new Map();
  for (const tx of legacyTransactions) {
    const key = String(tx.user);
    removedByUser.set(key, roundAmount((removedByUser.get(key) || 0) + Number(tx.amount || 0)));
  }

  for (const [userId, removedAmount] of removedByUser.entries()) {
    const user = await User.findById(userId).select('balance');
    if (!user) continue;
    const nextBalance = roundAmount(Math.max(0, Number(user.balance || 0) - removedAmount));
    await User.findByIdAndUpdate(userId, { balance: nextBalance });
  }

  await Transaction.updateMany(
    { _id: { $in: legacyTransactions.map((tx) => tx._id) } },
    {
      $set: { status: 'rejected' },
      $unset: { referralSource: '' }
    }
  );

  const validTotals = await Transaction.aggregate([
    { $match: buildPlanPurchaseReferralMatch() },
    { $group: { _id: '$user', total: { $sum: '$amount' } } }
  ]);
  const validMap = new Map(validTotals.map((item) => [String(item._id), roundAmount(item.total)]));
  const users = await User.find().select('_id referralEarnings').lean();
  for (const user of users) {
    const nextReferralEarnings = validMap.get(String(user._id)) || 0;
    if (roundAmount(user.referralEarnings) !== nextReferralEarnings) {
      await User.findByIdAndUpdate(user._id, { referralEarnings: nextReferralEarnings });
    }
  }

  console.log(`Removed ${legacyTransactions.length} legacy referral transactions.`);
  console.log(`Updated ${removedByUser.size} user balances/referral totals.`);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors on shutdown
  }
  process.exit(1);
});
