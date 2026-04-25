import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { REFERRAL_LEVEL_1_BONUS, REFERRAL_LEVEL_2_BONUS } from '../config/business.js';
import { makeReferralCode } from './youtube.js';

export async function generateUniqueReferralCode() {
  for (let attempts = 0; attempts < 20; attempts += 1) {
    const referralCode = makeReferralCode();
    const exists = await User.exists({ referralCode });
    if (!exists) return referralCode;
  }
  throw new Error('Failed to generate a unique referral code.');
}

export async function applyReferralPlanReward({ referredUserId, planName, planPrice, transactionId }) {
  if (!referredUserId || Number(planPrice) <= 0) return false;

  const referredUser = await User.findOneAndUpdate(
    {
      _id: referredUserId,
      referredBy: { $ne: null },
      referralPlanRewardPaid: { $ne: true }
    },
    {
      $set: {
        referralPlanRewardPaid: true,
        referralPlanRewardPaidAt: new Date(),
        referralPlanRewardTransaction: transactionId || null
      }
    },
    {
      new: true,
      select: 'username referredBy referralPlanRewardPaid'
    }
  );

  if (!referredUser?.referredBy) return false;

  const referrer = await User.findById(referredUser.referredBy).select('username referredBy isSuspended');
  if (!referrer || referrer.isSuspended) return true;

  if (REFERRAL_LEVEL_1_BONUS > 0) {
    await User.findByIdAndUpdate(referrer._id, {
      $inc: { balance: REFERRAL_LEVEL_1_BONUS, referralEarnings: REFERRAL_LEVEL_1_BONUS }
    });
    await Transaction.create({
      user: referrer._id,
      type: 'referral',
      amount: REFERRAL_LEVEL_1_BONUS,
      status: 'approved',
      notes: `Level 1 referral bonus for ${referredUser.username} purchasing ${planName}`
    });
  }

  if (referrer.referredBy && REFERRAL_LEVEL_2_BONUS > 0) {
    const levelTwoReferrer = await User.findById(referrer.referredBy).select('username isSuspended');
    if (levelTwoReferrer && !levelTwoReferrer.isSuspended) {
      await User.findByIdAndUpdate(levelTwoReferrer._id, {
        $inc: { balance: REFERRAL_LEVEL_2_BONUS, referralEarnings: REFERRAL_LEVEL_2_BONUS }
      });
      await Transaction.create({
        user: levelTwoReferrer._id,
        type: 'referral',
        amount: REFERRAL_LEVEL_2_BONUS,
        status: 'approved',
        notes: `Level 2 referral bonus from ${referredUser.username} through ${referrer.username} purchasing ${planName}`
      });
    }
  }

  return true;
}
