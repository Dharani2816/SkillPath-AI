import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, PhoneCall } from 'lucide-react';
import { useLang } from '../context/LangContext';
import useApi from '../lib/useApi';
import { CONCERNS } from '../lib/i18n';
import { L, shortDate } from '../lib/format';
import CounsellorRequestForm from '../components/CounsellorRequestForm';
import { Badge, Card, ErrorState, Loading, PageHeader } from '../components/ui';

const STATUS_TONE = { PENDING: 'amber', CONTACTED: 'blue', RESOLVED: 'teal' };

export function RequestList({ requests }) {
  const { t, lang } = useLang();
  if (!requests.length) return <p className="text-slate-500">{t('noRequests')}</p>;
  return (
    <ul className="space-y-3">
      {requests.map((r) => {
        const concern = CONCERNS.find((c) => c.type === r.concernType);
        return (
          <li key={r.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone="blue">{concern ? L(concern.label, lang) : t('general')}</Badge>
              <Badge tone={STATUS_TONE[r.status]}>{t(`status${r.status}`)}</Badge>
            </div>
            <p className="mt-2 text-slate-800">{r.concern}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden /> {shortDate(r.createdAt, lang)}
              </span>
              {r.preferredTime && <span>{r.preferredTime}</span>}
              {r.location && <span>{r.location}</span>}
              {r.counsellor && <span>· {r.counsellor.name}</span>}
            </p>
            {r.notes && <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm text-slate-600">{r.notes}</p>}
          </li>
        );
      })}
    </ul>
  );
}

export default function CounsellorRequest() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const requests = useApi('/counsellor/requests');
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <PageHeader icon={PhoneCall} title={t('requestTitle')} subtitle={t('requestSub')} />
        <Card>
          <CounsellorRequestForm
            key={formKey}
            defaults={{ concernType: params.get('concern') || '' }}
            onSubmitted={() => requests.reload()}
            onCancel={() => setFormKey((k) => k + 1)}
          />
        </Card>
      </div>
      <div>
        <h2 className="mb-3 mt-2 text-xl font-bold text-brand-900 lg:mt-16">{t('myRequests')}</h2>
        {requests.loading && <Loading />}
        {requests.error && <ErrorState error={requests.error} onRetry={requests.reload} />}
        {requests.data && <RequestList requests={requests.data} />}
      </div>
    </div>
  );
}
