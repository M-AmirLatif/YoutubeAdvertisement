import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import { api } from '../api.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api('/admin/dashboard').then((data) => setStats(data.stats));
  }, []);

  return (
    <div className="page-stack">
      <section className="panel page-heading">
        <h2>Admin panel</h2>
        <p>Manage user accounts, YouTube task links, deposits, withdrawals, and platform totals.</p>
      </section>
      <section className="stats-grid">
        <StatCard label="Users" value={stats?.users ?? 0} hint={`${stats?.admins ?? 0} admins`} />
        <StatCard label="Active videos" value={stats?.activeVideos ?? 0} hint="Visible to task users" tone="blue" />
        <StatCard label="Completed tasks" value={stats?.completedTasks ?? 0} hint="All-time watched videos" tone="purple" />
        <StatCard label="Pending requests" value={(stats?.pendingDeposits ?? 0) + (stats?.pendingWithdrawals ?? 0)} hint="Deposits and withdrawals" tone="orange" />
      </section>
      <section className="panel">
        <div className="section-title"><span>Risk signals</span></div>
        <div className="table-list">
          {(stats?.repeatedIps || []).map((item) => (
            <div className="table-row" key={item.ipAddress}>
              <span>{item.ipAddress}</span>
              <strong>{item.userCount} users</strong>
              <em>{item.completions} completions</em>
            </div>
          ))}
          {!stats?.repeatedIps?.length && <p className="muted">No repeated completion IPs detected yet.</p>}
        </div>
      </section>
    </div>
  );
}
