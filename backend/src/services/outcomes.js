const { DEMO_DISCLAIMER } = require('../lib/constants');

// Aggregates outcome rows, preferring the learner's district, then falling back to all rows.
function summariseOutcomes(outcomes, district) {
  const local = district ? outcomes.filter((o) => o.district.toLowerCase() === district.toLowerCase()) : [];
  const rows = local.length ? local : outcomes;
  if (!rows.length) return { count: 0, scope: 'NONE' };

  const weight = (o) => o.sampleSize || 1;
  const totalW = rows.reduce((s, o) => s + weight(o), 0);
  const wavg = (field) => rows.reduce((s, o) => s + o[field] * weight(o), 0) / totalW;

  return {
    count: rows.length,
    scope: local.length ? 'DISTRICT' : 'STATE',
    district: local.length ? district : null,
    placementRate: Math.round(wavg('placementRate')),
    avgEarnings: Math.round(wavg('avgEarnings') / 100) * 100,
    earningsMin: Math.min(...rows.map((o) => o.earningsMin)),
    earningsMax: Math.max(...rows.map((o) => o.earningsMax)),
    sampleSize: rows.reduce((s, o) => s + (o.sampleSize || 0), 0),
    providers: [...new Set(rows.map((o) => o.provider && o.provider.name).filter(Boolean))],
    nextProgressionLevel: rows[0].nextProgressionLevel,
    furtherEducationRoute: rows[0].furtherEducationRoute,
    isDemo: rows.some((o) => o.verificationStatus === 'DEMO'),
    dataSources: [...new Set(rows.map((o) => o.dataSource))],
    dataYear: Math.max(...rows.map((o) => o.dataYear)),
    lastUpdated: rows.reduce((m, o) => (o.updatedAt && (!m || o.updatedAt > m) ? o.updatedAt : m), null),
    verificationStatus: rows.every((o) => o.verificationStatus === 'VERIFIED') ? 'VERIFIED' : 'DEMO',
  };
}

const disclaimerFor = (summary, lang = 'EN') => (summary.isDemo ? DEMO_DISCLAIMER[lang] || DEMO_DISCLAIMER.EN : null);

module.exports = { summariseOutcomes, disclaimerFor };
