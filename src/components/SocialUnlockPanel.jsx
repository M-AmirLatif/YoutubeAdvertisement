import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import SocialAccountsSection from './SocialAccountsSection.jsx';

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
    <SocialAccountsSection title={title} links={links}>
      <div className="social-follow-gate">
        <p>{message}</p>
        {error && <div className="alert">{error}</div>}
        <button className="primary" type="button" onClick={confirmSocialFollow} disabled={saving}>
          {saving ? 'Saving...' : 'I Followed All Accounts'}
        </button>
      </div>
    </SocialAccountsSection>
  );
}
