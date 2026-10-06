import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Sparkles } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useLang } from '../../context/LangContext';
import useApi from '../../lib/useApi';
import { Alert, Button, Card, ErrorState, Loading, PageHeader, ProgressBar } from '../../components/ui';

export default function Assessment() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { data: questions, loading, error, reload } = useApi('/assessment/questions');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submit, setSubmit] = useState({ loading: false, error: null });

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const total = questions.length;
  const q = questions[index];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;
  const isLast = index === total - 1;

  const choose = (optionId) => {
    setAnswers((a) => ({ ...a, [q.id]: optionId }));
    // Move on automatically — fewer taps for first-time users.
    if (!isLast) setTimeout(() => setIndex((i) => Math.min(i + 1, total - 1)), 250);
  };

  const analyze = async () => {
    setSubmit({ loading: true, error: null });
    try {
      await api.post('/assessment/submit', { answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })) });
      navigate('/results');
    } catch (err) {
      setSubmit({ loading: false, error: errorMessage(err) });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon={ClipboardList} title={t('assessmentTitle')} subtitle={t('assessmentIntro')} />
      <div className="mb-4">
        <div className="mb-2 flex justify-between text-sm font-semibold text-slate-600">
          <span>{t('questionOf', { n: index + 1, total })}</span>
          <span>{Math.round((answeredCount / total) * 100)}%</span>
        </div>
        <ProgressBar value={(answeredCount / total) * 100} />
      </div>

      <Card className="sm:p-8">
        <h2 className="text-xl font-bold leading-snug text-brand-900 sm:text-2xl">{lang === 'TA' ? q.textTa : q.textEn}</h2>
        <div className="mt-6 grid gap-3">
          {q.options.map((o, i) => {
            const selected = answers[q.id] === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => choose(o.id)}
                aria-pressed={selected}
                className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left text-lg transition-colors sm:p-5 ${
                  selected ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-slate-200 bg-white text-slate-800 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold ${selected ? 'bg-accent-600 text-white' : 'bg-brand-100 text-brand-800'}`}
                >
                  {selected ? <CheckCircle2 className="h-6 w-6" aria-hidden /> : String.fromCharCode(65 + i)}
                </span>
                <span className="font-medium">{lang === 'TA' ? o.textTa : o.textEn}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="secondary" icon={ArrowLeft} onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
            {t('back')}
          </Button>
          {!isLast && (
            <Button variant="secondary" onClick={() => setIndex((i) => i + 1)} disabled={!answers[q.id]}>
              {t('next')} <ArrowRight className="h-5 w-5" aria-hidden />
            </Button>
          )}
        </div>
      </Card>

      {/* Question dots let users jump back to any answer */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={t('questionOf', { n: i + 1, total })}
            className={`h-9 w-9 rounded-full text-sm font-bold ${
              i === index ? 'bg-brand-800 text-white' : answers[qq.id] ? 'bg-accent-100 text-accent-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {submit.error && (
        <div className="mt-4">
          <Alert tone="error">{submit.error}</Alert>
        </div>
      )}
      <div className="mt-6 flex justify-center">
        <Button size="lg" variant="accent" icon={Sparkles} onClick={analyze} disabled={!allAnswered} loading={submit.loading} className="w-full sm:w-auto">
          {submit.loading ? t('analyzing') : t('analyze')}
        </Button>
      </div>
    </div>
  );
}
