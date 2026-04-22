import dotenv from 'dotenv';

dotenv.config();

const baseUrl = process.env.SMOKE_BASE_URL || `http://localhost:${process.env.PORT || 5001}/api`;

async function api(path, options = {}, token) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function requireOk(label, promise) {
  const result = await promise;
  if (!result.response.ok) {
    throw new Error(`${label} failed: ${result.response.status} ${result.data.message || 'no message'}`);
  }
  return result.data;
}

async function requireStatus(label, promise, expected) {
  const result = await promise;
  if (result.response.status !== expected) {
    throw new Error(`${label} expected ${expected}, got ${result.response.status}: ${result.data.message || 'no message'}`);
  }
  return result.data;
}

const stamp = Date.now();
const admin = await requireOk('admin login', api('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: process.env.ADMIN_EMAIL || 'afaqsb99@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'Afaqyt295@'
  })
}));

const user = await requireOk('user register', api('/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    username: `moneyUser${stamp}`,
    phone: '03000000000',
    email: `money-user-${stamp}@test.local`,
    password: 'Test1234'
  })
}));

const proof = `money-flow-proof-${stamp}`;
const deposit = await requireOk('deposit submit', api('/transactions/deposit', {
  method: 'POST',
  body: JSON.stringify({
    planName: 'Basic',
    amount: 1,
    network: 'USDT-TRC20',
    proof
  })
}, user.token));

if (deposit.transaction.amount !== 50) {
  throw new Error(`Deposit amount tampering was not blocked. Expected 50, got ${deposit.transaction.amount}`);
}
if (deposit.transaction.status !== 'pending') {
  throw new Error(`Paid deposit should start pending, got ${deposit.transaction.status}`);
}

await requireStatus('duplicate deposit proof rejected', api('/transactions/deposit', {
  method: 'POST',
  body: JSON.stringify({
    planName: 'Basic',
    network: 'USDT-TRC20',
    proof
  })
}, user.token), 409);

await requireOk('admin approve deposit', api(`/transactions/admin/${deposit.transaction._id}/status`, {
  method: 'PUT',
  body: JSON.stringify({ status: 'approved', notes: 'money flow check' })
}, admin.token));

await requireStatus('approved deposit cannot be changed later', api(`/transactions/admin/${deposit.transaction._id}/status`, {
  method: 'PUT',
  body: JSON.stringify({ status: 'rejected' })
}, admin.token), 400);

const dashboardAfterDeposit = await requireOk('dashboard after deposit', api('/users/dashboard', {}, user.token));
if (dashboardAfterDeposit.user.activePlan.name !== 'Basic') {
  throw new Error(`Deposit approval did not activate plan. Got ${dashboardAfterDeposit.user.activePlan.name}`);
}
if (dashboardAfterDeposit.user.balance !== 0) {
  throw new Error(`Plan deposit incorrectly changed withdrawable balance. Got ${dashboardAfterDeposit.user.balance}`);
}

await requireOk('admin set test balance', api(`/admin/users/${user.user._id}`, {
  method: 'PUT',
  body: JSON.stringify({ balance: 10 })
}, admin.token));

const withdrawal = await requireOk('withdraw submit', api('/transactions/withdraw', {
  method: 'POST',
  body: JSON.stringify({
    amount: 5,
    network: 'USDT-TRC20',
    walletAddress: 'TTestWalletAddress12345'
  })
}, user.token));

await requireOk('admin mark withdrawal paid', api(`/transactions/admin/${withdrawal.transaction._id}/status`, {
  method: 'PUT',
  body: JSON.stringify({ status: 'paid', notes: 'money flow check payout' })
}, admin.token));

await requireStatus('paid withdrawal cannot be changed later', api(`/transactions/admin/${withdrawal.transaction._id}/status`, {
  method: 'PUT',
  body: JSON.stringify({ status: 'rejected' })
}, admin.token), 400);

const dashboardAfterWithdrawal = await requireOk('dashboard after withdrawal', api('/users/dashboard', {}, user.token));
if (dashboardAfterWithdrawal.user.balance !== 5) {
  throw new Error(`Withdrawal did not reserve exactly 5. Balance is ${dashboardAfterWithdrawal.user.balance}`);
}
if (dashboardAfterWithdrawal.user.totalWithdrawn !== 5) {
  throw new Error(`Withdrawal did not update totalWithdrawn exactly 5. Got ${dashboardAfterWithdrawal.user.totalWithdrawn}`);
}

const video = await requireOk('admin create reward video', api('/videos', {
  method: 'POST',
  body: JSON.stringify({
    title: `90 percent reward test ${stamp}`,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    reward: 2,
    durationSeconds: 100
  })
}, admin.token));

await requireOk('90 percent progress pays reward', api(`/progress/${video.video._id}`, {
  method: 'POST',
  body: JSON.stringify({ watchedSeconds: 90, percent: 90, completed: false })
}, user.token));

await requireOk('duplicate progress does not double pay', api(`/progress/${video.video._id}`, {
  method: 'POST',
  body: JSON.stringify({ watchedSeconds: 100, percent: 100, completed: true })
}, user.token));

const dashboardAfterReward = await requireOk('dashboard after video reward', api('/users/dashboard', {}, user.token));
if (dashboardAfterReward.user.balance !== 7) {
  throw new Error(`90 percent video reward should pay exactly once. Balance is ${dashboardAfterReward.user.balance}`);
}
if (dashboardAfterReward.user.todayEarnings < 2) {
  throw new Error(`Today earnings did not include video reward. Got ${dashboardAfterReward.user.todayEarnings}`);
}

console.log('Money flow check passed');
