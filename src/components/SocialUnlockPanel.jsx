import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function SocialUnlockPanel({ title, message, links = [], onUnlocked }) {
  const { setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function confirmSocialFollow() {
    setSaving(true);
    setError('');
    try {
      const response = await api('/users/social-follow', { method: 'POST', body: JSON.stringify({ confirmed: true }) });
      setUser(response.user);
      onUnlocked?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel social-panel">
      <div className="section-title">
        <span>{title}</span>
      </div>
      <div className="social-follow-gate">
        <p>{message}</p>
        {error && <div className="alert">{error}</div>}
        <Link className="primary social-follow-link-button" to="/social-links">
          Follow Social Accounts
        </Link>
        <button className="primary social-follow-confirm-button" type="button" onClick={confirmSocialFollow} disabled={saving}>
          {saving ? 'Saving...' : 'I Followed All Accounts'}
        </button>
      </div>
    </section>
  );
}
