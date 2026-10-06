import { Inbox } from 'lucide-react';
import { useLang } from '../context/LangContext';
import useApi from '../lib/useApi';
import { RequestList } from './CounsellorRequest';
import { Card, ErrorState, Loading, PageHeader } from '../components/ui';

// Counsellors and admins: read-only queue until their console is built in the next phase.
export default function StaffHome() {
  const { t } = useLang();
  const requests = useApi('/counsellor/requests');
  return (
    <div>
      <PageHeader icon={Inbox} title={t('staffTitle')} subtitle={t('staffSub')} />
      {requests.loading && <Loading />}
      {requests.error && <ErrorState error={requests.error} onRetry={requests.reload} />}
      {requests.data && (
        <Card>
          <RequestList requests={requests.data} />
        </Card>
      )}
    </div>
  );
}
