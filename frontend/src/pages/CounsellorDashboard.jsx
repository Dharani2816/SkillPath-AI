import { useMemo, useState } from 'react';
import { Inbox, MapPin, MessageSquareText, Phone, User } from 'lucide-react';
import { useLang } from '../context/LangContext';
import useApi from '../lib/useApi';
import api, { errorMessage } from '../api/client';
import { CONCERNS } from '../lib/i18n';
import { L, shortDate } from '../lib/format';
import Modal from '../components/Modal';
import { Alert, Badge, Button, Card, ErrorState, Loading, PageHeader, inputCls } from '../components/ui';

const STATUS_TONE = { PENDING: 'amber', CONTACTED: 'blue', RESOLVED: 'teal' };
const SENTIMENT_TONE = { CONCERNED: 'amber', NEUTRAL: 'slate', REASSURED: 'teal' };
const TABS = [
  { key: 'PENDING', labelKey: 'tabPending' },
  { key: 'CONTACTED', labelKey: 'tabActive' },
  { key: 'RESOLVED', labelKey: 'tabResolved' },
];

function latestSentiment(request) {
  const records = request.conversation && request.conversation.sentimentRecords;
  return records && records[0] ? records[0].afterSentiment : null;
}

function RequestCard({ request, lang, t, onView }) {
  const concern = CONCERNS.find((c) => c.type === request.concernType);
  const sentiment = latestSentiment(request);
  const career = request.conversation && request.conversation.career;
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="blue">{concern ? L(concern.label, lang) : t('general')}</Badge>
        <Badge tone={STATUS_TONE[request.status]}>{t(`status${request.status}`)}</Badge>
      </div>
      <p className="text-slate-800">{request.concern}</p>
      <dl className="grid grid-cols-2 gap-2 text-sm text-slate-600 sm:grid-cols-4">
        <div>
          <dt className="text-slate-400">{t('family')}</dt>
          <dd className="font-medium text-slate-700">{(request.family && request.family.name) || request.user.name}</dd>
        </div>
        <div>
          <dt className="text-slate-400">{t('district')}</dt>
          <dd className="font-medium text-slate-700">{request.location || '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-400">{t('language')}</dt>
          <dd className="font-medium text-slate-700">{request.language === 'TA' ? 'தமிழ்' : 'English'}</dd>
        </div>
        <div>
          <dt className="text-slate-400">{t('career')}</dt>
          <dd className="font-medium text-slate-700">{career ? (lang === 'TA' ? career.nameTa : career.name) : '—'}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-slate-500">{shortDate(request.createdAt, lang)}</span>
        {sentiment ? <Badge tone={SENTIMENT_TONE[sentiment]}>{t(`sentiment${sentiment}`)}</Badge> : <span className="text-sm text-slate-400">{t('noSentiment')}</span>}
      </div>
      <Button variant="secondary" size="sm" icon={MessageSquareText} onClick={() => onView(request)}>
        {t('viewRequest')}
      </Button>
    </Card>
  );
}

