import { useMemo } from 'react';
import { BarChart3, FlaskConical, HeartHandshake, MessageCircle, PhoneCall, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLang } from '../context/LangContext';
import useApi from '../lib/useApi';
import { CONCERNS } from '../lib/i18n';
import { L } from '../lib/format';
import { Alert, Card, ErrorState, Loading, PageHeader, Stat } from '../components/ui';

const BAR_COLOR = '#2b5fa8'; // brand-500 — single series, magnitude
const SENTIMENT_COLORS = { CONCERNED: '#d97706', NEUTRAL: '#94a3b8', REASSURED: '#0f8a76' };

function ChartCard({ title, children, empty, emptyLabel }) {
  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold text-brand-900">{title}</h2>
      {empty ? <p className="py-10 text-center text-slate-500">{emptyLabel}</p> : <div className="overflow-x-auto">{children}</div>}
    </Card>
  );
}

export default function AdminDashboard() {
  const { t, lang } = useLang();
  const analytics = useApi('/admin/analytics');

  const concernLabel = (type) => {
    const c = CONCERNS.find((x) => x.type === type);
    return c ? L(c.label, lang) : type;
  };

  const concernChart = useMemo(() => {
    const rows = (analytics.data && analytics.data.concernsByType) || [];
    return rows.filter((r) => r.total > 0).map((r) => ({ name: L(r.label, lang), total: r.total }));
  }, [analytics.data, lang]);

  const tradeChart = useMemo(() => {
    const rows = (analytics.data && analytics.data.concernsByCareer) || [];
    return rows.slice(0, 8).map((r) => ({ name: r.career, count: r.count }));
  }, [analytics.data]);

  const districtRows = (analytics.data && analytics.data.resistanceByDistrict) || [];

  const sentimentSplit = useMemo(() => {
    const matrix = analytics.data && analytics.data.sentimentShift && analytics.data.sentimentShift.matrix;
    if (!matrix) return { before: [], after: [] };
    const cats = ['CONCERNED', 'NEUTRAL', 'REASSURED'];
    const before = cats.map((b) => ({ name: t(`sentiment${b}`), value: cats.reduce((sum, a) => sum + matrix[b][a], 0), key: b }));
    const after = cats.map((a) => ({ name: t(`sentiment${a}`), value: cats.reduce((sum, b) => sum + matrix[b][a], 0), key: a }));
    return { before, after };
  }, [analytics.data, t]);

  return (
    <div>
      <PageHeader icon={BarChart3} title={t('adminDashTitle')} subtitle={t('adminDashSub')} />
      {analytics.loading && <Loading />}
      {analytics.error && <ErrorState error={analytics.error} onRetry={analytics.reload} />}
      {analytics.data && (
        <div className="space-y-5">
          <Alert tone="warn" icon={FlaskConical}>
            {t('demoDataBanner')}
          </Alert>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat icon={Users} label={t('cardFamiliesCounselled')} value={analytics.data.overview.families} />
            <Stat icon={HeartHandshake} label={t('cardConcernsRaised')} value={analytics.data.overview.concerns} />
            <Stat
              icon={HeartHandshake}
              tone="teal"
              label={t('cardConcernsResolved')}
              value={analytics.data.overview.concerns - analytics.data.overview.unresolvedConcerns}
            />
            <Stat icon={PhoneCall} tone="amber" label={t('cardEscalations')} value={analytics.data.overview.counsellorRequests} />
            <Stat icon={MessageCircle} label={t('cardActiveConversations')} value={analytics.data.overview.conversations} />
          </div>

          <ChartCard title={t('whyResisting')} empty={!concernChart.length} emptyLabel={t('noData')}>
            <ResponsiveContainer width="100%" height={Math.max(220, concernChart.length * 44)}>
              <BarChart data={concernChart} layout="vertical" margin={{ left: 24, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="name" width={150} stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="total" name={t('cardConcernsRaised')} fill={BAR_COLOR} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title={t('whereResistance')} empty={!districtRows.length} emptyLabel={t('noData')}>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2 pr-2">{t('district')}</th>
                      <th className="py-2 pr-2">{t('family')}</th>
                      <th className="py-2 pr-2">{t('topConcern')}</th>
                      <th className="py-2">{t('resistanceIndex')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districtRows.map((row) => (
                      <tr key={row.district} className="border-b border-slate-100">
                        <td className="py-2 pr-2 font-medium text-slate-800">{row.district || '—'}</td>
                        <td className="py-2 pr-2 text-slate-600">{row.families}</td>
                        <td className="py-2 pr-2 text-slate-600">{row.topConcern ? concernLabel(row.topConcern) : '—'}</td>
                        <td className="py-2 font-semibold text-brand-800">{row.resistanceIndex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>

            <ChartCard title={t('byTrade')} empty={!tradeChart.length} emptyLabel={t('noData')}>
              <ResponsiveContainer width="100%" height={Math.max(220, tradeChart.length * 34)}>
                <BarChart data={tradeChart} layout="vertical" margin={{ left: 24, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} stroke="#64748b" fontSize={12} />
                  <YAxis type="category" dataKey="name" width={140} stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name={t('cardConcernsRaised')} fill={BAR_COLOR} radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title={t('sentimentShiftTitle')} empty={!sentimentSplit.before.some((b) => b.value)}>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: t('beforeCounselling'), rows: sentimentSplit.before },
                { label: t('afterCounselling'), rows: sentimentSplit.after },
              ].map((block) => (
                <div key={block.label}>
                  <p className="mb-2 text-center text-sm font-semibold text-slate-600">{block.label}</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={block.rows} margin={{ top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36}>
                        {block.rows.map((r) => (
                          <Cell key={r.key} fill={SENTIMENT_COLORS[r.key]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm text-slate-600">
              {Object.entries(SENTIMENT_COLORS).map(([key, color]) => (
                <span key={key} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  {t(`sentiment${key}`)}
                </span>
              ))}
            </div>
          </ChartCard>

          <ChartCard title={t('conversationsOverTime')} empty={!(analytics.data.conversationsLast14Days || []).length} emptyLabel={t('noData')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.data.conversationsLast14Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#14a38b" radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
