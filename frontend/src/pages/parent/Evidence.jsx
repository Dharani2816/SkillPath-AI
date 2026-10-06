import { useState } from 'react';
import { Scale } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import useApi from '../../lib/useApi';
import CareerPicker, { defaultCareerId } from '../../components/CareerPicker';
import { EvidenceView } from '../OutcomeEvidence';
import { Button, Empty, ErrorState, Loading } from '../../components/ui';

// Parent's "Career Evidence": outcome evidence for the family's recommended careers.
export default function ParentEvidence() {
  const { t } = useLang();
  const family = useApi('/family');
  const [careerId, setCareerId] = useState(null);

  if (family.loading) return <Loading />;
  if (family.error) return <ErrorState error={family.error} onRetry={family.reload} />;

  const fam = family.data && family.data.id ? family.data : null;
  const recs = (fam && fam.students[0] && fam.students[0].recommendations) || [];
  if (!recs.length) {
    return <Empty icon={Scale} title={fam ? t('notLinkedYet') : t('connectSub')} action={!fam && <Button to="/family">{t('connect')}</Button>} />;
  }
  const selected = careerId || defaultCareerId(recs, fam);

  return (
    <div className="space-y-4">
      <CareerPicker recommendations={recs.map((r) => ({ ...r, matchPercent: r.overallScore }))} value={selected} onChange={setCareerId} />
      <EvidenceView key={selected} careerId={selected} />
    </div>
  );
}
