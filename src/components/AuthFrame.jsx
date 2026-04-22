import { Link } from 'react-router-dom';
import { branding } from '../config/branding.js';

export default function AuthFrame({ title, subtitle, switchText, switchTo, switchLabel, children }) {
  return (
    <div className="auth-page">
      <section className={`auth-panel ${title ? 'login-panel' : 'signup-panel'}`}>
        <div className="auth-brand">
          <div className="auth-logo">
            <strong>{branding.shortName}</strong>
            <span>{branding.authTagline}</span>
          </div>
          <h1>{branding.appName}</h1>
        </div>
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
