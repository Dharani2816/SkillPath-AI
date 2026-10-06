import { Award, Briefcase, CheckCircle2, ClipboardCheck, GraduationCap, Rocket } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { Badge } from './ui';

const STAGE_ICONS = { ASSESSMENT: ClipboardCheck, TRAINING: GraduationCap, CERTIFICATION: Award, FIRST_JOB: Briefcase, ADVANCED_ROLE: Rocket };

// Only the assessment stage is known to be complete in this prototype; the next stage is highlighted.
export const roadmapProgress = (steps) => {
  if (!steps || !steps.length) return { percent: 0, doneCount: 0, next: null };
  const doneCount = steps.filter((s) => s.stage === 'ASSESSMENT').length;
  return { percent: Math.round((doneCount / steps.length) * 100), doneCount, next: steps[doneCount] || null };
};

export default function RoadmapTimeline({ steps, career, compact = false }) {
  const { t, tr, lang } = useLang();
  if (!steps) return null;
  const { doneCount } = roadmapProgress(steps);

  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const Icon = STAGE_ICONS[step.stage] || CheckCircle2;
        const status = i < doneCount ? 'done' : i === doneCount ? 'next' : 'later';
        const last = i === steps.length - 1;
        return (
          <li key={step.stage} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && <span className={`absolute left-6 top-12 h-[calc(100%-3rem)] w-0.5 ${status === 'done' ? 'bg-accent-500' : 'bg-slate-200'}`} aria-hidden />}
            <div
              className={`relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 ${
                status === 'done'
                  ? 'border-accent-500 bg-accent-500 text-white'
                  : status === 'next'
                    ? 'border-brand-700 bg-brand-50 text-brand-800'
                    : 'border-slate-300 bg-white text-slate-400'
              }`}
            >
              {status === 'done' ? <CheckCircle2 className="h-6 w-6" aria-hidden /> : <Icon className="h-6 w-6" aria-hidden />}
            </div>
            <div className={`flex-1 rounded-xl border p-4 ${status === 'next' ? 'border-brand-300 bg-white shadow-sm' : 'border-slate-200 bg-white'}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-brand-900">{lang === 'TA' ? step.titleTa : step.title}</h3>
                <Badge tone={status === 'done' ? 'teal' : status === 'next' ? 'blue' : 'slate'}>
                  {t(status === 'done' ? 'stageDone' : status === 'next' ? 'stageNext' : 'stageLater')}
                </Badge>
                {step.nsqfLevel && <Badge tone="slate">{t('nsqfLevel', { n: step.nsqfLevel })}</Badge>}
              </div>
              <p className="mt-1 text-slate-600">{lang === 'TA' ? step.descriptionTa : step.description}</p>
              {!compact && (
                <p className="mt-2 text-sm text-slate-500">
                  <span className="font-semibold">{t('estDuration')}:</span> {step.duration}
                </p>
              )}
              {!compact && step.stage === 'TRAINING' && career && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-sm font-semibold text-slate-500">{t('requiredSkills')}:</span>
                  {career.skills.map((sk) => (
                    <Badge key={sk} tone="blue">
                      {sk}
                    </Badge>
                  ))}
                </div>
              )}
              {!compact && step.stage === 'ADVANCED_ROLE' && career && (
                <p className="mt-2 text-sm text-slate-500">
                  {tr(career, 'name')}: {career.careerProgression.join(' → ')}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
