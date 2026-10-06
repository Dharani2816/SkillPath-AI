import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, CheckCircle2, GraduationCap, Home, KeyRound, Mail, MapPin, MessageCircle, PhoneCall, Sparkles, UserRound, Users, Wallet } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import useApi from '../lib/useApi';
import { AREA_OPTIONS, CONCERNS, EDUCATION_OPTIONS, INCOME_OPTIONS } from '../lib/i18n';
import { L } from '../lib/format';
import { ICONS } from '../components/icons';
import CareerPicker, { defaultCareerId } from '../components/CareerPicker';
import EvidenceCards from '../components/EvidenceCards';
import { Alert, Badge, Button, Card, ErrorState, Field, Loading, MatchRing, PageHeader, inputCls } from '../components/ui';

const DECISIONS = ['AGREED', 'EXPLORING', 'UNDECIDED', 'DECLINED'];
const STATUS_TONE = { OPEN: 'amber', ESCALATED: 'blue', ADDRESSED: 'teal' };
const optionLabel = (options, value, lang) => L((options.find((o) => o.value === value) || {}).label, lang) || value || '—';

function ConnectForm({ onConnected }) {
  const { user } = useAuth();
  const { t } = useLang();
  const isParent = user.role === 'PARENT';
  const [value, setValue] = useState('');
  const [state, setState] = useState({ loading: false, error: null });

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: null });
    try {
      await api.post('/family/connect', isParent ? { connectCode: value.trim() } : { parentEmail: value.trim() });
      setValue('');
      setState({ loading: false, error: null });
      onConnected();
    } catch (err) {
      setState({ loading: false, error: errorMessage(err) });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label={isParent ? t('familyCode') : t('parentEmail')} icon={isParent ? KeyRound : Mail}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={`${inputCls} ${isParent ? 'uppercase tracking-[0.3em]' : ''}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type={isParent ? 'text' : 'email'}
            maxLength={isParent ? 6 : undefined}
            required
          />
          <Button type="submit" variant="accent" loading={state.loading}>
            {t('connect')}
          </Button>
        </div>
      </Field>
      {state.error && <Alert tone="error">{state.error}</Alert>}
    </form>
  );
}

export default function FamilyCentre() {
  const { user, refresh } = useAuth();
  const { t, tr, lang } = useLang();
  const navigate = useNavigate();
  const family = useApi('/family');
  const [careerId, setCareerId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [action, setAction] = useState({ loading: null, error: null });

  if (family.loading) return <Loading />;
  if (family.error) return <ErrorState error={family.error} onRetry={family.reload} />;

  const fam = family.data && family.data.id ? family.data : null;
  const onConnected = async () => {
    await refresh();
    family.reload();
  };

  // Parent who has not joined a family yet.
  if (!fam) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader icon={Users} title={t('connectTitle')} subtitle={t('connectSub')} />
        <Card>
          <ConnectForm onConnected={onConnected} />
        </Card>
      </div>
    );
  }

  const student = fam.students[0];
  const recs = (student && student.recommendations) || [];
  const currentId = careerId || defaultCareerId(recs, fam);
  const rec = recs.find((r) => r.careerId === currentId);
  const activeConcerns = fam.concerns.filter((c) => !rec || !c.careerId || c.careerId === rec.careerId);
  const statusOf = (type) => {
    const c = activeConcerns.find((x) => x.type === type);
    return c ? c.status : null;
  };
  const toggle = (type) => setSelected((s) => (s.includes(type) ? s.filter((x) => x !== type) : [...s, type]));

  const askAi = async () => {
    setAction({ loading: 'ask', error: null });
    try {
      const fresh = selected.filter((type) => !statusOf(type));
      if (fresh.length) await api.post('/family/concerns', { concerns: fresh, careerId: rec && rec.careerId });
      navigate(`/ask?concern=${selected[0]}${rec ? `&career=${rec.careerId}` : ''}`);
    } catch (err) {
      setAction({ loading: null, error: errorMessage(err) });
    }
  };

  const decide = async (decision) => {
    setAction({ loading: decision, error: null });
    try {
      await api.patch('/family/decision', { decision, selectedCareerId: rec && rec.careerId });
      await family.reload();
      setAction({ loading: null, error: null });
    } catch (err) {
      setAction({ loading: null, error: errorMessage(err) });
    }
  };

  const profile = student
    ? [
        { icon: UserRound, label: t('fullName'), value: student.user.name },
        { icon: GraduationCap, label: t('education'), value: optionLabel(EDUCATION_OPTIONS, student.educationLevel, lang) },
        { icon: MapPin, label: t('district'), value: student.user.district || '—' },
        { icon: Home, label: t('areaType'), value: optionLabel(AREA_OPTIONS, student.areaType || fam.areaType, lang) },
        { icon: Wallet, label: t('householdIncome'), value: optionLabel(INCOME_OPTIONS, student.householdIncome || fam.householdIncome, lang) },
      ]
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Users}
        title={t('familyTitle')}
        subtitle={t('familySub')}
        actions={
          <Button variant="secondary" icon={PhoneCall} to="/counsellor-request">
            {t('talkToCounsellor')}
          </Button>
        }
      />

      {/* Members + connection */}
      <Card className="grid gap-5 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-bold text-brand-900">{t('members')}</h2>
          <ul className="space-y-2">
            {fam.students.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-accent-600" aria-hidden /> {s.user.name} <Badge tone="teal">{t('roleStudent')}</Badge>
              </li>
            ))}
            {fam.parents.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-brand-600" aria-hidden /> {p.user.name} <Badge tone="blue">{t('roleParent')}</Badge>
              </li>
            ))}
            {!fam.parents.length && <li className="font-semibold text-amber-700">{t('parentNotConnected')}</li>}
          </ul>
        </div>
        {user.role === 'STUDENT' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-50 p-4">
              <p className="text-sm font-semibold text-slate-600">{t('familyCode')}</p>
              <p className="text-3xl font-bold tracking-[0.3em] text-brand-900">{fam.connectCode}</p>
              <p className="mt-1 text-sm text-slate-600">{t('familyCodeHelp')}</p>
            </div>
            <ConnectForm onConnected={onConnected} />
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
            <UserRound className="h-5 w-5 text-accent-600" aria-hidden /> {t('learnerProfile')}
          </h2>
          <dl className="space-y-3">
            {profile.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                <dt className="w-28 shrink-0 text-slate-500 sm:w-40">{label}</dt>
                <dd className="font-semibold text-brand-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
            <Sparkles className="h-5 w-5 text-accent-600" aria-hidden /> {t('recommendedCareer')}
          </h2>
          {rec ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <MatchRing value={rec.overallScore} />
                <div className="flex-1">
                  <p className="text-2xl font-bold text-brand-900">{tr(rec.career, 'name')}</p>
                  <p className="text-slate-600">{tr(rec.career, 'description')}</p>
                </div>
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {(lang === 'TA' ? rec.reasonsTa : rec.reasons).map((r) => (
                  <li key={r}>
                    <Badge tone="teal">{r}</Badge>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <CareerPicker recommendations={recs.map((r) => ({ ...r, matchPercent: r.overallScore }))} value={rec.careerId} onChange={setCareerId} />
              </div>
            </>
          ) : (
            <p className="text-slate-600">{t('notLinkedYet')}</p>
          )}
        </Card>
      </div>

      {rec && (
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold text-brand-900">
              <BarChart3 className="h-5 w-5 text-accent-600" aria-hidden /> {t('careerEvidence')}
            </h2>
            <Button variant="ghost" to={`/careers/${rec.career.slug}/evidence`}>
              {t('seeEvidence')} →
            </Button>
          </div>
          <EvidenceCards career={rec.career} summary={rec.evidence} />
        </Card>
      )}

      {/* Concerns */}
      <Card className="border-brand-200">
        <h2 className="text-2xl font-bold text-brand-900">{t('whatConcerns')}</h2>
        <p className="mt-1 text-slate-600">{t('whatConcernsSub')}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {CONCERNS.map((c) => {
            const Icon = ICONS[c.icon];
            const on = selected.includes(c.type);
            const status = statusOf(c.type);
            return (
              <button
                key={c.type}
                type="button"
                onClick={() => toggle(c.type)}
                aria-pressed={on}
                className={`relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-colors ${
                  on ? 'border-accent-500 bg-accent-50' : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                {on && <CheckCircle2 className="absolute right-2 top-2 h-6 w-6 text-accent-600" aria-hidden />}
                <span className={`rounded-full p-3 ${on ? 'bg-accent-600 text-white' : 'bg-brand-100 text-brand-800'}`}>
                  <Icon className="h-7 w-7" aria-hidden />
                </span>
                <span className="text-lg font-semibold text-brand-900">{L(c.label, lang)}</span>
                {status && <Badge tone={STATUS_TONE[status]}>{t(`concernStatus${status}`)}</Badge>}
              </button>
            );
          })}
        </div>
        {action.error && (
          <div className="mt-4">
            <Alert tone="error">{action.error}</Alert>
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button size="lg" variant="accent" icon={MessageCircle} onClick={askAi} disabled={!selected.length} loading={action.loading === 'ask'}>
            {t('askSkillPath')}
          </Button>
          {!selected.length && <span className="text-slate-500">{t('selectConcernFirst')}</span>}
        </div>
      </Card>

      {/* Decision */}
      {rec && (
        <Card>
          <h2 className="text-lg font-bold text-brand-900">{t('decisionTitle')}</h2>
          <p className="mt-1 text-slate-600">{t('decisionSub')}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {DECISIONS.map((d) => {
              const current = fam.decision === d && (d !== 'AGREED' || fam.selectedCareerId === rec.careerId);
              return (
                <Button
                  key={d}
                  size="lg"
                  variant={current ? 'primary' : 'secondary'}
                  icon={current ? CheckCircle2 : undefined}
                  loading={action.loading === d}
                  onClick={() => decide(d)}
                  aria-pressed={current}
                >
                  {t(`decision${d}`)}
                </Button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
