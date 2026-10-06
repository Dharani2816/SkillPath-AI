import { useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import useApi from '../lib/useApi';
import { rupees, rupeeRange, shortDate } from '../lib/format';
import { Alert, Button, Card, DataBadge, ErrorState, Loading, PageHeader, SourceLine } from '../components/ui';

const BRAND = '#1f4f95';
const ACCENT = '#14a38b';

export function EvidenceView({ careerId }) {
  const { user } = useAuth();
  const { t, tr, lang } = useLang();
  const { data, loading, error, reload } = useApi(`/outcomes/${careerId}`, { params: { district: user && user.district, lang } });

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { summary, outcomes } = data;
  const chart = outcomes.map((o) => ({ district: o.district, placement: o.placementRate, earnings: o.avgEarnings }));
  const userDistrict = user && user.district;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={BarChart3}
        title={`${t('evidenceTitle')}: ${tr(data.career, 'name')}`}
        subtitle={t('evidenceSub')}
        actions={
          <Button variant="secondary" icon={ArrowLeft} to={`/careers/${data.career.slug}`}>
            {t('back')}
          </Button>
        }
      />

      {data.disclaimer && <Alert tone="warn">{data.disclaimer}</Alert>}

      {summary.count > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <p className="text-slate-500">{t('placementRate')}</p>
              <p className="text-3xl font-bold text-brand-900">{summary.placementRate}%</p>
              <p className="text-sm text-slate-500">{summary.scope === 'DISTRICT' ? t('inDistrict', { district: summary.district }) : t('allDistricts')}</p>
            </Card>
            <Card>
              <p className="text-slate-500">{t('avgEarnings')}</p>
              <p className="text-3xl font-bold text-brand-900">
                {rupees(summary.avgEarnings)}
                <span className="text-base font-medium text-slate-500">{t('perMonth')}</span>
              </p>
              <p className="text-sm text-slate-500">{rupeeRange(summary.earningsMin, summary.earningsMax)}</p>
            </Card>
            <Card>
              <p className="text-slate-500">{t('nextLevel')}</p>
              <p className="text-lg font-bold text-brand-900">{summary.nextProgressionLevel}</p>
              <p className="text-sm text-slate-500">
                {t('furtherEducation')}: {summary.furtherEducationRoute}
              </p>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-bold text-brand-900">
                {t('placementRate')} — {t('byDistrict')}
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="district" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="placement" name={t('placementRate')} fill={ACCENT} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <h2 className="mb-3 font-bold text-brand-900">
                {t('avgEarnings')} — {t('byDistrict')}
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="district" tick={{ fontSize: 12 }} interval={0} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip formatter={(v) => rupees(v)} />
                    <Bar dataKey="earnings" name={t('avgEarnings')} fill={BRAND} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="overflow-x-auto p-0 sm:p-0">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-surface text-sm text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('provider')}</th>
                  <th className="px-4 py-3">{t('district')}</th>
                  <th className="px-4 py-3">{t('placementRate')}</th>
                  <th className="px-4 py-3">{t('avgEarnings')}</th>
                  <th className="px-4 py-3">NSQF</th>
                  <th className="px-4 py-3">{t('learners')}</th>
                  <th className="px-4 py-3">{t('lastUpdated')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {outcomes.map((o) => (
                  <tr key={o.id} className={`border-t border-slate-100 ${userDistrict && o.district === userDistrict ? 'bg-accent-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-brand-900">{o.provider ? o.provider.name : '—'}</td>
                    <td className="px-4 py-3">{o.district}</td>
                    <td className="px-4 py-3 font-semibold">{o.placementRate}%</td>
                    <td className="px-4 py-3">{rupees(o.avgEarnings)}</td>
                    <td className="px-4 py-3">L{o.nsqfLevel}</td>
                    <td className="px-4 py-3">{o.sampleSize}</td>
                    <td className="px-4 py-3 text-sm">{shortDate(o.updatedAt, lang)}</td>
                    <td className="px-4 py-3">
                      <DataBadge status={o.verificationStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <SourceLine summary={summary} />
        </>
      ) : (
        <Alert tone="info">{lang === 'TA' ? 'இந்தத் தொழிலுக்கு இன்னும் முடிவுத் தரவு இல்லை.' : 'No outcome data is available for this career yet.'}</Alert>
      )}
    </div>
  );
}

export default function OutcomeEvidence() {
  const { id } = useParams();
  const { user } = useAuth();
  return (
    <div className={user ? '' : 'mx-auto max-w-6xl px-4 py-8'}>
      <EvidenceView careerId={id} />
    </div>
  );
}
