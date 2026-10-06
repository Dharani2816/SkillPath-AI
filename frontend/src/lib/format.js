export const rupees = (n) => (n === null || n === undefined ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);

export const rupeeRange = (a, b) => `${rupees(a)} – ${rupees(b)}`;

export const shortDate = (d, lang) =>
  d ? new Date(d).toLocaleDateString(lang === 'TA' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// Picks the bilingual label object { EN, TA } for the current language.
export const L = (label, lang) => (label ? label[lang] || label.EN : '');
