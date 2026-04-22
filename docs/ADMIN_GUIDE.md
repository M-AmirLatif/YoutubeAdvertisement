# Admin Guide

This guide is for the operator who manages the platform after deployment.

## Login

Open the website and sign in with the owner admin account.

Default local test account:

- Email: `admin@example.com`
- Password: `admin123`

Change this before handoff:

```bash
npm run create-admin -- owner@clientdomain.com strong-password-here Owner
```

## Add Video Tasks

1. Open `Video Links`.
2. Enter a task title.
3. Paste a normal YouTube URL.
4. Set reward amount.
5. Set duration seconds.
6. Click `Add video`.

Admins can edit, pause, reactivate, or delete tasks. Normal users cannot upload or edit tasks.

## Manage Users

Open `Users` to review balances, referral earnings, roles, and suspension status.

- Use `Suspend` to block a suspicious user.
- Use role dropdowns only for trusted staff.
- The owner admin account is protected from changes by other admins.

## Deposits

Users choose a plan and submit a transaction hash or proof reference.

Admin workflow:

1. Open `Requests`.
2. Filter by `deposit` or `pending`.
3. Verify the proof/hash manually.
4. Add an admin note if needed.
5. Click `Approve` to credit the balance and activate the plan.
6. Click `Reject` if payment cannot be verified.

## Withdrawals

Users submit amount, network, and wallet address.

Admin workflow:

1. Open `Requests`.
2. Filter by `withdrawal` or `pending`.
3. Pay the user manually outside the app.
4. Add a note with the transaction reference.
5. Click `Paid`.
6. Click `Reject` to refund the held balance back to the user.

## Password Recovery

Admins can reset a user password from the server terminal:

```bash
npm run reset-password -- user@example.com new-password
```

Local development also exposes reset tokens from the login screen. In production, connect email sending before using self-service resets.

## Audit Logs

Open `Audit Logs` to see recent admin actions:

- Video create/update/deactivate
- User role/suspension updates
- Transaction approval/rejection/payment decisions

## Risk Signals

The admin dashboard includes a basic repeated-IP signal. If multiple users complete tasks from the same IP address, review those users before approving withdrawals.

The user list also shows completed task counts and pending withdrawal totals to help admins review account activity quickly.

## Business Settings

Business values are configured in `.env`:

- `MIN_WITHDRAWAL_AMOUNT`
- `REFERRAL_BONUS`
- `MIN_WATCH_SECONDS`
- `DEPOSIT_WALLET_ADDRESS`
- `DEPOSIT_WALLET_TRC20`
- `DEPOSIT_WALLET_BEP20`
- `DEPOSIT_WALLET_ERC20`
- `VITE_APP_NAME`
- `VITE_APP_SHORT_NAME`
- `VITE_APP_TAGLINE`
- `VITE_APP_AUTH_TAGLINE`
- `VITE_APP_HERO_TITLE`
- `VITE_APP_HERO_COPY`

Restart the server after changing `.env`.
