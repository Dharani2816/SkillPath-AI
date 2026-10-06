import { ArrowRight, BadgeCheck, ClipboardList, Compass, FlaskConical, MessagesSquare, Scale, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Button } from '../components/ui';

export default function Landing() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const start = user ? '/dashboard' : '/register';

  const features = [
    { icon: MessagesSquare, title: t('featAiTitle'), text: t('featAiText') },
    { icon: BadgeCheck, title: t('featEvidenceTitle'), text: t('featEvidenceText') },
    { icon: Users, title: t('featFamilyTitle'), text: t('featFamilyText') },
  ];
  const steps = [
    { icon: ClipboardList, text: t('step1') },
    { icon: Sparkles, text: t('step2') },
    { icon: Scale, text: t('step3') },
    { icon: Users, text: t('step4') },
  ];

  return (
    <main>
      <section className="bg-gradient-to-b from-brand-900 to-brand-800 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-accent-100">
              <Users className="h-4 w-4" aria-hidden /> {t('tagline')}
            </p>
            <h1 className={`font-bold leading-tight ${lang === "TA" ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"}`}>{t("heroTitle")}</h1>
            <p className="mt-5 max-w-2xl text-lg text-brand-100 sm:text-xl">{t('heroSubtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to={start} variant="accent" size="lg" icon={ArrowRight}>
                {t('startCounselling')}
              </Button>
              <Button to="/careers" size="lg" icon={Compass} className="border border-white/30 bg-white/10 text-white hover:bg-white/20">
                {t('exploreCareers')}
              </Button>
            </div>
          </div>

          {/* A small, real-looking preview of a family conversation */}
          <div className="rounded-2xl bg-white p-5 text-slate-800 shadow-2xl" aria-hidden>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-800">
              <MessagesSquare className="h-5 w-5" /> {t('chatTitle')}
            </div>
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-800 px-4 py-2.5 text-white">இந்த வேலைக்கு நல்ல எதிர்காலம் இருக்குமா?</div>
            <div className="mt-3 max-w-[90%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5">
              {t('featEvidenceText')}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {[t('placementRate'), t('earnings'), t('training'), t('nsqfProgression')].map((label) => (
                <span key={label} className="rounded-full border border-slate-200 px-3 py-1 font-medium text-brand-800">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 w-fit rounded-xl bg-accent-50 p-3 text-accent-700">
                <Icon className="h-7 w-7" aria-hidden />
              </div>
              <h2 className="text-xl font-bold text-brand-900">{title}</h2>
              <p className="mt-2 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-3xl font-bold text-brand-900">{t('familyLine')}</h2>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">{t('familyLineSub')}</p>
          <h3 className="mt-10 text-lg font-semibold text-brand-800">{t('howItWorks')}</h3>
          <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, text }, i) => (
              <li key={text} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-surface p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-800 font-bold text-white">{i + 1}</span>
                <div>
                  <Icon className="mb-1 h-5 w-5 text-accent-600" aria-hidden />
                  <p className="font-medium text-slate-700">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button to={start} variant="primary" size="lg" icon={ArrowRight}>
              {t('startCounselling')}
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-6 text-sm text-slate-500">
          <FlaskConical className="h-4 w-4" aria-hidden /> {t('demoNotice')}
        </div>
      </footer>
    </main>
  );
}
