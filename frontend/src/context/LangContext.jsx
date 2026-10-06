import { createContext, useContext, useEffect, useState } from 'react';
import { STRINGS } from '../lib/i18n';

const LANG_KEY = 'skillpath.lang';
const LangContext = createContext(null);

const readLang = () => {
  try {
    return localStorage.getItem(LANG_KEY) === 'TA' ? 'TA' : 'EN';
  } catch {
    return 'EN';
  }
};

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(readLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'TA' ? 'ta' : 'en';
  }, [lang]);

  const setLang = (next) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  };

  // t('key') or t('key', { name: 'Arun' }) — falls back to English, then to the key.
  const t = (key, vars) => {
    const entry = STRINGS[key];
    let text = entry ? entry[lang] || entry.EN : key;
    if (vars) Object.entries(vars).forEach(([k, v]) => (text = text.replaceAll(`{${k}}`, v)));
    return text;
  };

  // Picks the Tamil variant of a bilingual API field when available, e.g. tr(career, 'name').
  const tr = (obj, field) => {
    if (!obj) return '';
    if (lang === 'TA' && obj[`${field}Ta`]) return obj[`${field}Ta`];
    return obj[field];
  };

  return <LangContext.Provider value={{ lang, setLang, t, tr }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
