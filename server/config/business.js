export const MIN_WITHDRAWAL_AMOUNT = Number(process.env.MIN_WITHDRAWAL_AMOUNT || 5);
export const REFERRAL_LEVEL_1_BONUS = Number(process.env.REFERRAL_LEVEL_1_BONUS || process.env.REFERRAL_BONUS || 1);
export const REFERRAL_LEVEL_2_BONUS = Number(process.env.REFERRAL_LEVEL_2_BONUS || 0.5);
export const REFERRAL_BONUS = REFERRAL_LEVEL_1_BONUS;
export const REFERRAL_LEVEL_1_RATE = Number(process.env.REFERRAL_LEVEL_1_RATE || 0.15);
export const REFERRAL_LEVEL_2_RATE = Number(process.env.REFERRAL_LEVEL_2_RATE || 0.05);
export const TASK_COMPLETION_PERCENT = 95;
export const MIN_WATCH_SECONDS = Number(process.env.MIN_WATCH_SECONDS || 20);

export const plans = [
  { name: 'Free', price: 0, dailyLimit: 10, rewardPerVideo: 0.1 },
  { name: 'Starter', price: 20, dailyLimit: 20, rewardPerVideo: 0.2 },
  { name: 'Basic', price: 50, dailyLimit: 50, rewardPerVideo: 0.5 },
  { name: 'Standard', price: 100, dailyLimit: 100, rewardPerVideo: 1 },
  { name: 'Gold', price: 150, dailyLimit: 150, rewardPerVideo: 1.5 },
  { name: 'Advanced', price: 200, dailyLimit: 200, rewardPerVideo: 2 },
  { name: 'Premium', price: 350, dailyLimit: 350, rewardPerVideo: 3.5 },
  { name: 'Enterprise', price: 500, dailyLimit: 500, rewardPerVideo: 5 },
  { name: 'Global', price: 750, dailyLimit: 750, rewardPerVideo: 7.5 },
  { name: 'Platinum', price: 1000, dailyLimit: 1000, rewardPerVideo: 10 },
  { name: 'Ultimate', price: 1500, dailyLimit: 1500, rewardPerVideo: 15 },
  { name: 'Infinity', price: 2000, dailyLimit: 2000, rewardPerVideo: 20 }
];