function RequestDetail({ request, onClose, onUpdated }) {
  const { t, lang } = useLang();
  const [notes, setNotes] = useState(request.notes || '');
  const [state, setState] = useState({ saving: null, error: null, saved: false });
  const messages = (request.conversation && request.conversation.messages) || [];
  const sentiment = latestSentiment(request);

  const patch = async (body, action) => {
    setState({ saving: action, error: null, saved: false });
    try {
      const res = await api.patch(`/counsellor/requests/${request.id}`, body);
      onUpdated(res.data);
      setState({ saving: null, error: null, saved: action === 'note' });
    } catch (err) {
      setState({ saving: null, error: errorMessage(err), saved: false });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONE[request.status]}>{t(`status${request.status}`)}</Badge>
        {sentiment && <Badge tone={SENTIMENT_TONE[sentiment]}>{t(`sentiment${sentiment}`)}</Badge>}
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="flex items-center gap-1 text-slate-400"><User className="h-4 w-4" aria-hidden />{t('family')}</dt>
          <dd className="font-medium text-slate-800">{(request.family && request.family.name) || request.user.name}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-slate-400"><MapPin className="h-4 w-4" aria-hidden />{t('district')}</dt>
          <dd className="font-medium text-slate-800">{request.location || '—'}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 text-slate-400"><Phone className="h-4 w-4" aria-hidden />{t('preferredTime')}</dt>
          <dd className="font-medium text-slate-800">{request.preferredTime || '—'}</dd>
        </div>
      </dl>
      <p className="rounded-xl bg-surface px-4 py-3 text-slate-700">{request.concern}</p>

      <div>
        <h3 className="mb-2 font-semibold text-brand-900">{t('conversationSummary')}</h3>
        {messages.length ? (
          <ul className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 text-sm">
            {messages.map((m) => (
              <li key={m.id} className={m.role === 'USER' ? 'text-slate-700' : 'text-brand-800'}>
                <span className="font-semibold">{m.role === 'USER' ? t('you') : t('appName')}: </span>
                {m.content}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">{t('noConversation')}</p>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-brand-900">{t('counsellorNotes')}</h3>
        <textarea className={`${inputCls} min-h-20`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('notePlaceholder')} />
        <Button className="mt-2" variant="secondary" size="sm" loading={state.saving === 'note'} onClick={() => patch({ notes }, 'note')}>
          {t('saveNote')}
        </Button>
        {state.saved && <span className="ml-2 text-sm text-accent-700">{t('noteSaved')}</span>}
      </div>

      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div className="flex flex-wrap gap-2 pt-2">
        {request.status === 'PENDING' && (
          <Button variant="accent" loading={state.saving === 'contacted'} onClick={() => patch({ status: 'CONTACTED', notes }, 'contacted')}>
            {t('markContacted')}
          </Button>
        )}
        {request.status !== 'RESOLVED' && (
          <Button variant="primary" loading={state.saving === 'resolved'} onClick={() => patch({ status: 'RESOLVED', notes }, 'resolved')}>
            {t('markResolved')}
          </Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          {t('close')}
        </Button>
      </div>
    </div>
  );
}

export default function CounsellorDashboard() {
  const { t, lang } = useLang();
  const requests = useApi('/counsellor/requests');
  const [tab, setTab] = useState('PENDING');
  const [active, setActive] = useState(null);

  const grouped = useMemo(() => {
    const data = requests.data || [];
    return TABS.reduce((acc, tb) => ({ ...acc, [tb.key]: data.filter((r) => r.status === tb.key) }), {});
  }, [requests.data]);

  const updateOne = (updated) => {
    requests.setData((requests.data || []).map((r) => (r.id === updated.id ? updated : r)));
    setActive(updated);
  };

  return (
    <div>
      <PageHeader icon={Inbox} title={t('counsellorDashTitle')} subtitle={t('counsellorDashSub')} />
      {requests.loading && <Loading />}
      {requests.error && <ErrorState error={requests.error} onRetry={requests.reload} />}
      {requests.data && (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {TABS.map((tb) => (
              <button
                key={tb.key}
                type="button"
                onClick={() => setTab(tb.key)}
                aria-pressed={tab === tb.key}
                className={`rounded-xl px-4 py-2 font-semibold transition-colors ${
                  tab === tb.key ? 'bg-brand-800 text-white' : 'bg-white text-brand-800 border border-brand-200 hover:bg-brand-50'
                }`}
              >
                {t(tb.labelKey)} ({(grouped[tb.key] || []).length})
              </button>
            ))}
          </div>
          {(grouped[tab] || []).length === 0 ? (
            <Card className="text-slate-500">{t('noRequestsInTab')}</Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {grouped[tab].map((r) => (
                <RequestCard key={r.id} request={r} lang={lang} t={t} onView={setActive} />
              ))}
            </div>
          )}
        </>
      )}
      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={t('requestDetails')}>
        {active && <RequestDetail request={active} onClose={() => setActive(null)} onUpdated={updateOne} />}
      </Modal>
    </div>
  );
}
