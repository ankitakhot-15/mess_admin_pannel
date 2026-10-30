import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Field } from '../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ mobile: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await login(f.mobile, f.password); nav('/'); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="login">
      <form className="login-card form" onSubmit={submit}>
        <h1>Mess Admin</h1>
        <p className="muted">Sign in to manage messes, orders and delivery.</p>
        <Field label="Mobile number" inputMode="numeric" maxLength={10} value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} required />
        <Field label="Password" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        {err && <div className="error-box">{err}</div>}
        <Button loading={busy}>Sign in</Button>
      </form>
    </div>
  );
}
