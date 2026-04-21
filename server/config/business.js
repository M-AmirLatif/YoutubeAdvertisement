export const MIN_WITHDRAWAL_AMOUNT = Number(process.env.MIN_WITHDRAWAL_AMOUNT || 5);
export const REFERRAL_BONUS = Number(process.env.REFERRAL_BONUS || 1);
export const TASK_COMPLETION_PERCENT = 95;
export const MIN_WATCH_SECONDS = Number(process.env.MIN_WATCH_SECONDS || 20);

export const plans = [
  { name: 'Starter', price: 10, dailyLimit: 5, rewardPerVideo: 0.25 },
  { name: 'Growth', price: 35, dailyLimit: 15, rewardPerVideo: 0.4 },
  { name: 'Pro', price: 75, dailyLimit: 35, rewardPerVideo: 0.65 }
];
