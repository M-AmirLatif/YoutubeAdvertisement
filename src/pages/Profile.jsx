import { useState } from 'react';
import { CalendarDays, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const noAutofill = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'none',
  spellCheck: 'false',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-form-type': 'other'
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    try {
      const { user: updated } = await api('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ password: form.password })
      });
      setUser(updated);
      setMessage('Password updated.');
      setForm({ password: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="profile-layout">
      <h1 className="page-title">Account Settings</h1>
      <aside className="profile-card">
        <div className="profile-hero">
          <div className="profile-avatar"><UserRound size={72} fill="currentColor" /></div>
          <h2>{user?.username || 'Member'}</h2>
          <span>{user?.activePlan?.name || 'Free'} Plan</span>
        </div>
        <div className="profile-details">
          <div><Mail size={23} /><span>Email</span><strong>{user?.email || '-'}</strong></div>
          <div><Phone size={23} /><span>Phone</span><strong>{user?.phone || '-'}</strong></div>
          <div><CalendarDays size={23} /><span>Joined</span><strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</strong></div>
          <div><ShieldCheck size={23} /><span>Status</span><strong className="active-pill">Active</strong></div>
        </div>
      </aside>

      <section className="settings-stack">
        <form className="settings-card" onSubmit={submit} autoComplete="off" data-form-type="other">
          <h2><ShieldCheck size={28} fill="currentColor" />Change Password</h2>
          {message && <div className="success">{message}</div>}
          {error && <div className="alert">{error}</div>}
          <label>New Password
            <input {...noAutofill} name="manual_profile_passcode" type="password" minLength="6" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>
          <label>Confirm New Password
            <input {...noAutofill} name="manual_profile_passcode_confirm" type="password" minLength="6" required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
          </label>
          <button className="primary">Update Password</button>
        </form>
      </section>
    </div>
  );
}
