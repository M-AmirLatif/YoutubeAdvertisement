import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthFrame from '../components/AuthFrame.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const noAutofill = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'none',
  spellCheck: 'false',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-form-type': 'other'
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  async function requestReset(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const data = await api('/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail })
      });
      setMessage(data.resetToken ? `Development reset token: ${data.resetToken}` : data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const data = await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, password: newPassword })
      });
      setMessage(data.message);
      setShowReset(false);
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthFrame title="Sign in" subtitle="Access your dashboard and continue today's video tasks." switchText="New here?" switchTo="/signup" switchLabel="Create account">
      {error && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}
      {!showReset ? (
        <form onSubmit={submit} className="form" autoComplete="off" data-form-type="other">
          <label>Email<input {...noAutofill} name="manual_login_email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input {...noAutofill} name="manual_login_passcode" type="password" required minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <button className="primary">Sign in</button>
          <button type="button" className="link-button" onClick={() => setShowReset(true)}>Forgot password?</button>
        </form>
      ) : (
        <div className="form">
          <form className="form" onSubmit={requestReset} autoComplete="off" data-form-type="other">
            <label>Email<input {...noAutofill} name="manual_reset_email" type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} /></label>
            <button className="secondary">Request reset token</button>
          </form>
          <form className="form" onSubmit={resetPassword} autoComplete="off" data-form-type="other">
            <label>Reset token<input {...noAutofill} name="manual_reset_token" required value={resetToken} onChange={(e) => setResetToken(e.target.value)} /></label>
            <label>New password<input {...noAutofill} name="manual_new_passcode" type="password" required minLength="6" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
            <button className="primary">Reset password</button>
            <button type="button" className="link-button" onClick={() => setShowReset(false)}>Back to sign in</button>
          </form>
        </div>
      )}
    </AuthFrame>
  );
}
