import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
    <AuthFrame title="Welcome Back" subtitle="" switchText="Don't have an account?" switchTo="/signup" switchLabel="Create Account">
      {error && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}
      {!showReset ? (
        <form onSubmit={submit} className="form" autoComplete="off" data-form-type="other">
          <label>Email Address<input {...noAutofill} name="manual_login_email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>
            <span className="label-row">Password<button type="button" className="forgot-inline" onClick={() => setShowReset(true)}>Forgot?</button></span>
            <span className="password-field">
              <input {...noAutofill} name="manual_login_passcode" type={showPassword ? 'text' : 'password'} required minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </span>
          </label>
          <button className="primary">Sign In</button>
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
