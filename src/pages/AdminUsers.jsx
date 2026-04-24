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
    if (updates.isSuspended !== undefined) {
      const action = updates.isSuspended ? 'suspend' : 'unsuspend';
      if (!window.confirm(`Are you sure you want to ${action} user "${user.username}"?`)) return;
    }
    await api(`/admin/users/${user._id}`, { method: 'PUT', body: JSON.stringify(updates) });
    load();
  }

  async function forcePasswordReset(user) {
    const newPass = window.prompt(`Enter a new password for ${user.username} (minimum 6 characters):`);
    if (!newPass) return;
    if (newPass.length < 6) return alert('Password must be at least 6 characters.');
    
    if (!window.confirm(`Are you absolutely sure you want to change the password for ${user.username} to: ${newPass}`)) return;
    
    try {
      await api(`/admin/users/${user._id}`, { method: 'PUT', body: JSON.stringify({ password: newPass }) });
      alert(`Success! The new password for ${user.username} is: ${newPass}`);
      load();
    } catch (err) {
      alert(err.message);
    }
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
          {users.filter(user => user.role !== 'admin' && !user.isAdmin && !user.isOwner).map((user) => (
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
                <button className="secondary" disabled={user.isOwner} onClick={() => forcePasswordReset(user)}>
                  Reset Password
                </button>
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
