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

async function expectStatus(label, promise, expected) {
  const { response, data } = await promise;
  if (response.status !== expected) {
    throw new Error(`${label} expected ${expected}, got ${response.status}: ${data.message || 'no message'}`);
  }
}

const stamp = Date.now();
const regularSignup = await api('/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    username: `accessUser${stamp}`,
    phone: '03000000000',
    email: `access-user-${stamp}@test.local`,
    password: 'Test1234'
  })
});

if (!regularSignup.response.ok) {
  throw new Error(`Could not create regular user: ${regularSignup.data.message || regularSignup.response.status}`);
}

const userToken = regularSignup.data.token;
const adminLogin = await api('/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: process.env.ADMIN_EMAIL || 'afaqsb99@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'Afaqyt295@'
  })
});

if (!adminLogin.response.ok) {
  throw new Error(`Could not login admin: ${adminLogin.data.message || adminLogin.response.status}`);
}

const adminToken = adminLogin.data.token;

await expectStatus('regular user cannot open admin dashboard', api('/admin/dashboard', {}, userToken), 403);
await expectStatus('regular user cannot list all videos', api('/videos/admin/all', {}, userToken), 403);
await expectStatus('regular user cannot create video', api('/videos', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Unauthorized test',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    reward: 1,
    durationSeconds: 20
  })
}, userToken), 403);
await expectStatus('regular user cannot list all transactions', api('/transactions/admin/all', {}, userToken), 403);
await expectStatus('regular user cannot update transaction status', api('/transactions/admin/000000000000000000000000/status', {
  method: 'PUT',
  body: JSON.stringify({ status: 'approved' })
}, userToken), 403);
await expectStatus('admin can open admin dashboard', api('/admin/dashboard', {}, adminToken), 200);
await expectStatus('admin can list all transactions', api('/transactions/admin/all', {}, adminToken), 200);

console.log('Access control check passed');
