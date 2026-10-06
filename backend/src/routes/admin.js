const router = require('express').Router();
const prisma = require('../lib/prisma');
const { asyncHandler } = require('../lib/http');
const { requireAuth, requireRole } = require('../middleware/auth');
const { CONCERN_TYPES, CONCERN_LABELS } = require('../lib/constants');

router.use(requireAuth, requireRole('ADMIN', 'COUNSELLOR'));

const SENTIMENT_RANK = { CONCERNED: 0, NEUTRAL: 1, REASSURED: 2 };
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
const countBy = (rows, key) => rows.reduce((acc, r) => ({ ...acc, [r[key] || 'UNKNOWN']: (acc[r[key] || 'UNKNOWN'] || 0) + 1 }), {});
const topKey = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

// Where (district, area type, income) and why (concern type, sentiment) family resistance is concentrated.
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const [families, concerns, sentiments, requests, conversations, usersByRole] = await Promise.all([
      prisma.family.findMany({ select: { id: true, district: true, areaType: true, householdIncome: true, decision: true } }),
      prisma.familyConcern.findMany({ include: { family: { select: { district: true, areaType: true, householdIncome: true } }, career: { select: { name: true } } } }),
      prisma.sentimentRecord.findMany(),
      prisma.counsellorRequest.findMany({ select: { status: true, concernType: true, location: true, language: true } }),
      prisma.conversation.findMany({ select: { createdAt: true, language: true } }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
    ]);

    const unresolved = (c) => c.status !== 'ADDRESSED';
    const improved = (s) => SENTIMENT_RANK[s.afterSentiment] > SENTIMENT_RANK[s.beforeSentiment];

    const concernsByType = CONCERN_TYPES.map((type) => {
      const rows = concerns.filter((c) => c.type === type);
      const sent = sentiments.filter((s) => s.concernType === type);
      return {
        type,
        label: CONCERN_LABELS[type],
        total: rows.length,
        open: rows.filter((c) => c.status === 'OPEN').length,
        escalated: rows.filter((c) => c.status === 'ESCALATED').length,
        addressed: rows.filter((c) => c.status === 'ADDRESSED').length,
        chatSessions: sent.length,
        reassuredRate: pct(sent.filter((s) => s.afterSentiment === 'REASSURED').length, sent.length),
        improvedRate: pct(sent.filter(improved).length, sent.length),
      };
    }).sort((a, b) => b.total - a.total);

    // Resistance index (0-100): unresolved concerns per family + share of chats that ended still concerned.
    const groupResistance = (key, sentimentKey) => {
      const groups = [...new Set(families.map((f) => f[key] || 'UNKNOWN'))];
      return groups
        .map((g) => {
          const fams = families.filter((f) => (f[key] || 'UNKNOWN') === g);
          const cons = concerns.filter((c) => (c.family[key] || 'UNKNOWN') === g);
          const sent = sentimentKey ? sentiments.filter((s) => (s[sentimentKey] || 'UNKNOWN') === g) : [];
          const stillConcerned = sent.filter((s) => s.afterSentiment === 'CONCERNED').length;
          const open = cons.filter(unresolved).length;
          const perFamily = fams.length ? open / fams.length : 0;
          const resistanceIndex = Math.round(Math.min(1, perFamily / 3) * 60 + (sent.length ? (stillConcerned / sent.length) * 40 : 0));
          return {
            [key]: g,
            families: fams.length,
            concerns: cons.length,
            unresolvedConcerns: open,
            topConcern: topKey(countBy(cons.filter(unresolved), 'type')),
            concernBreakdown: countBy(cons, 'type'),
            chatSessions: sent.length,
            stillConcernedRate: pct(stillConcerned, sent.length),
            declinedFamilies: fams.filter((f) => f.decision === 'DECLINED').length,
            resistanceIndex,
          };
        })
        .sort((a, b) => b.resistanceIndex - a.resistanceIndex);
    };

    const matrix = {};
    ['CONCERNED', 'NEUTRAL', 'REASSURED'].forEach((b) => {
      matrix[b] = { CONCERNED: 0, NEUTRAL: 0, REASSURED: 0 };
    });
    sentiments.forEach((s) => {
      matrix[s.beforeSentiment][s.afterSentiment] += 1;
    });

    const careerCounts = countBy(concerns.map((c) => ({ career: c.career ? c.career.name : 'General' })), 'career');
    const since = Date.now() - 14 * 24 * 3600 * 1000;
    const daily = {};
    conversations
      .filter((c) => c.createdAt.getTime() >= since)
      .forEach((c) => {
        const day = c.createdAt.toISOString().slice(0, 10);
        daily[day] = (daily[day] || 0) + 1;
      });

    res.json({
      generatedAt: new Date().toISOString(),
      dataNote: 'Prototype analytics over demo and live prototype data.',
      overview: {
        users: Object.fromEntries(usersByRole.map((r) => [r.role, r._count])),
        families: families.length,
        conversations: conversations.length,
        concerns: concerns.length,
        unresolvedConcerns: concerns.filter(unresolved).length,
        counsellorRequests: requests.length,
        pendingRequests: requests.filter((r) => r.status === 'PENDING').length,
        reassuredRate: pct(sentiments.filter((s) => s.afterSentiment === 'REASSURED').length, sentiments.length),
        improvedRate: pct(sentiments.filter(improved).length, sentiments.length),
      },
      concernsByType,
      resistanceByDistrict: groupResistance('district', 'district'),
      resistanceByAreaType: groupResistance('areaType'),
      resistanceByIncome: groupResistance('householdIncome'),
      sentimentShift: { total: sentiments.length, matrix },
      concernsByCareer: Object.entries(careerCounts).map(([career, count]) => ({ career, count })).sort((a, b) => b.count - a.count),
      escalations: { byStatus: countBy(requests, 'status'), byConcern: countBy(requests, 'concernType'), byLanguage: countBy(requests, 'language') },
      familyDecisions: countBy(families, 'decision'),
      conversationsByLanguage: countBy(conversations, 'language'),
      conversationsLast14Days: Object.entries(daily).sort().map(([date, count]) => ({ date, count })),
    });
  }),
);

module.exports = router;
