import { useParams } from 'react-router-dom';
import { BarChart3, BookOpenCheck, GraduationCap, HardHat, Layers, MessageCircle, Route, Sparkles, Users, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import useApi from '../lib/useApi';
import { rupees, rupeeRange } from '../lib/format';
import EvidenceCards from '../components/EvidenceCards';
import { Badge, Button, Card, DataBadge, ErrorState, Loading, MatchRing, PageHeader } from '../components/ui';

function Section({ icon: Icon, title, children }) {
  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
        <Icon className="h-5 w-5 text-accent-600" aria-hidden /> {title}
      </h2>
      {children}
    </Card>
  );
}

export default function CareerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, tr, lang } = useLang();
  const isFamily = user && ['STUDENT', 'PARENT'].includes(user.role);
  const { data: career, loading, error, reload } = useApi(`/careers/${id}`, { params: { district: user && user.district } });
  // AI match is only available once the learner has recommendations; a failure here is not an error for this page.
  const recs = useApi(isFamily ? '/recommendations' : null);
  const rec = career && recs.data && recs.data.recommendations.find((r) => r.careerId === career.id);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const nsqfSteps = [];
  for (let l = career.nsqfEntryLevel; l <= career.nsqfMaxLevel; l += 1) nsqfSteps.push(l);

  return (
    <div className={`space-y-5 ${user ? '' : 'mx-auto max-w-6xl px-4 py-8'}`}>
      <PageHeader
        icon={Wrench}
        title={tr(career, 'name')}
        subtitle={career.sector}
        actions={
          <>
            <Button variant="secondary" icon={BarChart3} to={`/careers/${career.slug}/evidence`}>
              {t('seeEvidence')}
            </Button>
            {isFamily && (
              <Button variant="accent" icon={MessageCircle} to={`/ask?career=${career.id}`}>
                {t('askAboutCareer')}
              </Button>
            )}
          </>
        }
      />

      <Card className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-lg text-slate-700">{tr(career, 'description')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={career.demandLevel === 'HIGH' ? 'teal' : 'slate'}>
              {t('demand')}: {t(`demand${career.demandLevel}`)}
            </Badge>
            <Badge tone="blue">
              {t('requiredEducation')}: {career.requiredEducation}
            </Badge>
          </div>
        </div>
        {rec && (
          <div className="flex items-center gap-3 rounded-xl bg-accent-50 p-3">
            <MatchRing value={rec.matchPercent} />
            <div>
              <p className="flex items-center gap-1 font-semibold text-accent-700">
                <Sparkles className="h-4 w-4" aria-hidden /> {t('aiMatch')}
              </p>
              <ul className="mt-1 max-w-56 text-sm text-slate-600">
                {(lang === 'TA' ? rec.reasonsTa : rec.reasons).slice(0, 3).map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>

      <Section icon={BarChart3} title={t('outcomeData')}>
        <EvidenceCards career={career} summary={career.evidence} />
        {career.evidence.disclaimer && <p className="mt-2 text-sm text-amber-700">{career.evidence.disclaimer}</p>}
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section icon={GraduationCap} title={t('training')}>
          <dl className="space-y-2">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{t('trainingDuration')}</dt>
              <dd className="font-semibold">{career.trainingDuration}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{t('trainingCost')}</dt>
              <dd className="font-semibold">{rupeeRange(career.trainingCostMin, career.trainingCostMax)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">
                {t('earnings')} ({t('entryToExperienced')})
              </dt>
              <dd className="font-semibold">
                {rupees(career.salaryMin)} → {rupees(career.salaryMax)}
                {t('perMonth')}
              </dd>
            </div>
          </dl>
          {career.courses.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 font-semibold text-slate-700">{t('courses')}</p>
              <ul className="space-y-2">
                {career.courses.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
                    <span>
                      <span className="font-semibold text-brand-900">{c.provider.name}</span> · {c.provider.district}
                    </span>
                    <span className="text-slate-600">
                      {c.durationMonths} {t('months')} · {rupees(c.fee)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <Section icon={Wrench} title={t('skills')}>
          <div className="flex flex-wrap gap-2">
            {career.skills.map((s) => (
              <Badge key={s} tone="blue" className="text-base">
                {s}
              </Badge>
            ))}
          </div>
        </Section>

        <Section icon={Route} title={t('progression')}>
          <ol className="space-y-2">
            {career.careerProgression.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">{i + 1}</span>
                <span className="font-medium">{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section icon={Layers} title={t('nsqfProgression')}>
          <div className="flex flex-wrap items-center gap-2">
            {nsqfSteps.map((l, i) => (
              <span key={l} className="flex items-center gap-2">
                <span className={`rounded-lg px-3 py-2 font-bold ${i === 0 ? 'bg-accent-600 text-white' : 'bg-brand-100 text-brand-800'}`}>L{l}</span>
                {i < nsqfSteps.length - 1 && <span className="text-slate-400">→</span>}
              </span>
            ))}
          </div>
          <p className="mt-3 text-slate-600">{career.nsqfInfo}</p>
        </Section>

        <Section icon={BookOpenCheck} title={t('furtherEducation')}>
          <ul className="space-y-1.5">
            {career.furtherEducation.map((f) => (
              <li key={f} className="flex gap-2">
                <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" aria-hidden /> {f}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={HardHat} title={t('safetyNote')}>
          <p className="text-slate-700">{tr(career, 'safetyNotes')}</p>
        </Section>

        <Section icon={Users} title={t('respectNote')}>
          <p className="text-slate-700">{tr(career, 'perceptionNotes')}</p>
        </Section>
      </div>

      {career.outcomes.length > 0 && (
        <div className="flex items-center gap-2">
          <DataBadge status={career.evidence.verificationStatus} />
          <Button variant="ghost" to={`/careers/${career.slug}/evidence`}>
            {t('seeEvidence')} →
          </Button>
        </div>
      )}
    </div>
  );
}
