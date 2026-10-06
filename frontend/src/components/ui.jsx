import { Link } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, FlaskConical, Loader2 } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { errorMessage } from '../api/client';
import { shortDate } from '../lib/format';

const BUTTON_VARIANTS = {
  primary: 'bg-brand-800 text-white hover:bg-brand-700 disabled:bg-brand-300',
  accent: 'bg-accent-600 text-white hover:bg-accent-700 disabled:bg-accent-100 disabled:text-accent-600',
  secondary: 'bg-white text-brand-800 border border-brand-200 hover:bg-brand-50 disabled:text-slate-400',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
};
const BUTTON_SIZES = { md: 'px-4 py-2.5 text-base', lg: 'px-6 py-3.5 text-lg', sm: 'px-3 py-1.5 text-sm' };

export function Button({ variant = 'primary', size = 'md', to, icon: Icon, className = '', children, loading, disabled, ...props }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`;
  const content = (
    <>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...props} disabled={loading || disabled}>
      {content}
    </button>
  );
}

export function Card({ className = '', children, as: Tag = 'div', ...props }) {
  return (
    <Tag className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-1 rounded-xl bg-brand-100 p-2.5 text-brand-800">
            <Icon className="h-6 w-6" aria-hidden />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2 no-print">{actions}</div>}
    </div>
  );
}

export function Loading({ label }) {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-brand-700" role="status">
      <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
      <span className="text-lg">{label || t('loading')}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t } = useLang();
  return (
    <Card className="border-red-200 bg-red-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold text-red-800">{t('errorTitle')}</p>
          <p className="mt-1 text-red-700">{errorMessage(error)}</p>
          {onRetry && (
            <Button variant="danger" size="sm" className="mt-3" onClick={onRetry}>
              {t('retry')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function Alert({ tone = 'info', children, icon: Icon }) {
  const tones = {
    info: 'bg-brand-50 border-brand-200 text-brand-800',
    success: 'bg-accent-50 border-accent-100 text-accent-700',
    warn: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${tones[tone]}`} role={tone === 'error' ? 'alert' : undefined}>
      {Icon && <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />}
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function Empty({ icon: Icon, title, action }) {
  return (
    <Card className="flex flex-col items-center gap-4 py-12 text-center">
      {Icon && (
        <div className="rounded-full bg-brand-50 p-4 text-brand-700">
          <Icon className="h-8 w-8" aria-hidden />
        </div>
      )}
      <p className="max-w-md text-lg text-slate-700">{title}</p>
      {action}
    </Card>
  );
}

export function Badge({ tone = 'slate', children, className = '' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-brand-100 text-brand-800',
    teal: 'bg-accent-100 text-accent-700',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold ${tones[tone]} ${className}`}>{children}</span>;
}

// VERIFIED vs DEMO DATA — shown wherever outcome numbers appear.
export function DataBadge({ status, className = '' }) {
  const { t } = useLang();
  if (status === 'VERIFIED') {
    return (
      <Badge tone="teal" className={className}>
        <BadgeCheck className="h-4 w-4" aria-hidden /> {t('verified')}
      </Badge>
    );
  }
  return (
    <Badge tone="amber" className={className}>
      <FlaskConical className="h-4 w-4" aria-hidden /> {t('demoData')}
    </Badge>
  );
}

export function SourceLine({ summary }) {
  const { t, lang } = useLang();
  if (!summary || !summary.count) return null;
  return (
    <p className="text-sm text-slate-500">
      {t('source')}: {(summary.dataSources || []).join(', ')} · {t('dataYear')}: {summary.dataYear} · {t('lastUpdated')}: {shortDate(summary.lastUpdated, lang)}
    </p>
  );
}

export function Stat({ icon: Icon, label, value, sub, tone = 'blue' }) {
  const tones = { blue: 'bg-brand-50 text-brand-800', teal: 'bg-accent-50 text-accent-700', amber: 'bg-amber-50 text-amber-800' };
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
      {Icon && (
        <div className={`rounded-lg p-2 ${tones[tone]}`}>
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-bold text-brand-900">{value}</p>
        {sub && <p className="text-sm text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export function ProgressBar({ value, className = '', tone = 'accent' }) {
  const color = tone === 'accent' ? 'bg-accent-500' : 'bg-brand-600';
  return (
    <div className={`h-3 w-full overflow-hidden rounded-full bg-slate-200 ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function MatchRing({ value, size = 88 }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" role="img" aria-label={`${value}%`}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="var(--color-accent-500)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        transform="rotate(-90 44 44)"
      />
      <text x="44" y="50" textAnchor="middle" className="fill-brand-900" style={{ fontSize: 20, fontWeight: 700 }}>
        {value}%
      </text>
    </svg>
  );
}

// Large tap-friendly single-choice buttons used instead of dropdowns.
export function ChoiceGroup({ options, value, onChange, lang, columns = 'sm:grid-cols-3', iconMap = {} }) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${columns}`}>
      {options.map((o) => {
        const active = value === o.value;
        const Icon = iconMap[o.icon];
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-base font-medium transition-colors ${
              active ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
            }`}
          >
            {Icon && <Icon className="h-5 w-5" aria-hidden />}
            {o.label[lang] || o.label.EN}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, icon: Icon, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 font-semibold text-slate-700">
        {Icon && <Icon className="h-5 w-5 text-brand-600" aria-hidden />}
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-sm text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200';
