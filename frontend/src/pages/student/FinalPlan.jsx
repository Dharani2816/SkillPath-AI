import { CheckCircle2, Circle, FileText, GraduationCap, Printer, Route, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import useApi from '../../lib/useApi';
import { rupees } from '../../lib/format';
import { defaultCareerId } from '../../components/CareerPicker';
import EvidenceCards from '../../components/EvidenceCards';
import RoadmapTimeline from '../../components/RoadmapTimeline';
import { Badge, Button, Card, Empty, ErrorState, Loading, MatchRing, PageHeader } from '../../components/ui';

const DECISION_TONE = { AGREED: 'teal', EXPLORING: 'blue', UNDECIDED: 'amber', DECLINED: 'red' };

function Section({ icon: Icon, title, children }) {
  return (
    <Card className="break-inside-avoid">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
        <Icon className="h-5 w-5 text-accent-600" aria-hidden /> {title}
      </h2>
      {children}
    </Card>
  );
}

export default function FinalPlan() {
  const { user } = useAuth();
  const { t, tr, lang } = useLang();
  const family = useApi('/family');
  const requests = useApi('/counsellor/requests');

  if (family.loading || requests.loading) return <Loading />;
  if (family.error) return <ErrorState error={family.error} onRetry={family.reload} />;

  const fam = family.data && family.data.id ? family.data : null;
  const student = fam && fam.students[0];
  const recs = (student && student.recommendations) || [];
  if (!recs.length) {
    return <Empty icon={FileText} title={t('noRecs')} action={user.role === 'STUDENT' ? <Button to="/assessment">{t('takeAssessment')}</Button> : null} />;
  }

  const rec = recs.find((r) => r.careerId === defaultCareerId(recs, fam));
  const career = rec.career;
  const courses = career.courses || [];
  const course = courses.find((c) => student.user.district && c.provider.district === student.user.district) || courses[0];
  const pending = (requests.data || []).some((r) => r.status !== 'RESOLVED');
  const decided = ['AGREED', 'DECLINED'].includes(fam.decision);
  const openConcerns = fam.concerns.filter((c) => c.status === 'OPEN').length;

  const steps = [
    { done: fam.parents.length > 0, text: t('stepConnectParent') },
    { done: fam.concerns.length > 0 && openConcerns === 0, text: t('stepDiscussConcerns') },
    ...(pending ? [{ done: false, text: t('stepPendingRequest') }] : []),
    { done: decided, text: t('stepDecide') },
    ...(course ? [{ done: false, text: t('stepEnrol', { provider: course.provider.name }) }] : []),
    { done: false, text: t('stepCertificate', { n: career.nsqfEntryLevel }) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={FileText}
        title={t('planTitle')}
        subtitle={`${student.user.name} · ${t('planSub')}`}
        actions={
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
            {t('print')}
          </Button>
        }
      />

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <MatchRing value={rec.overallScore} size={104} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-500">{t('recommendedCareer')}</p>
          <p className="text-2xl font-bold text-brand-900">{tr(career, 'name')}</p>
          <p className="text-slate-600">{tr(career, 'description')}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-semibold text-slate-500">{t('familyStatus')}</p>
          <Badge tone={DECISION_TONE[fam.decision]} className="mt-1 text-base">
            {t(`decision${fam.decision}`)}
          </Badge>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section icon={Sparkles} title={t('whyMatch')}>
          <ul className="space-y-1.5">
            {(lang === 'TA' ? rec.reasonsTa : rec.reasons).map((r) => (
              <li key={r} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" aria-hidden /> {r}
              </li>
            ))}
          </ul>
        </Section>
        <Section icon={GraduationCap} title={t('recommendedTraining')}>
          {course ? (
            <dl className="space-y-1.5">
              <dd className="text-lg font-semibold text-brand-900">{course.name}</dd>
              <dd className="text-slate-600">
                {course.provider.name}, {course.provider.district}
              </dd>
              <dd className="text-slate-600">
                {course.durationMonths} {t('months')} · {t('fee')}: {rupees(course.fee)} · {course.certification}
              </dd>
            </dl>
          ) : (
            <p className="text-slate-600">{career.trainingDuration}</p>
          )}
        </Section>
      </div>

      <Section icon={Users} title={t('careerEvidence')}>
        <EvidenceCards career={career} summary={rec.evidence} />
      </Section>

      <Section icon={TrendingUp} title={t('progression')}>
        <p className="font-medium text-slate-700">{career.careerProgression.join(' → ')}</p>
        <p className="mt-2 text-slate-600">
          {t('nsqfProgression')}: L{career.nsqfEntryLevel} → L{career.nsqfMaxLevel} · {t('furtherEducation')}: {career.furtherEducation.join('; ')}
        </p>
      </Section>

      <Section icon={Route} title={t('roadmapTitle')}>
        <RoadmapTimeline steps={rec.roadmap} career={career} compact />
      </Section>

      <Section icon={CheckCircle2} title={t('nextSteps')}>
        <ol className="space-y-2">
          {steps.map((s) => (
            <li key={s.text} className="flex items-center gap-3">
              {s.done ? <CheckCircle2 className="h-6 w-6 shrink-0 text-accent-600" aria-hidden /> : <Circle className="h-6 w-6 shrink-0 text-slate-300" aria-hidden />}
              <span className={s.done ? 'text-slate-500 line-through' : 'font-medium text-slate-800'}>{s.text}</span>
            </li>
          ))}
        </ol>
        <div className="no-print mt-4 flex flex-wrap gap-2">
          {!decided && <Button to="/family">{t('stepDecide')}</Button>}
          <Button variant="secondary" to="/ask">
            {t('navAsk')}
          </Button>
        </div>
      </Section>
    </div>
  );
}
