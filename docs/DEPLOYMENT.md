# Deployment Guide

This project is easiest to deploy as one full-stack service on Render. Express serves the built React app from `dist`, so no separate frontend deployment is required.

## 1. Prepare MongoDB Atlas

1. Create a free MongoDB Atlas cluster.
2. Create a database user and password.
3. Allow network access from anywhere for Render: `0.0.0.0/0`.
4. Copy the connection string.
5. Use a database name such as `youtube-advertisement`.

Example:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/youtube-advertisement?retryWrites=true&w=majority
```

## 2. Push Code To GitHub

Render deploys from a Git repository.

```bash
git init
git add -A
git commit -m "Initial production-ready app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 3. Deploy On Render

1. Open Render.
2. Click `New`.
3. Choose `Blueprint` if using `render.yaml`, or choose `Web Service`.
4. Connect the GitHub repository.
5. Use these commands if creating a Web Service manually:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Health check path:

```text
/api/health
```

## 4. Production Environment Variables

Set these in Render:

```text
NODE_ENV=production
MONGO_URI=your MongoDB Atlas URI
JWT_SECRET=a long random secret
CLIENT_URL=https://your-render-service.onrender.com
MIN_WITHDRAWAL_AMOUNT=5
REFERRAL_BONUS=1
MIN_WATCH_SECONDS=20
DEPOSIT_WALLET_ADDRESS=your USDT wallet
VITE_APP_NAME=client app name
VITE_APP_SHORT_NAME=short logo text
VITE_APP_TAGLINE=USDT rewards
VITE_APP_AUTH_TAGLINE=Earn by watching campaigns
VITE_APP_HERO_TITLE=YouTube advertisement task platform
VITE_APP_HERO_COPY=Manage video tasks, referral earnings, deposits, withdrawals, and daily progress from one responsive dashboard.
```

Render provides `PORT` automatically. Do not hardcode it in Render.

## 5. First Production Setup

After the first deploy, open Render Shell and run:

```bash
npm run create-admin -- owner@clientdomain.com strong-password-here Owner
npm run seed
```

Use the owner account to log in and add real video tasks.

## 6. Client Acceptance Test

Run these checks before sending the URL to the client:

1. Open `/api/health`.
2. Log in as owner admin.
3. Add one YouTube video task.
4. Create a normal user.
5. Confirm normal user cannot see admin menu.
6. Watch the task and confirm reward is credited once.
7. Submit a deposit with proof.
8. Approve the deposit as admin.
9. Submit a withdrawal as user.
10. Mark withdrawal paid as admin.
11. Confirm audit logs show admin actions.

## 7. Client Handoff

Give the client:

- Website URL
- Owner admin email
- Owner admin password
- `docs/ADMIN_GUIDE.md`
- `docs/QA_CHECKLIST.md`

Do not share MongoDB password, JWT secret, or hosting account password unless the client owns those accounts.
