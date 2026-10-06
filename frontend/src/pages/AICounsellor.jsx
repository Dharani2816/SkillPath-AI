import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, MessageCircle, PhoneCall, RotateCcw, Send, ThumbsDown, ThumbsUp, UserRound, Volume2, VolumeX } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import useApi from '../lib/useApi';
import { CONCERNS, SUGGESTED_TYPES } from '../lib/i18n';
import { L } from '../lib/format';
import CareerPicker, { defaultCareerId } from '../components/CareerPicker';
import CounsellorRequestForm from '../components/CounsellorRequestForm';
import EvidenceCards from '../components/EvidenceCards';
import Modal from '../components/Modal';
import { Alert, Badge, Button, Card, DataBadge, ErrorState, Loading, PageHeader } from '../components/ui';

const CONCERN_BY_TYPE = Object.fromEntries(CONCERNS.map((c) => [c.type, c]));

// Read-aloud for low-literacy users, shown only when the browser has a voice for the language.
function useSpeech(lang) {
  const [speakingId, setSpeakingId] = useState(null);
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, []);
  const prefix = lang === 'TA' ? 'ta' : 'en';
  const voice = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  const speak = (id, text) => {
    window.speechSynthesis.cancel();
    if (speakingId === id) return setSpeakingId(null);
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.95;
    u.onend = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(u);
    return undefined;
  };
  return { canSpeak: Boolean(voice), speak, speakingId };
}

function useCareerEvidence(district) {
  const [cache, setCache] = useState({});
  const ensure = async (careerId) => {
    if (!careerId || cache[careerId]) return;
    setCache((c) => ({ ...c, [careerId]: 'loading' }));
    try {
      const res = await api.get(`/careers/${careerId}`, { params: { district } });
      setCache((c) => ({ ...c, [careerId]: res.data }));
    } catch {
      setCache((c) => ({ ...c, [careerId]: null }));
    }
  };
  return { get: (id) => (cache[id] && cache[id] !== 'loading' ? cache[id] : null), ensure };
}

