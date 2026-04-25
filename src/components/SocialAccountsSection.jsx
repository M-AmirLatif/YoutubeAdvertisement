import { ExternalLink, Instagram, MessageCircle, Send } from 'lucide-react';

const iconMap = {
  'whatsapp-group': MessageCircle,
  'whatsapp-channel': MessageCircle,
  instagram: Instagram,
  x: ExternalLink,
  telegram: Send
};

export default function SocialAccountsSection({ title = 'Social Accounts', links = [], editable = false, values = [], onChange, onSave, saving = false, children }) {
  if (editable) {
    return (
      <section className="panel social-panel">
        <div className="section-title"><span>{title}</span></div>
        <div className="social-admin-grid">
          {values.map((item, index) => (
            <div className="social-admin-row" key={item.platform || index}>
              <label>
                Platform Name
                <input value={item.name} onChange={(event) => onChange(index, 'name', event.target.value)} />
              </label>
              <label>
                Link URL
                <input value={item.url} onChange={(event) => onChange(index, 'url', event.target.value)} />
              </label>
            </div>
          ))}
        </div>
        <div className="social-admin-actions">
          <button className="primary" type="button" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Social Links'}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel social-panel">
      <div className="section-title">
        <span>{title}</span>
      </div>
      <div className="social-links-grid">
        {links.map((item) => {
          const Icon = iconMap[item.platform] || ExternalLink;
          return (
            <a
              key={`${item.platform}-${item.url}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link-card"
            >
              <div className="social-link-icon">
                <Icon size={20} />
              </div>
              <div className="social-link-copy">
                <strong>{item.name}</strong>
                <span>{item.url}</span>
              </div>
              <ExternalLink size={16} />
            </a>
          );
        })}
      </div>
      {children}
    </section>
  );
}
