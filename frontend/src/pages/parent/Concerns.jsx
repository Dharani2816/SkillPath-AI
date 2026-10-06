import { HeartHandshake, MessageCircle, PhoneCall, Plus } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import useApi from '../../lib/useApi';
import { CONCERNS } from '../../lib/i18n';
import { L, shortDate } from '../../lib/format';
import { ICONS } from '../../components/icons';
import { RequestList } from '../CounsellorRequest';
import { Badge, Button, Card, Empty, ErrorState, Loading, PageHeader } from '../../components/ui';

const STATUS_TONE = { OPEN: 'amber', ESCALATED: 'blue', ADDRESSED: 'teal' };

export default function Concerns() {
  const { t, tr, lang } = useLang();
  const family = useApi('/family');
  const requests = useApi('/counsellor/requests');

  if (family.loading || requests.loading) return <Loading />;
  if (family.error) return <ErrorState error={family.error} onRetry={family.reload} />;

  const fam = family.data && family.data.id ? family.data : null;
  if (!fam) return <Empty icon={HeartHandshake} title={t('connectSub')} action={<Button to="/family">{t('connect')}</Button>} />;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={HeartHandshake}
        title={t('concernsTitle')}
        subtitle={t('concernsSub')}
        actions={
          <Button variant="accent" icon={Plus} to="/family">
            {t('addConcern')}
          </Button>
        }
      />

      {fam.concerns.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {fam.concerns.map((c) => {
            const meta = CONCERNS.find((x) => x.type === c.type);
            const Icon = meta ? ICONS[meta.icon] : HeartHandshake;
            return (
              <Card key={c.id} className="flex items-start gap-4 p-4 sm:p-5">
                <span className="rounded-full bg-brand-100 p-3 text-brand-800">
                  <Icon className="h-7 w-7" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-brand-900">{meta ? L(meta.label, lang) : c.type}</p>
                    <Badge tone={STATUS_TONE[c.status]}>{t(`concernStatus${c.status}`)}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {c.career ? tr(c.career, 'name') : t('general')} · {shortDate(c.createdAt, lang)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" icon={MessageCircle} to={`/ask?concern=${c.type}${c.careerId ? `&career=${c.careerId}` : ''}`}>
                      {t('askAboutThis')}
                    </Button>
                    {c.status === 'OPEN' && (
                      <Button size="sm" variant="ghost" icon={PhoneCall} to={`/counsellor-request?concern=${c.type}`}>
                        {t('talkToCounsellor')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty icon={HeartHandshake} title={t('noConcerns')} action={<Button to="/family">{t('addConcern')}</Button>} />
      )}

      <Card>
        <h2 className="mb-3 text-lg font-bold text-brand-900">{t('myRequests')}</h2>
        {requests.error ? <ErrorState error={requests.error} onRetry={requests.reload} /> : <RequestList requests={requests.data || []} />}
      </Card>
    </div>
  );
}
