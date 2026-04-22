# QA Checklist

Run this checklist before handing the platform to a client.

## Setup

- MongoDB is running or `MONGO_URI` points to Atlas.
- `.env` has a strong `JWT_SECRET`.
- Default admin password has been changed.
- `npm run build` passes.
- `npm start` runs the app on the expected port.

## User Flow

- New user can sign up.
- Invalid referral code is rejected.
- User can log in.
- User dashboard loads.
- User can watch an active task.
- Reward is credited only after enough watch time.
- Same video cannot pay reward twice.
- Daily task limit is enforced.
- Suspended user cannot log in or use APIs.

## Admin Flow

- Admin can log in.
- Normal user cannot see admin links.
- Normal user cannot call admin APIs.
- Admin can add a video task.
- Admin can edit a video task.
- Admin can pause/reactivate a task.
- Admin can suspend/unsuspend a user.
- Admin cannot alter protected owner account unless logged in as owner.
- Admin dashboard shows risk signals when more than one user completes tasks from the same IP.
- Admin user list shows completed tasks and pending withdrawal totals.
- Admin task history shows user/video watch percent, watched seconds, completed status, reward status, IP, and user-agent.
- Normal user cannot access admin task history.

## Deposit Flow

- User cannot submit deposit without proof/hash.
- User can submit deposit with proof/hash.
- Admin can approve deposit.
- Approved deposit credits balance and activates selected plan.
- Admin can reject deposit.
- Audit log records the decision.

## Withdrawal Flow

- User cannot withdraw below minimum.
- User cannot withdraw more than balance.
- Valid withdrawal places funds on hold.
- Admin can mark withdrawal paid.
- Admin can reject withdrawal and refund held balance.
- Audit log records the decision.

## Recovery

- Login password reset request returns a token in development.
- Reset token changes the password.
- `npm run reset-password -- email password` works for admin recovery.

## Responsive UI

- Login/signup work on mobile.
- Dashboard cards stack properly on mobile.
- Task video cards fit mobile width.
- Admin tables remain readable on mobile.

## Deployment Readiness

- Production `MONGO_URI` configured.
- Production `CLIENT_URL` configured.
- Production domain uses HTTPS.
- Hosting env vars match `.env.example`.
- Client has the admin guide.
