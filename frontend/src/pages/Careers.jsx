import { Briefcase, Clock, Compass, IndianRupee, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import useApi from '../lib/useApi';
import { rupeeRange } from '../lib/format';
import { Badge, DataBadge, ErrorState, Loading, PageHeader } from '../components/ui';

export default function Careers() {
  const { user } = useAuth();
  const { t, tr } = useLang();
  const { data, loading, error, reload } = useApi('/careers', { params: { district: user && user.district } });

  return (
    <div className={user ? '' : 'mx-auto max-w-7xl px-4 py-8'}>
      <PageHeader icon={Compass} title={t('allCareers')} subtitle={t('careersSub')} />
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => (
            <Link
              key={c.id}
              to={`/careers/${c.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold text-brand-900 group-hover:text-brand-700">{tr(c, 'name')}</h2>
                <Badge tone={c.demandLevel === 'HIGH' ? 'teal' : 'slate'}>
                  <TrendingUp className="h-4 w-4" aria-hidden /> {t(`demand${c.demandLevel}`)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">{c.sector}</p>
              <p className="mt-2 line-clamp-2 text-slate-600">{tr(c, 'description')}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="h-4 w-4 text-brand-600" aria-hidden />
                  <dd>{c.trainingDuration}</dd>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <IndianRupee className="h-4 w-4 text-brand-600" aria-hidden />
                  <dd>
                    {rupeeRange(c.salaryMin, c.salaryMax)}
                    {t('perMonth')}
                  </dd>
                </div>
                {c.evidence.count > 0 && (
                  <div className="col-span-2 flex items-center gap-1.5 text-slate-600">
                    <Briefcase className="h-4 w-4 text-brand-600" aria-hidden />
                    <dd>
                      {t('placementRate')}: <span className="font-semibold text-brand-900">{c.evidence.placementRate}%</span>
                    </dd>
                  </div>
                )}
              </dl>
              {c.evidence.count > 0 && <DataBadge status={c.evidence.verificationStatus} className="mt-3 w-fit" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
