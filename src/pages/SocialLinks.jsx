import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Instagram, MessageCircle, Send, Share2 } from 'lucide-react';
import { api } from '../api.js';
import { copyText } from '../utils/clipboard.js';

const iconMap = {
  'whatsapp-group': MessageCircle,
  'whatsapp-channel': MessageCircle,
  instagram: Instagram,
  x: ExternalLink,
  telegram: Send
};

export default function SocialLinks() {
  const [socialLinks, setSocialLinks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/users/social-settings')
      .then((response) => setSocialLinks(response.socialLinks || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-stack social-links-page">
      <section className="panel social-links-route-panel">
        <div className="social-links-route-header">
          <h1><Share2 size={28} />Social Links</h1>
          <p>Open each account directly to follow or subscribe, or copy the link and use it anywhere.</p>
        </div>
        {error && <div className="alert">{error}</div>}
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
    </div>
  );
}
