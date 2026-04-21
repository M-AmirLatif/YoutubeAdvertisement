import { Link } from 'react-router-dom';
import { branding } from '../config/branding.js';

export default function AuthFrame({ title, subtitle, switchText, switchTo, switchLabel, children }) {
  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="brand large">
          <div className="brand-mark">{branding.shortName}</div>
          <div>
            <strong>{branding.appName}</strong>
            <span>{branding.authTagline}</span>
          </div>
        </div>
        <h1>{branding.heroTitle}</h1>
        <p>{branding.heroCopy}</p>
      </section>
      <section className="auth-panel">
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {children}
        <div className="switch-link">
          {switchText} <Link to={switchTo}>{switchLabel}</Link>
        </div>
      </section>
    </div>
  );
}
