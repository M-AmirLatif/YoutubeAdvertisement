import { useEffect, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { api } from '../api.js';
import StatCard from '../components/StatCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [data, setData] = useState(null);
  const referralLink = useMemo(() => `${window.location.origin}/signup?ref=${user?.referralCode || ''}`, [user]);

  useEffect(() => {
    api('/users/dashboard').then((response) => {
      setData(response);
      setUser(response.user);
    });
  }, []);

  const stats = data?.stats || { completedToday: 0, totalCompleted: 0, dailyLimit: user?.activePlan?.dailyLimit || 5, progressPercent: 0 };

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <StatCard label="User balance" value={`$${(user?.balance || 0).toFixed(2)}`} hint="Available for withdrawal" />
        <StatCard label="Today earnings" value={`$${(user?.todayEarnings || 0).toFixed(2)}`} hint="Updated after completed videos" tone="blue" />
        <StatCard label="Total withdrawn" value={`$${(user?.totalWithdrawn || 0).toFixed(2)}`} hint="Lifetime paid requests" tone="orange" />
        <StatCard label="Referral earnings" value={`$${(user?.referralEarnings || 0).toFixed(2)}`} hint="Invite commission" tone="purple" />
      </section>

      <section className="dashboard-grid">
        <article className="panel progress-panel">
          <div className="section-title">
            <span>Daily task progress</span>
            <strong>{stats.completedToday}/{stats.dailyLimit}</strong>
          </div>
          <div className="progress-ring" style={{ '--value': `${stats.progressPercent}%` }}>
            <strong>{stats.progressPercent}%</strong>
            <span>complete</span>
          </div>
          <div className="progress-track"><span style={{ width: `${stats.progressPercent}%` }} /></div>
        </article>

        <article className="panel referral-panel">
          <div className="section-title">
            <span>Referral link</span>
            <button className="icon-button" onClick={() => navigator.clipboard.writeText(referralLink)} aria-label="Copy referral link"><Copy size={18} /></button>
          </div>
          <p className="muted">Invite members and receive a signup commission when they join with your code.</p>
          <div className="copy-box">{referralLink}</div>
          <div className="code-pill">{user?.referralCode}</div>
        </article>
      </section>

      <section className="panel">
        <div className="section-title"><span>Recent activity</span></div>
        <div className="table-list">
          {(data?.transactions || []).map((tx) => (
            <div key={tx._id} className="table-row">
              <span>{tx.type}</span>
              <strong>${tx.amount.toFixed(2)}</strong>
              <em>{tx.status}</em>
            </div>
          ))}
          {!data?.transactions?.length && <p className="muted">No transactions yet.</p>}
        </div>
      </section>
    </div>
  );
}
