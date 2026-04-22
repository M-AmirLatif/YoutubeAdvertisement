# Deployment Guide: Render + Vercel + MongoDB Atlas

Use this setup:

- MongoDB Atlas: production database
- Render: Node/Express API backend
- Vercel: React/Vite frontend

The frontend and backend are deployed as two separate services from the same GitHub repository.

## 1. MongoDB Atlas

1. Create a free MongoDB Atlas cluster.
2. Create a database user and password.
3. In `Network Access`, add this IP entry:

```text
0.0.0.0/0
```

Comment:

```text
Render and Vercel deployment access
```

4. Copy the Node.js connection string.
5. Use a database name like `youtube-advertisement`.

Example:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/youtube-advertisement?retryWrites=true&w=majority
```

## 2. Render Backend

1. Open Render.
2. Click `New`.
3. Choose `Blueprint` if available, or choose `Web Service`.
4. Connect GitHub repo:

```text
M-AmirLatif/YoutubeAdvertisement
```

If using Blueprint, Render reads `render.yaml`.

If creating Web Service manually:

```text
Root Directory: .
Runtime: Node
Build Command: npm install
Start Command: npm start
Health Check Path: /api/health
```

Set these Render environment variables:

```text
NODE_ENV=production
MONGO_URI=your MongoDB Atlas URI
JWT_SECRET=make-a-long-random-secret
CLIENT_URL=https://your-vercel-app.vercel.app
CLIENT_URLS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
MIN_WITHDRAWAL_AMOUNT=5
REFERRAL_BONUS=1
MIN_WATCH_SECONDS=20
DEPOSIT_WALLET_ADDRESS=your USDT wallet
DEPOSIT_WALLET_TRC20=your TRC20 USDT wallet
DEPOSIT_WALLET_BEP20=your BEP20 USDT wallet
DEPOSIT_WALLET_ERC20=
```

Do not set `VITE_API_URL` on Render. That belongs on Vercel.

After Render deploys, copy the public backend URL. It will look similar to:

```text
https://youtube-advertisement-api.onrender.com
```

Test:

```text
https://youtube-advertisement-api.onrender.com/api/health
```

## 3. Vercel Frontend

1. Open Vercel.
2. Import GitHub repo:

```text
M-AmirLatif/YoutubeAdvertisement
```

3. Framework preset: `Vite`.
4. Build command: `npm run build`.
5. Output directory: `dist`.

Set these Vercel environment variables:

```text
VITE_API_URL=https://your-render-backend.onrender.com/api
VITE_APP_NAME=AdWatch
VITE_APP_SHORT_NAME=YT
VITE_APP_TAGLINE=USDT rewards
VITE_APP_AUTH_TAGLINE=Earn by watching campaigns
VITE_APP_HERO_TITLE=YouTube advertisement task platform
VITE_APP_HERO_COPY=Manage video tasks, referral earnings, deposits, withdrawals, and daily progress from one responsive dashboard.
```

Deploy Vercel, then copy the Vercel app URL.

## 4. Update Render CORS

After Vercel deploys, go back to Render and update:

```text
CLIENT_URL=https://your-vercel-app.vercel.app
CLIENT_URLS=https://your-vercel-app.vercel.app
```

If you use a custom domain later:

```text
CLIENT_URLS=https://your-vercel-app.vercel.app,https://yourdomain.com
```

Redeploy Render after changing variables.

## 5. First Production Setup

Open Render Shell and run:

```bash
npm run create-admin -- owner@clientdomain.com strong-password-here Owner
npm run seed
```

Use the owner account to log into the Vercel frontend.

## 6. Production Smoke Test

PowerShell:

```powershell
$env:SMOKE_BASE_URL="https://your-render-backend.onrender.com"
$env:SMOKE_ADMIN_EMAIL="owner@clientdomain.com"
$env:SMOKE_ADMIN_PASSWORD="strong-password-here"
npm run smoke-test
```

## 7. Client Acceptance Test

Before handoff:

1. Open the Vercel frontend URL.
2. Log in as owner admin.
3. Add one YouTube video task.
4. Create a normal user.
5. Confirm normal user cannot see admin menu.
6. Watch a task and confirm reward is credited once.
7. Submit a deposit with proof.
8. Approve the deposit as admin.
9. Submit a withdrawal as user.
10. Mark withdrawal paid as admin.
11. Confirm audit logs show admin actions.
