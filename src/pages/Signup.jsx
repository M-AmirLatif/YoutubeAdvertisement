import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthFrame from '../components/AuthFrame.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const noAutofill = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'none',
  spellCheck: 'false',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-form-type': 'other'
};

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ username: '', email: '', password: '', referralCode: params.get('ref') || '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthFrame title="Create account" subtitle="Start tracking campaigns, earnings, referrals, and withdrawals." switchText="Already registered?" switchTo="/login" switchLabel="Sign in">
      <form onSubmit={submit} className="form" autoComplete="off" data-form-type="other">
        {error && <div className="alert">{error}</div>}
        <label>Username<input {...noAutofill} name="manual_signup_name" required minLength="3" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
        <label>Email<input {...noAutofill} name="manual_signup_email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input {...noAutofill} name="manual_signup_passcode" type="password" required minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <label>Referral code<input {...noAutofill} name="manual_referral_code" value={form.referralCode} onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })} /></label>
        <button className="primary">Create account</button>
      </form>
    </AuthFrame>
  );
}
