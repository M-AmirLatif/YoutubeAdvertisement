import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    const data = await api('/admin/users');
    setUsers(data.users);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function updateUser(user, updates) {
    await api(`/admin/users/${user._id}`, { method: 'PUT', body: JSON.stringify(updates) });
    load();
  }

  return (
    <div className="page-stack">
      <section className="panel page-heading">
        <h2>User management</h2>
        <p>Review users, roles, balances, and referral earnings.</p>
      </section>
      {error && <div className="alert">{error}</div>}
      <section className="panel">
        <div className="admin-list">
          {users.map((user) => (
            <article className="admin-row" key={user._id}>
              <div>
                <strong>{user.username}</strong>
                <span>{user.email}</span>
              </div>
              <div>
                <strong>${user.balance.toFixed(2)}</strong>
                <span>Balance</span>
              </div>
              <div>
                <strong>${user.referralEarnings.toFixed(2)}</strong>
                <span>Referral</span>
              </div>
              <div>
                <strong>{user.completedTasks || 0}</strong>
                <span>Tasks done</span>
              </div>
              <div>
                <strong>${(user.pendingWithdrawalAmount || 0).toFixed(2)}</strong>
                <span>Pending withdrawal</span>
              </div>
              <div className="row-actions">
                <select value={user.role} onChange={(e) => updateUser(user, { role: e.target.value })} disabled={user.isOwner}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button className={user.isSuspended ? 'secondary' : 'danger'} disabled={user.isOwner} onClick={() => updateUser(user, { isSuspended: !user.isSuspended })}>
                  {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
