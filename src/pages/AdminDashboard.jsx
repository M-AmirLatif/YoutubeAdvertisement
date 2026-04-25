import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import { api } from '../api.js';
import SocialAccountsSection from '../components/SocialAccountsSection.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [socialLinks, setSocialLinks] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api('/admin/dashboard'),
      api('/admin/social-settings')
    ]).then(([dashboardData, socialData]) => {
      setStats(dashboardData.stats);
      setSocialLinks(socialData.socialLinks || []);
    }).catch((err) => setError(err.message));
  }, []);

  function updateLink(index, field, value) {
    setSocialLinks((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  }

  async function saveSocialLinks() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await api('/admin/social-settings', {
        method: 'PUT',
        body: JSON.stringify({ socialLinks })
      });
      setSocialLinks(response.socialLinks || []);
      setMessage('Social links updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

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
      {error && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}
      <SocialAccountsSection
        title="Manage Social Accounts"
        editable
        values={socialLinks}
        onChange={updateLink}
        onSave={saveSocialLinks}
        saving={saving}
      />

    </div>
  );
}
