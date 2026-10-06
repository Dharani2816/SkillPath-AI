import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Cake, CheckCircle2, GraduationCap, Heart, Home, Languages, Lightbulb, Map, MapPin, Phone, UserRound, Users, Wallet } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { AREA_OPTIONS, DISTRICTS, EDUCATION_OPTIONS, INCOME_OPTIONS, INTEREST_OPTIONS, LEARNING_OPTIONS, RELATION_OPTIONS } from '../lib/i18n';
import { ICONS } from '../components/icons';
import { Alert, Button, Card, ChoiceGroup, Field, PageHeader, inputCls } from '../components/ui';

export default function Profile() {
  const { user, refresh } = useAuth();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const onboarding = params.get('onboarding') === '1';
  const sp = user.studentProfile || {};
  const pp = user.parentProfile || {};
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    district: user.district || '',
    state: user.state || 'Tamil Nadu',
    language: user.language || lang,
    age: sp.age || '',
    educationLevel: sp.educationLevel || '',
    location: sp.location || '',
    areaType: sp.areaType || '',
    householdIncome: sp.householdIncome || '',
    interests: sp.interests || [],
    learningPreference: sp.learningPreference || '',
    relation: pp.relation || '',
    occupation: pp.occupation || '',
  });
  const [state, setState] = useState({ saving: false, error: null, saved: false });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v && v.target ? v.target.value : v }));
  const toggleInterest = (v) =>
    setForm((f) => ({ ...f, interests: f.interests.includes(v) ? f.interests.filter((x) => x !== v) : [...f.interests, v] }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ saving: true, error: null, saved: false });
    const common = { name: form.name, phone: form.phone, district: form.district, state: form.state, language: form.language };
    const body =
      user.role === 'STUDENT'
        ? {
            ...common,
            age: form.age === '' ? undefined : Number(form.age),
            educationLevel: form.educationLevel || undefined,
            location: form.location,
            areaType: form.areaType || undefined,
            householdIncome: form.householdIncome || undefined,
            interests: form.interests,
            learningPreference: form.learningPreference || undefined,
          }
        : { ...common, relation: form.relation || undefined, occupation: form.occupation, educationLevel: form.educationLevel || undefined };
    try {
      await api.put('/profile', body);
      await refresh();
      setLang(form.language);
      setState({ saving: false, error: null, saved: true });
      if (onboarding) navigate('/assessment');
    } catch (err) {
      setState({ saving: false, error: errorMessage(err), saved: false });
    }
  };

  const isStudent = user.role === 'STUDENT';

  return (
    <div>
      <PageHeader icon={UserRound} title={t('profileTitle')} subtitle={t('profileSub')} />
      <form onSubmit={submit} className="space-y-5">
        <Card className="grid gap-5 md:grid-cols-2">
          <Field label={t('fullName')} icon={UserRound}>
            <input className={inputCls} value={form.name} onChange={set('name')} required />
          </Field>
          {isStudent ? (
            <Field label={t('age')} icon={Cake}>
              <input type="number" min={12} max={40} className={inputCls} value={form.age} onChange={set('age')} />
            </Field>
          ) : (
            <Field label={t('phone')} icon={Phone}>
              <input type="tel" className={inputCls} value={form.phone} onChange={set('phone')} />
            </Field>
          )}
          {isStudent && (
            <Field label={t('location')} icon={Home}>
              <input className={inputCls} value={form.location} onChange={set('location')} />
            </Field>
          )}
          <Field label={t('district')} icon={MapPin}>
            <input className={inputCls} list="profile-districts" value={form.district} onChange={set('district')} />
            <datalist id="profile-districts">
              {DISTRICTS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field label={t('state')} icon={Map}>
            <input className={inputCls} value={form.state} onChange={set('state')} />
          </Field>
          {isStudent && (
            <Field label={t('phone')} icon={Phone}>
              <input type="tel" className={inputCls} value={form.phone} onChange={set('phone')} />
            </Field>
          )}
        </Card>

        <Card className="space-y-5">
          <Field label={t('education')} icon={GraduationCap}>
            <ChoiceGroup lang={lang} options={EDUCATION_OPTIONS} value={form.educationLevel} onChange={set('educationLevel')} />
          </Field>
          {isStudent && (
            <>
              <Field label={t('areaType')} icon={Home}>
                <ChoiceGroup lang={lang} options={AREA_OPTIONS} value={form.areaType} onChange={set('areaType')} />
              </Field>
              <Field label={t('householdIncome')} icon={Wallet}>
                <ChoiceGroup lang={lang} columns="sm:grid-cols-4" options={INCOME_OPTIONS} value={form.householdIncome} onChange={set('householdIncome')} />
              </Field>
              <Field label={t('interests')} icon={Heart}>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((o) => {
                    const on = form.interests.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleInterest(o.value)}
                        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 font-medium ${
                          on ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        {on && <CheckCircle2 className="h-4 w-4" aria-hidden />}
                        {o.label[lang] || o.label.EN}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label={t('learningPreference')} icon={Lightbulb}>
                <ChoiceGroup lang={lang} columns="sm:grid-cols-4" options={LEARNING_OPTIONS} iconMap={ICONS} value={form.learningPreference} onChange={set('learningPreference')} />
              </Field>
            </>
          )}
          {!isStudent && (
            <>
              <Field label={t('relation')} icon={Users}>
                <ChoiceGroup lang={lang} options={RELATION_OPTIONS} value={form.relation} onChange={set('relation')} />
              </Field>
              <Field label={t('occupation')} icon={Briefcase}>
                <input className={inputCls} value={form.occupation} onChange={set('occupation')} />
              </Field>
            </>
          )}
          <Field label={t('language')} icon={Languages}>
            <ChoiceGroup
              lang={lang}
              columns="sm:grid-cols-2"
              value={form.language}
              onChange={set('language')}
              options={[
                { value: 'EN', label: { EN: 'English', TA: 'English' } },
                { value: 'TA', label: { EN: 'தமிழ் (Tamil)', TA: 'தமிழ்' } },
              ]}
            />
          </Field>
        </Card>

        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.saved && (
          <Alert tone="success" icon={CheckCircle2}>
            {t('profileSaved')}
          </Alert>
        )}
        <Button type="submit" size="lg" variant="accent" loading={state.saving}>
          {onboarding ? `${t('save')} → ${t('navAssessment')}` : t('save')}
        </Button>
      </form>
    </div>
  );
}
