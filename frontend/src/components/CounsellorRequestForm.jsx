import { useState } from 'react';
import { CheckCircle2, Clock, Languages, MapPin, MessageSquareText, Tag } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { CONCERNS, DISTRICTS } from '../lib/i18n';
import { Alert, Button, ChoiceGroup, Field, inputCls } from './ui';

const TIMES = ['timeMorning', 'timeAfternoon', 'timeEvening'];

export default function CounsellorRequestForm({ defaults = {}, onSubmitted, onCancel }) {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [form, setForm] = useState({
    concern: defaults.concern || '',
    concernType: defaults.concernType || '',
    language: defaults.language || lang,
    location: defaults.location || user.district || '',
    preferredTime: 'timeEvening',
  });
  const [state, setState] = useState({ saving: false, error: null, done: null });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v && v.target ? v.target.value : v }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ saving: true, error: null, done: null });
    try {
      const res = await api.post('/counsellor/request', {
        concern: form.concern || undefined,
        concernType: form.concernType || undefined,
        conversationId: defaults.conversationId,
        language: form.language,
        location: form.location,
        preferredTime: t(form.preferredTime),
      });
      setState({ saving: false, error: null, done: res.data });
      if (onSubmitted) onSubmitted(res.data);
    } catch (err) {
      setState({ saving: false, error: errorMessage(err), done: null });
    }
  };

  if (state.done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-14 w-14 text-accent-600" aria-hidden />
        <p className="text-2xl font-bold text-brand-900">{t('requestSubmitted')}</p>
        <p className="text-slate-600">{t('requestSubmittedSub')}</p>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            {t('close')}
          </Button>
        )}
      </div>
    );
  }

  const concernOptions = [{ value: '', label: { EN: 'General', TA: 'பொது' } }, ...CONCERNS.map((c) => ({ value: c.type, label: c.label }))];

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label={t('concern')} icon={MessageSquareText}>
        <textarea
          className={`${inputCls} min-h-24`}
          value={form.concern}
          onChange={set('concern')}
          required={!defaults.conversationId}
          placeholder={lang === 'TA' ? 'உதா: பாதுகாப்பு பற்றி கவலையாக உள்ளது' : 'e.g. I am worried about safety'}
        />
      </Field>
      <Field label={t('concernType')} icon={Tag}>
        <select className={inputCls} value={form.concernType} onChange={set('concernType')}>
          {concernOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label[lang] || o.label.EN}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('language')} icon={Languages}>
        <ChoiceGroup
          lang={lang}
          columns="sm:grid-cols-2"
          value={form.language}
          onChange={set('language')}
          options={[
            { value: 'TA', label: { EN: 'தமிழ் (Tamil)', TA: 'தமிழ்' } },
            { value: 'EN', label: { EN: 'English', TA: 'ஆங்கிலம்' } },
          ]}
        />
      </Field>
      <Field label={t('district')} icon={MapPin}>
        <input className={inputCls} list="district-list" value={form.location} onChange={set('location')} />
        <datalist id="district-list">
          {DISTRICTS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </Field>
      <Field label={t('preferredTime')} icon={Clock}>
        <ChoiceGroup lang={lang} value={form.preferredTime} onChange={set('preferredTime')} options={TIMES.map((k) => ({ value: k, label: { EN: t(k), TA: t(k) } }))} />
      </Field>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="accent" size="lg" loading={state.saving}>
          {t('submitRequest')}
        </Button>
        {onCancel && (
          <Button variant="secondary" size="lg" onClick={onCancel}>
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  );
}