export default function AICounsellor() {
  const { user } = useAuth();
  const { t, tr, lang } = useLang();
  const [params, setParams] = useSearchParams();
  const family = useApi('/family');
  const [careerId, setCareerId] = useState(params.get('career'));
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [showEscalation, setShowEscalation] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const autoSent = useRef(false);
  const bottomRef = useRef(null);
  const evidence = useCareerEvidence(user.district);
  const { canSpeak, speak, speakingId } = useSpeech(lang);

  const fam = family.data && family.data.id ? family.data : null;
  const recs = (fam && fam.students[0] && fam.students[0].recommendations) || [];
  const activeCareerId = careerId || defaultCareerId(recs, fam);
  const activeRec = recs.find((r) => r.careerId === activeCareerId);

  useEffect(() => {
    bottomRef.current && bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const send = async (text, concernType) => {
    const message = text.trim();
    if (!message || sending) return;
    setError(null);
    setInput('');
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'USER', content: message }]);
    setSending(true);
    try {
      const res = await api.post('/ai/chat', {
        message,
        conversationId: conversationId || undefined,
        careerId: conversationId ? undefined : activeCareerId || undefined,
        concernType: concernType || undefined,
        language: lang,
      });
      const r = res.data;
      setConversationId(r.conversationId);
      if (r.sources && r.sources.careerId) evidence.ensure(r.sources.careerId);
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: 'ASSISTANT', content: r.reply, meta: r }]);
      if (r.needsEscalation || r.sentiment === 'CONCERNED') setShowEscalation(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  // Arriving from the Family Centre with a concern: ask its question straight away.
  useEffect(() => {
    const concern = params.get('concern');
    if (autoSent.current || family.loading || !concern || !CONCERN_BY_TYPE[concern]) return;
    autoSent.current = true;
    send(L(CONCERN_BY_TYPE[concern].q, lang), concern);
    setParams({ ...(careerId ? { career: careerId } : {}) }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family.loading]);

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    setFeedback({});
    setShowEscalation(false);
    setError(null);
  };

  const switchCareer = (id) => {
    setCareerId(id);
    newChat();
  };

  const giveFeedback = async (msg, helped) => {
    setFeedback((f) => ({ ...f, [msg.id]: helped ? 'yes' : 'no' }));
    if (!helped) setShowEscalation(true);
    try {
      await api.post('/ai/feedback', { conversationId: msg.meta.conversationId, sentiment: helped ? 'REASSURED' : 'CONCERNED' });
    } catch {
      /* feedback is best-effort; the chat keeps working */
    }
  };

  if (family.loading) return <Loading />;
  if (family.error) return <ErrorState error={family.error} onRetry={family.reload} />;

  const lastUser = [...messages].reverse().find((m) => m.role === 'USER');
  const lastAi = [...messages].reverse().find((m) => m.role === 'ASSISTANT');

  return (
    <div className="space-y-4">
      <PageHeader
        icon={MessageCircle}
        title={t('chatTitle')}
        subtitle={t('chatSub')}
        actions={
          <>
            <Button variant="secondary" icon={RotateCcw} onClick={newChat} disabled={!messages.length}>
              {t('newChat')}
            </Button>
            <Button variant="accent" icon={PhoneCall} onClick={() => setModalOpen(true)}>
              {t('talkToCounsellor')}
            </Button>
          </>
        }
      />

      {activeRec ? (
        <Card className="flex flex-col gap-3 p-4 sm:p-4">
          <p className="text-slate-600">
            {t('talkingAbout')}: <span className="font-bold text-brand-900">{tr(activeRec.career, 'name')}</span>
            {user.district && <span className="text-slate-500"> · {user.district}</span>}
          </p>
          <CareerPicker recommendations={recs.map((r) => ({ ...r, matchPercent: r.overallScore }))} value={activeCareerId} onChange={switchCareer} />
        </Card>
      ) : (
        <Alert tone="warn">{t('noCareerForChat')}</Alert>
      )}

      <Card className="flex flex-col p-0 sm:p-0">
        <div className="max-h-[62vh] min-h-[22rem] space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-600 text-white">
              <Bot className="h-6 w-6" aria-hidden />
            </span>
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-slate-800">{t('chatWelcome')}</div>
          </div>

          {messages.map((m) =>
            m.role === 'USER' ? (
              <div key={m.id} className="flex justify-end gap-3">
                <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-brand-800 px-4 py-3 text-white">{m.content}</div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-800">
                  <UserRound className="h-6 w-6" aria-hidden />
                </span>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-600 text-white">
                  <Bot className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0 max-w-[90%] flex-1 space-y-3">
                  <div className="whitespace-pre-line rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-slate-800">{m.content}</div>
                  {m.meta.concernType && CONCERN_BY_TYPE[m.meta.concernType] && (
                    <Badge tone="blue">{L(CONCERN_BY_TYPE[m.meta.concernType].label, lang)}</Badge>
                  )}
                  {m.meta.sources && evidence.get(m.meta.sources.careerId) && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-600">{t('evidenceUsed')}</p>
                        {m.meta.sources.dataLabel && <DataBadge status={m.meta.sources.dataLabel} />}
                      </div>
                      <EvidenceCards
                        career={evidence.get(m.meta.sources.careerId)}
                        summary={evidence.get(m.meta.sources.careerId).evidence}
                        highlight={m.meta.concernType}
                        compact
                        showSource={false}
                      />
                      {m.meta.sources.dataSources && m.meta.sources.dataSources.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                          {t('source')}: {m.meta.sources.dataSources.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {feedback[m.id] ? (
                      <span className="text-slate-500">{t('thanksFeedback')}</span>
                    ) : (
                      <>
                        <span className="text-slate-500">{t('didThisHelp')}</span>
                        <Button size="sm" variant="secondary" icon={ThumbsUp} onClick={() => giveFeedback(m, true)}>
                          {t('yesHelped')}
                        </Button>
                        <Button size="sm" variant="secondary" icon={ThumbsDown} onClick={() => giveFeedback(m, false)}>
                          {t('noHelped')}
                        </Button>
                      </>
                    )}
                    {canSpeak && (
                      <Button size="sm" variant="ghost" icon={speakingId === m.id ? VolumeX : Volume2} onClick={() => speak(m.id, m.content)}>
                        {speakingId === m.id ? t('stopListen') : t('listen')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ),
          )}

          {sending && (
            <div className="flex items-center gap-3 text-slate-500">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-100 text-accent-700">
                <Bot className="h-6 w-6 animate-pulse" aria-hidden />
              </span>
              {t('thinking')}
            </div>
          )}

          {showEscalation && !sending && (
            <div className="rounded-2xl border-2 border-accent-500 bg-accent-50 p-4">
              <p className="text-lg font-bold text-brand-900">{t('escalateTitle')}</p>
              <p className="mt-1 text-slate-600">{t('escalateSub')}</p>
              <Button variant="accent" size="lg" icon={PhoneCall} className="mt-3" onClick={() => setModalOpen(true)}>
                {t('talkToCounsellor')}
              </Button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-4 sm:p-5">
          <p className="mb-2 text-sm font-semibold text-slate-500">{t('suggested')}</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTED_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                disabled={sending}
                onClick={() => send(L(CONCERN_BY_TYPE[type].q, lang), type)}
                className="rounded-full border border-brand-200 bg-white px-4 py-2 text-left font-medium text-brand-800 hover:bg-brand-50 disabled:opacity-50"
              >
                {L(CONCERN_BY_TYPE[type].q, lang)}
              </button>
            ))}
          </div>
          {error && (
            <div className="mb-3">
              <Alert tone="error">{error}</Alert>
            </div>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('typeQuestion')}
              aria-label={t('typeQuestion')}
            />
            <Button type="submit" size="lg" icon={Send} disabled={!input.trim()} loading={sending}>
              <span className="hidden sm:inline">{t('send')}</span>
            </Button>
          </form>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('requestTitle')}>
        <CounsellorRequestForm
          key={conversationId || 'new'}
          defaults={{
            concern: lastUser ? lastUser.content : '',
            concernType: lastAi && lastAi.meta.concernType ? lastAi.meta.concernType : '',
            conversationId: conversationId || undefined,
            language: lang,
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
