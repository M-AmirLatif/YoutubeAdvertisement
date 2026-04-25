import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function calculateDailyPlanAmount(plan) {
  const price = Number(plan?.price || 0);
  if (price <= 0) return 0;
  return Number((price * 0.01).toFixed(4));
}

export async function applyDailyPlanEarningIfDue(userOrId) {
  const currentUser = typeof userOrId === 'object' && userOrId?._id
    ? userOrId
    : await User.findById(userOrId);

  if (!currentUser) return null;

  const dailyAmount = calculateDailyPlanAmount(currentUser.activePlan);
  if (dailyAmount <= 0) return currentUser;

  const todayStart = startOfToday();
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: currentUser._id,
      'activePlan.price': { $gt: 0 },
      $or: [
        { lastDailyPlanEarningAt: null },
        { lastDailyPlanEarningAt: { $lt: todayStart } }
      ]
    },
    {
      $inc: { balance: dailyAmount },
      $set: { lastDailyPlanEarningAt: new Date() }
    },
    { new: true }
  );

  if (!updatedUser) {
    return User.findById(currentUser._id);
  }

  await Transaction.create({
    user: updatedUser._id,
    type: 'earning',
    amount: dailyAmount,
    earningSource: 'daily_plan',
    status: 'approved',
    plan: updatedUser.activePlan?.name || '',
    notes: `Daily 1% plan earning for ${updatedUser.activePlan?.name || 'active plan'}`
  });

  return updatedUser;
}
