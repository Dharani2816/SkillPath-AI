import { useState } from 'react';
import { Route } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import useApi from '../../lib/useApi';
import CareerPicker, { defaultCareerId } from '../../components/CareerPicker';
import RoadmapTimeline, { roadmapProgress } from '../../components/RoadmapTimeline';
import { Button, Card, Empty, ErrorState, Loading, PageHeader, ProgressBar } from '../../components/ui';

export default function Roadmap() {
  const { user } = useAuth();
  const { t, tr, lang } = useLang();
  const recs = useApi('/recommendations');
  const family = useApi('/family');
  const [careerId, setCareerId] = useState(null);

  if (recs.loading || family.loading) return <Loading />;
  if (recs.error) return <ErrorState error={recs.error} onRetry={recs.reload} />;

  const list = recs.data.recommendations;
  if (!list.length) {
    return <Empty icon={Route} title={t('noRecs')} action={user.role === 'STUDENT' ? <Button to="/assessment">{t('takeAssessment')}</Button> : null} />;
  }
  const selected = careerId || defaultCareerId(list, family.data);
  const rec = list.find((r) => r.careerId === selected) || list[0];
  const progress = roadmapProgress(rec.roadmap);

  return (
    <div className="space-y-5">
      <PageHeader icon={Route} title={`${t('roadmapTitle')}: ${tr(rec.career, 'name')}`} subtitle={t('roadmapSub')} />
      <CareerPicker recommendations={list} value={rec.careerId} onChange={setCareerId} />
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-semibold text-slate-700">
            {progress.percent}% {t('complete')}
          </p>
          <ProgressBar value={progress.percent} className="mt-2" />
        </div>
        {progress.next && (
          <div className="rounded-xl bg-brand-50 px-4 py-3">
            <p className="text-sm text-slate-500">{t('nextStep')}</p>
            <p className="font-bold text-brand-900">{lang === 'TA' ? progress.next.titleTa : progress.next.title}</p>
          </div>
        )}
      </Card>
      <RoadmapTimeline steps={rec.roadmap} career={rec.career} />
    </div>
  );
}
