import { CheckCircle2, Circle, ClipboardList, FileText, MessageCircle, Route, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import useApi from '../../lib/useApi';
import { roadmapProgress } from '../../components/RoadmapTimeline';
import { Badge, Button, Card, ErrorState, Loading, MatchRing, ProgressBar } from '../../components/ui';

const DECISION_TONE = { AGREED: 'teal', EXPLORING: 'blue', UNDECIDED: 'amber', DECLINED: 'red' };

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t, tr, lang } = useLang();
  const assessment = useApi('/assessment/latest');
  const recs = useApi('/recommendations');
  const family = useApi('/family');

  if (assessment.loading || recs.loading || family.loading) return <Loading />;
  const error = assessment.error || recs.error || family.error;
  if (error) return <ErrorState error={error} onRetry={() => [assessment, recs, family].forEach((x) => x.reload())} />;

  const done = assessment.data.completed;
  const top = recs.data.recommendations[0];
  const fam = family.data && family.data.id ? family.data : null;
  const parentConnected = Boolean(fam && fam.parents.length);
  const progress = roadmapProgress(top && top.roadmap);
  const journey = [
    { label: t('journeyAssessment'), done },
    { label: t('journeyParent'), done: parentConnected },
    { label: t('journeyConcerns'), done: Boolean(fam && fam.concerns.length) },
    { label: t('journeyDecision'), done: Boolean(fam && ['AGREED', 'DECLINED'].includes(fam.decision)) },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">{t('welcome', { name: user.name.split(' ')[0] })}</h1>
        <p className="mt-1 text-slate-600">{t('dashSub')}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Assessment */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-2 text-slate-500">
            <ClipboardList className="h-5 w-5 text-brand-600" aria-hidden /> {t('assessmentProgress')}
          </div>
          <p className="mt-2 text-2xl font-bold text-brand-900">{done ? t('assessmentDone') : t('assessmentNotDone')}</p>
          <ProgressBar value={done ? 100 : 0} className="mt-3" />
          <p className="mt-2 text-sm text-slate-500">
            {done ? assessment.data.answered : 0} / {assessment.data.total}
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <Button to="/assessment" variant={done ? 'secondary' : 'accent'} size={done ? 'md' : 'lg'}>
              {done ? t('retakeAssessment') : t('takeAssessment')}
            </Button>
            {done && (
              <Button to="/results" variant="ghost">
                {t('navResults')} →
              </Button>
            )}
          </div>
        </Card>

        {/* Top career */}
        <Card className="flex flex-col lg:col-span-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles className="h-5 w-5 text-brand-600" aria-hidden /> {t('topCareer')}
          </div>
          {top ? (
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
              <MatchRing value={top.matchPercent} size={104} />
              <div className="flex-1">
                <p className="text-2xl font-bold text-brand-900">{tr(top.career, 'name')}</p>
                <p className="text-slate-500">
                  {top.matchPercent}% {t('match')}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {(lang === 'TA' ? top.reasonsTa : top.reasons).slice(0, 3).map((r) => (
                    <li key={r}>
                      <Badge tone="teal">{r}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
              <Button to={`/careers/${top.career.slug}`} variant="secondary">
                {t('viewCareer')}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-slate-600">{t('noRecs')}</p>
          )}
        </Card>

        {/* Family status */}
        <Card>
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-5 w-5 text-brand-600" aria-hidden /> {t('familyStatus')}
          </div>
          {parentConnected ? (
            <>
              <Badge tone={DECISION_TONE[fam.decision]} className="mt-3 text-base">
                {t(`decision${fam.decision}`)}
              </Badge>
              <p className="mt-2 text-sm text-slate-500">{fam.parents.map((p) => p.user.name).join(', ')}</p>
            </>
          ) : (
            <p className="mt-3 text-lg font-semibold text-amber-700">{t('parentNotConnected')}</p>
          )}
          <Button to="/family" variant="secondary" className="mt-4">
            {parentConnected ? t('navFamily') : t('connectParent')}
          </Button>
        </Card>

        {/* Roadmap */}
        <Card>
          <div className="flex items-center gap-2 text-slate-500">
            <Route className="h-5 w-5 text-brand-600" aria-hidden /> {t('roadmapProgress')}
          </div>
          <p className="mt-2 text-2xl font-bold text-brand-900">
            {progress.percent}% <span className="text-base font-medium text-slate-500">{t('complete')}</span>
          </p>
          <ProgressBar value={progress.percent} className="mt-3" tone="brand" />
          {progress.next && (
            <p className="mt-3 text-slate-600">
              {t('nextStep')}: <span className="font-semibold text-brand-900">{lang === 'TA' ? progress.next.titleTa : progress.next.title}</span>
            </p>
          )}
          <Button to="/roadmap" variant="secondary" className="mt-4" disabled={!top}>
            {t('navRoadmap')}
          </Button>
        </Card>

        {/* AI shortcut */}
        <Link to="/ask" className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-700 p-6 text-white shadow-sm transition-shadow hover:shadow-md">
          <MessageCircle className="h-8 w-8 text-accent-100" aria-hidden />
          <p className="mt-3 text-xl font-bold">{t('askAiShortcut')}</p>
          <p className="mt-1 text-brand-100">{t('askAiShortcutSub')}</p>
        </Link>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-bold text-brand-900">{t('journey')}</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map(({ label, done: ok }) => (
            <li key={label} className={`flex items-center gap-2 rounded-xl border px-3 py-3 ${ok ? 'border-accent-100 bg-accent-50' : 'border-slate-200'}`}>
              {ok ? <CheckCircle2 className="h-6 w-6 text-accent-600" aria-hidden /> : <Circle className="h-6 w-6 text-slate-300" aria-hidden />}
              <span className={ok ? 'font-semibold text-accent-700' : 'text-slate-600'}>{label}</span>
            </li>
          ))}
        </ol>
        <Button to="/plan" variant="ghost" icon={FileText} className="mt-3">
          {t('navPlan')}
        </Button>
      </Card>
    </div>
  );
}
