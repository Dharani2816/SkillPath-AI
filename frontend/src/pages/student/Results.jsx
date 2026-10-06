import { Award, BarChart3, ClipboardList, Heart, Sparkles, Target } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLang } from '../../context/LangContext';
import useApi from '../../lib/useApi';
import { Badge, Button, Card, Empty, ErrorState, Loading, PageHeader } from '../../components/ui';

function ScoreBars({ items, color, lang }) {
  const data = items.slice(0, 5).map((i) => ({ name: i.label[lang] || i.label.EN, score: i.score }));
  return (
    <div style={{ height: Math.max(160, data.length * 44) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="score" fill={color} radius={[0, 6, 6, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Results() {
  const { t, tr, lang } = useLang();
  const assessment = useApi('/assessment/latest');
  const recs = useApi('/recommendations');

  if (assessment.loading || recs.loading) return <Loading />;
  if (assessment.error || recs.error) return <ErrorState error={assessment.error || recs.error} onRetry={() => [assessment, recs].forEach((x) => x.reload())} />;

  const a = assessment.data;
  if (!a.completed) {
    return <Empty icon={ClipboardList} title={t('noAssessment')} action={<Button to="/assessment">{t('takeAssessment')}</Button>} />;
  }

  // Career domains = sectors of the top matches, with their match score.
  const domains = recs.data.recommendations.map((r) => ({ sector: r.career.sector, career: tr(r.career, 'name'), score: r.matchPercent }));

  return (
    <div className="space-y-5">
      <PageHeader
        icon={BarChart3}
        title={t('resultsTitle')}
        actions={
          <Button variant="accent" icon={Sparkles} to="/recommendations">
            {t('seeMatches')}
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center text-center">
          <h2 className="flex items-center gap-2 text-lg font-bold text-brand-900">
            <Target className="h-5 w-5 text-accent-600" aria-hidden /> {t('readiness')}
          </h2>
          <div className="relative h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: a.readiness }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={10} fill="#14a38b" background={{ fill: '#e2e8f0' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <span className="absolute inset-0 grid place-items-center text-4xl font-bold text-brand-900">{a.readiness}%</span>
          </div>
          <p className="text-sm text-slate-500">{t('readinessSub')}</p>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
            <Award className="h-5 w-5 text-accent-600" aria-hidden /> {t('strengths')}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {a.strengths.map((s) => (
              <div key={s.tag} className="flex items-center justify-between gap-2 rounded-xl bg-accent-50 px-4 py-3">
                <span className="font-semibold text-accent-700">{s.label[lang] || s.label.EN}</span>
                <span className="font-bold text-brand-900">{s.score}%</span>
              </div>
            ))}
          </div>
          <h3 className="mb-2 mt-5 font-semibold text-slate-700">{t('topDomains')}</h3>
          <div className="space-y-2">
            {domains.map((d) => (
              <div key={d.career} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3">
                <span>
                  <span className="font-semibold text-brand-900">{d.sector}</span> <span className="text-slate-500">· {d.career}</span>
                </span>
                <Badge tone="blue">
                  {d.score}% {t('match')}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
            <Heart className="h-5 w-5 text-accent-600" aria-hidden /> {t('interests')}
          </h2>
          <ScoreBars items={a.interests} color="#1f4f95" lang={lang} />
        </Card>
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
            <Sparkles className="h-5 w-5 text-accent-600" aria-hidden /> {t('aptitude')}
          </h2>
          <ScoreBars items={a.aptitude} color="#14a38b" lang={lang} />
        </Card>
      </div>
    </div>
  );
}
