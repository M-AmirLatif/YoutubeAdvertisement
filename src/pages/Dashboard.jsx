import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Copy, LineChart, ReceiptText, RefreshCcw, Share2, Wallet } from 'lucide-react';
import { api } from '../api.js';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const referralLink = useMemo(() => `${window.location.origin}/signup?ref=${user?.referralCode || ''}`, [user]);

  useEffect(() => {
    api('/users/dashboard').then((response) => {
      setData(response);
      setUser(response.user);
    }).catch((err) => setError(err.message));
  }, []);

  const stats = data?.stats || { completedToday: 0, totalCompleted: 0, dailyLimit: user?.activePlan?.dailyLimit || 5, progressPercent: 0 };
  const planFeesPaid = (data?.transactions || [])
    .filter((tx) => tx.type === 'deposit' && ['approved', 'paid'].includes(tx.status))
    .reduce((total, tx) => total + Number(tx.amount || 0), 0);

  return (
    <div className="page-stack dashboard-page">
      {error && <div className="alert">{error}</div>}
      <section className="dashboard-stats-grid">
        <StatCard label="Withdrawable Balance" value={`$${(user?.balance || 0).toFixed(4)}`} icon={Wallet} />
        <StatCard label="Today's Earning" value={`$${(user?.todayEarnings || 0).toFixed(4)}`} tone="green" icon={LineChart} />
        <StatCard label="Daily Tasks" value={`${stats.completedToday || 0} / ${stats.dailyLimit || 0}`} tone="cyan" icon={CheckSquare} />
      </section>

      <section className="history-section">
        <h2>History Overview</h2>
        <div className="history-cards">
          <StatCard label="Total Plan Fees Paid" value={`$${planFeesPaid.toFixed(2)}`} tone="gray" icon={ReceiptText} />
          <StatCard label="Total Withdrawn" value={`$${(user?.totalWithdrawn || 0).toFixed(2)}`} tone="red" icon={RefreshCcw} />
        </div>
      </section>

      <section className="invite-panel" id="invite">
        <h2><Share2 size={30} fill="currentColor" />Invite & Earn</h2>
        <p>Share your link with friends. Earn 15% from their earnings instantly.</p>
        <div className="referral-summary">
          <span>Referral Earnings: <strong>${(user?.referralEarnings || 0).toFixed(4)}</strong></span>
          <span>Team: <strong>{stats.directReferrals || 0}</strong> direct / <strong>{stats.levelTwoReferrals || 0}</strong> level 2</span>
        </div>
        <label>Your Referral Link</label>
        <div className="referral-copy-row">
          <div>{referralLink}</div>
          <button onClick={() => navigator.clipboard.writeText(referralLink)}><Copy size={18} />Copy Link</button>
        </div>
      </section>

    </div>
  );
}
