import { useLang } from '../context/LangContext';

// Segmented picker over the learner's top-3 careers.
export default function CareerPicker({ recommendations, value, onChange }) {
  const { t, tr } = useLang();
  if (!recommendations || recommendations.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-semibold text-slate-600">{t('chooseCareer')}:</span>
      {recommendations.map((r) => (
        <button
          key={r.careerId}
          type="button"
          onClick={() => onChange(r.careerId)}
          aria-pressed={value === r.careerId}
          className={`rounded-full border-2 px-4 py-1.5 font-medium ${
            value === r.careerId ? 'border-brand-800 bg-brand-800 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
          }`}
        >
          {tr(r.career, 'name')} · {r.matchPercent}%
        </button>
      ))}
    </div>
  );
}

// Default career for the family: their chosen career if in the list, else the top match.
export const defaultCareerId = (recommendations, family) => {
  if (!recommendations || !recommendations.length) return null;
  const chosen = family && family.selectedCareerId;
  return chosen && recommendations.some((r) => r.careerId === chosen) ? chosen : recommendations[0].careerId;
};
