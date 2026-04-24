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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthFrame title="Welcome Back" subtitle="" switchText="Don't have an account?" switchTo="/signup" switchLabel="Create Account">
      {error && <div className="alert">{error}</div>}
      <form onSubmit={submit} className="form" autoComplete="off" data-form-type="other">
        <label>Email Address<input {...noAutofill} name="manual_login_email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>
          <span className="label-row">Password</span>
          <span className="password-field">
            <input {...noAutofill} name="manual_login_passcode" type={showPassword ? 'text' : 'password'} required minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </span>
        </label>
        <button className="primary">Sign In</button>
      </form>
    </AuthFrame>
  );
}
