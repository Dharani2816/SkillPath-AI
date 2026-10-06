import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Compass,
  FileText,
  HeartHandshake,
  Home,
  LogOut,
  MessageCircle,
  PhoneCall,
  Route,
  Scale,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

const NAV = {
  STUDENT: [
    { to: '/dashboard', icon: Home, key: 'navHome' },
    { to: '/assessment', icon: ClipboardList, key: 'navAssessment' },
    { to: '/recommendations', icon: Sparkles, key: 'navRecommendations' },
    { to: '/roadmap', icon: Route, key: 'navRoadmap' },
    { to: '/family', icon: Users, key: 'navFamily' },
    { to: '/ask', icon: MessageCircle, key: 'navAsk' },
    { to: '/plan', icon: FileText, key: 'navPlan' },
    { to: '/profile', icon: UserRound, key: 'navProfile' },
  ],
  PARENT: [
    { to: '/dashboard', icon: Home, key: 'navHome' },
    { to: '/family', icon: Users, key: 'navFamily' },
    { to: '/evidence', icon: Scale, key: 'navEvidence' },
    { to: '/concerns', icon: HeartHandshake, key: 'navConcerns' },
    { to: '/ask', icon: MessageCircle, key: 'navAsk' },
    { to: '/counsellor-request', icon: PhoneCall, key: 'navCounsellor' },
    { to: '/profile', icon: UserRound, key: 'navProfile' },
  ],
  STAFF: [
    { to: '/dashboard', icon: Home, key: 'navHome' },
    { to: '/careers', icon: Compass, key: 'navCareers' },
  ],
};

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex rounded-xl border border-brand-200 bg-white p-1" role="group" aria-label="Language">
      {[
        ['EN', 'English'],
        ['TA', 'தமிழ்'],
      ].map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            lang === code ? 'bg-brand-800 text-white' : 'text-brand-800 hover:bg-brand-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-800 sm:h-10 sm:w-10">
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
          <path d="M6 23l7-7 4 4 9-11" stroke="#2dd4bf" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="whitespace-nowrap text-lg font-bold tracking-tight text-brand-900 sm:text-xl">
        SkillPath <span className="text-accent-600">AI</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />
          {user ? (
            <>
              <span className="hidden text-right text-sm md:block">
                <span className="block font-semibold text-brand-900">{user.name}</span>
                <span className="block text-slate-500">{user.role === 'PARENT' ? t('roleParent') : user.role === 'STUDENT' ? t('roleStudent') : user.role}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="h-5 w-5" aria-hidden />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/careers" className="hidden rounded-xl px-3 py-2 font-semibold text-brand-800 hover:bg-brand-50 md:inline-block">
                {t('exploreCareers')}
              </Link>
              <Link to="/login" className="rounded-xl bg-brand-800 px-4 py-2 font-semibold text-white hover:bg-brand-700">
                {t('login')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <Outlet />
    </div>
  );
}

export function AppLayout() {
  const { user } = useAuth();
  const { t } = useLang();
  const items = NAV[user.role] || NAV.STAFF;
  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
      isActive ? 'bg-brand-800 text-white' : 'text-slate-700 hover:bg-brand-50 hover:text-brand-800'
    }`;
  const tabCls = ({ isActive }) =>
    `flex w-[88px] shrink-0 flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-center text-xs font-medium leading-tight ${
      isActive ? 'bg-brand-800 text-white' : 'text-slate-600'
    }`;

  return (
    <div className="min-h-screen">
      <Header />
      {/* Mobile / tablet: icon tabs that scroll sideways */}
      <nav className="sticky top-[65px] z-20 border-b border-slate-200 bg-white lg:hidden" aria-label="Main">
        <div className="flex gap-1 overflow-x-auto px-2 py-2">
          {items.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} className={tabCls}>
              <Icon className="h-6 w-6" aria-hidden />
              <span className="line-clamp-2">{t(key)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <nav className="sticky top-24 hidden h-fit w-60 shrink-0 flex-col gap-1 lg:flex" aria-label="Main">
          {items.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} className={linkCls}>
              <Icon className="h-5 w-5" aria-hidden />
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
