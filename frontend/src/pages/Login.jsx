import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, UserRound } from 'lucide-react';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Alert, Button, Card, Field, inputCls } from '../components/ui';

// Documented demo accounts (see README). Clicking only fills the form.
const DEMO = [
  { role: 'roleStudent', email: 'student@skillpath.demo', icon: GraduationCap },
  { role: 'roleParent', email: 'parent@skillpath.demo', icon: UserRound },
];
const DEMO_PASSWORD = 'SkillPath@123';

export default function Login() {
  const { login } = useAuth();
  const { t, setLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [state, setState] = useState({ loading: false, error: null });

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: null });
    try {
      const loggedIn = await login(form.email, form.password);
      // Show the app in the language this user chose in their profile.
      if (loggedIn && loggedIn.language) setLang(loggedIn.language);
      navigate((location.state && location.state.from) || '/dashboard', { replace: true });
    } catch (err) {
      setState({ loading: false, error: errorMessage(err) });
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card>
        <h1 className="text-2xl font-bold text-brand-900">{t('loginTitle')}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label={t('email')} icon={Mail}>
            <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
          </Field>
          <Field label={t('password')} icon={Lock}>
            <input type="password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" />
          </Field>
          {state.error && <Alert tone="error">{state.error}</Alert>}
          <Button type="submit" size="lg" className="w-full" loading={state.loading}>
            {t('login')}
          </Button>
        </form>
        <p className="mt-4 text-center text-slate-600">
          {t('noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-700 underline">
            {t('register')}
          </Link>
        </p>
      </Card>

      <Card className="mt-4">
        <p className="mb-3 font-semibold text-slate-700">{t('demoAccounts')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEMO.map(({ role, email, icon }) => (
            <Button key={email} variant="secondary" icon={icon} onClick={() => setForm({ email, password: DEMO_PASSWORD })}>
              {t('demoFill', { role: t(role) })}
            </Button>
          ))}
        </div>
      </Card>
    </main>
  );
}
