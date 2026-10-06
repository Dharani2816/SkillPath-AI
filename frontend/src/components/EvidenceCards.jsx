import { Banknote, Briefcase, GraduationCap, TrendingUp } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { rupees, rupeeRange } from '../lib/format';
import { DataBadge, SourceLine } from './ui';

// The four facts parents ask about most, from a career + its outcome summary.
export default function EvidenceCards({ career, summary, highlight, compact = false, showSource = true }) {
  const { t } = useLang();
  if (!career) return null;
  const hasOutcomes = summary && summary.count > 0;
  const scope = hasOutcomes ? (summary.scope === 'DISTRICT' ? t('inDistrict', { district: summary.district }) : t('allDistricts')) : null;

  const cards = [
    {
      key: 'JOB_SECURITY',
      icon: Briefcase,
      label: t('placementRate'),
      value: hasOutcomes ? `${summary.placementRate}%` : '—',
      sub: hasOutcomes ? `${scope} · ${summary.sampleSize} ${t('learners')}` : null,
    },
    {
      key: 'INCOME',
      icon: Banknote,
      label: t('avgEarnings'),
      value: hasOutcomes ? `${rupees(summary.avgEarnings)}${t('perMonth')}` : `${rupees(career.salaryMin)}${t('perMonth')}`,
      sub: hasOutcomes ? `${t('earningsRange')}: ${rupeeRange(summary.earningsMin, summary.earningsMax)}` : null,
    },
    {
      key: 'TRAINING_COST',
      icon: GraduationCap,
      label: t('training'),
      value: career.trainingDuration,
      sub: `${t('fee')}: ${rupeeRange(career.trainingCostMin, career.trainingCostMax)}`,
    },
    {
      key: 'CAREER_GROWTH',
      icon: TrendingUp,
      label: t('nsqfProgression'),
      value: `L${career.nsqfEntryLevel} → L${career.nsqfMaxLevel}`,
      sub: `${rupees(career.salaryMin)} → ${rupees(career.salaryMax)}${t('perMonth')}`,
    },
  ];

  return (
    <div>
      <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'}`}>
        {cards.map(({ key, icon: Icon, label, value, sub }) => (
          <div
            key={key}
            className={`rounded-xl border p-3.5 ${highlight === key ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-500' : 'border-slate-200 bg-white'}`}
          >
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Icon className="h-5 w-5 text-brand-600" aria-hidden />
              {label}
            </div>
            <p className={`mt-1 font-bold text-brand-900 ${compact ? 'text-lg' : 'text-xl'}`}>{value}</p>
            {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
          </div>
        ))}
      </div>
      {showSource && hasOutcomes && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DataBadge status={summary.verificationStatus} />
          <SourceLine summary={summary} />
        </div>
      )}
    </div>
  );
}
