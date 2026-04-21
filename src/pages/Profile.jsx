import { useState } from 'react';
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
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '', password: '' });
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    const { user: updated } = await api('/users/profile', { method: 'PUT', body: JSON.stringify(form) });
    setUser(updated);
    setMessage('Profile updated.');
    setForm((current) => ({ ...current, password: '' }));
  }

  return (
    <section className="panel profile-panel">
      <div className="section-title"><span>Profile management</span></div>
      {message && <div className="success">{message}</div>}
      <form className="form" onSubmit={submit} autoComplete="off" data-form-type="other">
        <label>Username<input {...noAutofill} name="manual_profile_name" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
        <label>Email<input {...noAutofill} name="manual_profile_email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>New password<input {...noAutofill} name="manual_profile_passcode" type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current password" /></label>
        <button className="primary">Save changes</button>
      </form>
    </section>
  );
}
