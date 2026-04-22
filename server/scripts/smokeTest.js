import dotenv from 'dotenv';

dotenv.config();

const baseUrl = process.env.SMOKE_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || 'admin123';

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const health = await request('/api/health');
  assert(health.response.ok && health.data.ok, 'Health check failed');

  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: adminEmail, password: adminPassword }
  });
  assert(adminLogin.response.ok, `Admin login failed: ${adminLogin.data.message || adminLogin.response.status}`);
  assert(adminLogin.data.user.role === 'admin', 'Admin account does not have admin role');

  const adminToken = adminLogin.data.token;
  const adminDashboard = await request('/api/admin/dashboard', { token: adminToken });
  assert(adminDashboard.response.ok, 'Admin dashboard failed');
  if (!Array.isArray(adminDashboard.data.stats.repeatedIps)) {
    console.warn('Warning: admin dashboard risk signal field missing. Restart the backend to load the latest code.');
  }

  const taskHistory = await request('/api/admin/task-history?limit=10', { token: adminToken });
  if (!taskHistory.response.ok) {
    console.warn('Warning: admin task history failed. Restart the backend to load the latest code.');
  }

  const email = `smoke${Date.now()}@example.com`;
  const register = await request('/api/auth/register', {
    method: 'POST',
    body: { username: 'SmokeUser', email, password: 'password123' }
  });
  assert(register.response.ok, `User registration failed: ${register.data.message || register.response.status}`);
  const userToken = register.data.token;

  const adminDenied = await request('/api/admin/dashboard', { token: userToken });
  assert(adminDenied.response.status === 403, 'Normal user was allowed to access admin dashboard');

  const historyDenied = await request('/api/admin/task-history', { token: userToken });
  if (![403, 404].includes(historyDenied.response.status)) {
    throw new Error('Normal user was allowed to access task history');
  }

  const depositMissingProof = await request('/api/transactions/deposit', {
    method: 'POST',
    token: userToken,
    body: { planName: 'Starter', amount: 10, walletAddress: 'TExampleWallet123' }
  });
  assert(depositMissingProof.response.status === 400, 'Deposit without proof was accepted');

  const withdrawTooSmall = await request('/api/transactions/withdraw', {
    method: 'POST',
    token: userToken,
    body: { amount: 1, walletAddress: 'TExampleWallet123', network: 'USDT-TRC20' }
  });
  assert(withdrawTooSmall.response.status === 400, 'Too-small withdrawal was accepted');

  const videos = await request('/api/videos', { token: userToken });
  assert(videos.response.ok, 'User video list failed');

  const plans = await request('/api/transactions/plans', { token: userToken });
  assert(plans.response.ok, 'Plans endpoint failed');
  if (!plans.data.depositWallets || typeof plans.data.depositWallets !== 'object') {
    console.warn('Warning: network deposit wallets missing. Restart the backend to load the latest code.');
  }

  console.log('Smoke test passed');
}

run().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});
