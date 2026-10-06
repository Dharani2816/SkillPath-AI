import { HeartHandshake, MessageCircle, PhoneCall, Scale, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import useApi from '../../lib/useApi';
import { CONCERNS } from '../../lib/i18n';
import { L } from '../../lib/format';
import { defaultCareerId } from '../../components/CareerPicker';
import EvidenceCards from '../../components/EvidenceCards';
import { Badge, Button, Card, ErrorState, Loading, MatchRing } from '../../components/ui';

const DECISION_TONE = { AGREED: 'teal', EXPLORING: 'blue', UNDECIDED: 'amber', DECLINED: 'red' };
const STATUS_TONE = { OPEN: 'amber', ESCALATED: 'blue', ADDRESSED: 'teal' };

export default function ParentDashboard() {
  const { user } = useAuth();
  const { t, tr, lang } = useLang();
  const family = useApi('/family');

  if (family.loading) return <Loading />;
  if (family.error) return <ErrorState error={family.error} onRetry={family.reload} />;

  const fam = family.data && family.data.id ? family.data : null;
  const firstName = user.name.split(' ')[0];

  if (!fam) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">{t('parentWelcome', { name: firstName })}</h1>
        <Card className="flex flex-col items-start gap-3">
          <Users className="h-10 w-10 text-brand-600" aria-hidden />
          <p className="text-xl font-bold text-brand-900">{t('connectTitle')}</p>
          <p className="text-slate-600">{t('connectSub')}</p>
          <Button to="/family" variant="accent" size="lg">
            {t('connect')}
          </Button>
        </Card>
      </div>
    );
  }

  const student = fam.students[0];
  const recs = (student && student.recommendations) || [];
  const rec = recs.find((r) => r.careerId === defaultCareerId(recs, fam));

  const actions = [
    { to: rec ? `/careers/${rec.career.slug}/evidence` : '/evidence', icon: Scale, label: t('actionEvidence') },
    { to: '/family', icon: HeartHandshake, label: t('actionConcerns') },
    { to: '/ask', icon: MessageCircle, label: t('actionAsk') },
    { to: '/counsellor-request', icon: PhoneCall, label: t('actionCounsellor') },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">{t('parentWelcome', { name: firstName })}</h1>
        {student && <p className="mt-1 text-lg text-slate-600">{t('parentSub', { child: student.user.name })}</p>}
      </div>

      <Card>
        <p className="text-sm font-semibold text-slate-500">{t('yourChild')}</p>
        {rec ? (
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
            <MatchRing value={rec.overallScore} size={104} />
            <div className="flex-1">
              <p className="text-2xl font-bold text-brand-900">{tr(rec.career, 'name')}</p>
              <p className="text-slate-600">{student.user.name}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">{t('familyStatus')}</p>
              <Badge tone={DECISION_TONE[fam.decision]} className="mt-1 text-base">
                {t(`decision${fam.decision}`)}
              </Badge>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-slate-600">{t('notLinkedYet')}</p>
        )}
      </Card>

      <div>
        <h2 className="mb-3 text-xl font-bold text-brand-900">{t('quickActions')}</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {actions.map(({ to, icon: Icon, label }) => (
            <Link
              key={label}
              to={to}
              className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 text-center transition-colors hover:border-accent-500 hover:bg-accent-50"
            >
              <span className="rounded-full bg-brand-100 p-4 text-brand-800">
                <Icon className="h-8 w-8" aria-hidden />
              </span>
              <span className="text-lg font-semibold text-brand-900">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {rec && (
        <Card>
          <h2 className="mb-3 text-lg font-bold text-brand-900">{t('careerEvidence')}</h2>
          <EvidenceCards career={rec.career} summary={rec.evidence} />
        </Card>
      )}

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-900">{t('concernsTitle')}</h2>
          <Button variant="ghost" to="/concerns">
            {t('view')} →
          </Button>
        </div>
        {fam.concerns.length ? (
          <div className="flex flex-wrap gap-2">
            {fam.concerns.slice(0, 6).map((c) => {
              const meta = CONCERNS.find((x) => x.type === c.type);
              return (
                <Badge key={c.id} tone={STATUS_TONE[c.status]} className="text-base">
                  {meta ? L(meta.label, lang) : c.type} · {t(`concernStatus${c.status}`)}
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500">{t('noConcerns')}</p>
        )}
      </Card>
    </div>
  );
}
