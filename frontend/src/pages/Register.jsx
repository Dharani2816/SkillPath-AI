import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, KeyRound, Lock, Mail, MapPin, UserRound } from 'lucide-react';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { DISTRICTS } from '../lib/i18n';
import { Alert, Button, Card, Field, inputCls } from '../components/ui';

export default function Register() {
  const { register } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [role, setRole] = useState('STUDENT');
  const [form, setForm] = useState({ name: '', email: '', password: '', district: '', connectCode: '' });
  const [state, setState] = useState({ loading: false, error: null });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: null });
    try {
      await register({
        role,
        name: form.name,
        email: form.email,
        password: form.password,
        district: form.district || undefined,
        language: lang,
        connectCode: role === 'PARENT' && form.connectCode ? form.connectCode : undefined,
      });
      // Learners fill in their background next; parents go straight to the family centre.
      navigate(role === 'STUDENT' ? '/profile?onboarding=1' : '/family', { replace: true });
    } catch (err) {
      setState({ loading: false, error: errorMessage(err) });
    }
  };

  const roles = [
    { value: 'STUDENT', icon: GraduationCap, title: t('roleStudent'), sub: t('roleStudentSub') },
    { value: 'PARENT', icon: UserRound, title: t('roleParent'), sub: t('roleParentSub') },
  ];

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <Card>
        <h1 className="text-2xl font-bold text-brand-900">{t('registerTitle')}</h1>
        <p className="mt-4 font-semibold text-slate-700">{t('iAm')}</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {roles.map(({ value, icon: Icon, title, sub }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              aria-pressed={role === value}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                role === value ? 'border-accent-500 bg-accent-50' : 'border-slate-200 hover:border-brand-300'
              }`}
            >
              <Icon className={`h-8 w-8 shrink-0 ${role === value ? 'text-accent-700' : 'text-brand-600'}`} aria-hidden />
              <span>
                <span className="block text-lg font-semibold text-brand-900">{title}</span>
                <span className="block text-sm text-slate-600">{sub}</span>
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label={t('fullName')} icon={UserRound}>
            <input className={inputCls} value={form.name} onChange={set('name')} required autoComplete="name" />
          </Field>
          <Field label={t('email')} icon={Mail}>
            <input type="email" className={inputCls} value={form.email} onChange={set('email')} required autoComplete="email" />
          </Field>
          <Field label={t('password')} icon={Lock} hint={lang === 'TA' ? 'குறைந்தது 6 எழுத்துகள்' : 'At least 6 characters'}>
            <input type="password" className={inputCls} value={form.password} onChange={set('password')} required minLength={6} autoComplete="new-password" />
          </Field>
          <Field label={t('district')} icon={MapPin}>
            <input className={inputCls} list="reg-districts" value={form.district} onChange={set('district')} />
            <datalist id="reg-districts">
              {DISTRICTS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          {role === 'PARENT' && (
            <Field label={t('connectCodeOptional')} icon={KeyRound}>
              <input className={`${inputCls} uppercase tracking-widest`} value={form.connectCode} onChange={set('connectCode')} maxLength={6} />
            </Field>
          )}
          {state.error && <Alert tone="error">{state.error}</Alert>}
          <Button type="submit" size="lg" variant="accent" className="w-full" loading={state.loading}>
            {t('register')}
          </Button>
        </form>
        <p className="mt-4 text-center text-slate-600">
          {t('haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-700 underline">
            {t('login')}
          </Link>
        </p>
      </Card>
    </main>
  );
}
