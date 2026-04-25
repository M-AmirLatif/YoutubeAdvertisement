import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Instagram, MessageCircle, Send, Share2 } from 'lucide-react';
import { api } from '../api.js';
import SocialAccountsSection from '../components/SocialAccountsSection.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { copyText } from '../utils/clipboard.js';

const iconMap = {
  'whatsapp-group': MessageCircle,
  'whatsapp-channel': MessageCircle,
  instagram: Instagram,
  x: ExternalLink,
  telegram: Send
};

export default function SocialLinks() {
  const { user } = useAuth();
  const [socialLinks, setSocialLinks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/users/social-settings')
      .then((response) => setSocialLinks(response.socialLinks || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
    <div className="page-stack social-links-page">
      <section className="panel social-links-route-panel">
        <div className="social-links-route-header">
          <h1><Share2 size={28} />Social Links</h1>
          <p>Open each account directly to follow or subscribe, or copy the link and use it anywhere.</p>
        </div>
        {error && <div className="alert">{error}</div>}
        {message && <div className="success">{message}</div>}
        {loading ? (
          <div className="empty-state">Loading social links...</div>
        ) : (
          <div className="social-route-grid">
            {socialLinks.map((item) => {
              const Icon = iconMap[item.platform] || ExternalLink;
              return (
                <article className="social-route-card" key={`${item.platform}-${item.url}`}>
                  <div className="social-route-card-top">
                    <div className="social-route-icon">
                      <Icon size={22} />
                    </div>
                    <div className="social-route-copy">
                      <strong>{item.name}</strong>
                      <span>{item.url}</span>
                    </div>
                  </div>
                  <div className="social-route-actions">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="primary social-open-link">
                      <ExternalLink size={16} />
                      Open Link
                    </a>
                    <button type="button" className="secondary social-copy-button" onClick={() => copyText(item.url, `${item.name} link copied`)}>
                      <Copy size={16} />
                      Copy Link
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      {user?.role === 'admin' && (
        <SocialAccountsSection
          title="Manage Social Accounts"
          editable
          values={socialLinks}
          onChange={updateLink}
          onSave={saveSocialLinks}
          saving={saving}
        />
      )}
    </div>
  );
}
