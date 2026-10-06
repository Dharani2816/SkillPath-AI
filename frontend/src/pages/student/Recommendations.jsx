import { Clock, IndianRupee, Info, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import useApi from '../../lib/useApi';
import { rupeeRange } from '../../lib/format';
import { Alert, Badge, Button, Card, Empty, ErrorState, Loading, MatchRing, PageHeader, ProgressBar } from '../../components/ui';

export default function Recommendations() {
  const { user } = useAuth();
  const { t, tr, lang } = useLang();
  const { data, loading, error, reload } = useApi('/recommendations');

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const recs = data.recommendations;
  if (!recs.length) {
    return (
      <Empty
        icon={Sparkles}
        title={t('noRecs')}
        action={user.role === 'STUDENT' ? <Button to="/assessment">{t('takeAssessment')}</Button> : null}
      />
    );
  }

  const components = [
    ['interestScore', 'scoreInterest'],
    ['skillScore', 'scoreSkill'],
    ['aptitudeScore', 'scoreAptitude'],
    ['localScore', 'scoreLocal'],
    ['growthScore', 'scoreGrowth'],
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon={Sparkles} title={t('recsTitle')} />
      <Alert tone="info" icon={Info}>
        {t('recsMethod')}
      </Alert>

      <div className="grid gap-5 xl:grid-cols-3">
        {recs.map((r) => (
          <Card key={r.id} className={`flex flex-col ${r.rank === 1 ? 'border-accent-500 ring-1 ring-accent-500' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone={r.rank === 1 ? 'teal' : 'slate'}>#{r.rank}</Badge>
                <h2 className="mt-2 text-xl font-bold text-brand-900">{tr(r.career, 'name')}</h2>
                <p className="text-sm text-slate-500">{r.career.sector}</p>
              </div>
              <MatchRing value={r.matchPercent} />
            </div>

            <div className="mt-4">
              <p className="mb-1.5 font-semibold text-slate-700">{t('whyMatch')}</p>
              <ul className="space-y-1">
                {(lang === 'TA' ? r.reasonsTa : r.reasons).map((reason) => (
                  <li key={reason} className="flex gap-2 text-slate-700">
                    <span className="text-accent-600">✓</span> {reason}
                  </li>
                ))}
              </ul>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <div className="rounded-lg bg-surface p-2.5">
                <dt className="flex items-center gap-1 text-slate-500">
                  <Clock className="h-4 w-4" aria-hidden /> {t('training')}
                </dt>
                <dd className="font-semibold text-brand-900">{r.career.trainingDuration}</dd>
              </div>
              <div className="rounded-lg bg-surface p-2.5">
                <dt className="flex items-center gap-1 text-slate-500">
                  <IndianRupee className="h-4 w-4" aria-hidden /> {t('salary')}
                </dt>
                <dd className="font-semibold text-brand-900">
                  {rupeeRange(r.career.salaryMin, r.career.salaryMax)}
                  {t('perMonth')}
                </dd>
              </div>
              <div className="rounded-lg bg-surface p-2.5">
                <dt className="flex items-center gap-1 text-slate-500">
                  <TrendingUp className="h-4 w-4" aria-hidden /> {t('demand')}
                </dt>
                <dd className="font-semibold text-brand-900">{t(`demand${r.careerDemand}`)}</dd>
              </div>
            </dl>

            <details className="mt-4 rounded-lg border border-slate-200 p-3">
              <summary className="cursor-pointer font-semibold text-brand-700">{t('match')} %</summary>
              <div className="mt-3 space-y-2">
                {components.map(([field, label]) => (
                  <div key={field}>
                    <div className="flex justify-between text-sm">
                      <span>{t(label)}</span>
                      <span className="font-semibold">{r[field]}%</span>
                    </div>
                    <ProgressBar value={r[field]} tone="brand" className="h-2" />
                  </div>
                ))}
              </div>
            </details>

            <div className="mt-auto pt-5">
              <Button to={`/careers/${r.career.slug}`} className="w-full" variant={r.rank === 1 ? 'primary' : 'secondary'}>
                {t('viewCareer')}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
