# YouTube Advertisement Platform

Full-stack MERN application for YouTube ad task rewards, referrals, deposits, withdrawals, and video progress tracking.

## Features

- React responsive dashboard with earnings cards, daily progress, referral link, tasks, plans, profile, and video management.
- JWT authentication with registration, login, protected routes, and password updates.
- MongoDB models for users, videos, progress, and transactions.
- YouTube Iframe API tracking that records watch progress and pays rewards once a video is completed.
- USDT-style deposit and withdrawal request flow with selectable plans.
- Referral codes and referral signup bonuses.
- Admin-only panel for platform stats, users, video task links, deposits, withdrawals, and request approval.
- Backend daily task limits, minimum watch time, minimum withdrawals, deposit proof fields, user suspension, owner protection, and admin audit logs.
- Configurable branding via environment variables and password recovery tools.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set `MONGO_URI` plus a long `JWT_SECRET`.

3. Start MongoDB locally or use a MongoDB Atlas free cluster.

4. Seed sample YouTube tasks:

```bash
npm run seed
```

5. Create or promote an admin account:

```bash
npm run create-admin -- admin@example.com admin123 Admin
```

6. Run the full development app:

```bash
npm run dev
```

The React dev app runs on `http://localhost:5173` and the API runs on `http://localhost:5001`.

You can also use the built full app from the backend after `npm run build`:

```bash
npm start
```

Then open `http://localhost:5001`.

## Deployment

Production target:

- Backend API: Render
- Frontend app: Vercel
- Database: MongoDB Atlas

Render uses `render.yaml`. Vercel uses `vercel.json`.

Required Render variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `CLIENT_URLS`, `MIN_WITHDRAWAL_AMOUNT`, `REFERRAL_BONUS`, `MIN_WATCH_SECONDS`, `DEPOSIT_WALLET_ADDRESS`, `DEPOSIT_WALLET_TRC20`, `DEPOSIT_WALLET_BEP20`.

Required Vercel variable: `VITE_API_URL`.

Optional Vercel branding variables: `VITE_APP_NAME`, `VITE_APP_SHORT_NAME`, `VITE_APP_TAGLINE`, `VITE_APP_AUTH_TAGLINE`, `VITE_APP_HERO_TITLE`, `VITE_APP_HERO_COPY`.

Detailed deployment guide: `docs/DEPLOYMENT.md`

## Admin Login

After running the admin command above, log in with:

- Email: `admin@example.com`
- Password: `admin123`

Admin pages appear in the sidebar only for admin users.

Before handing the project to a client, change the default admin password:

```bash
npm run create-admin -- owner@clientdomain.com strong-password-here Owner
```

That command creates or promotes the account as the protected owner admin.

## Operator Docs

- Admin guide: `docs/ADMIN_GUIDE.md`
- QA checklist: `docs/QA_CHECKLIST.md`

Admin password reset from terminal:

```bash
npm run reset-password -- user@example.com new-password
```

When the server is running, run a focused API smoke test:

```bash
npm run smoke-test
```
