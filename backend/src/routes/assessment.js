const router = require('express').Router();
const prisma = require('../lib/prisma');
const { asyncHandler, HttpError } = require('../lib/http');
const { requireAuth, requireRole } = require('../middleware/auth');
const { QUESTIONS, TAG_LABELS } = require('../data/questions');
const { scoreAnswers, generateRecommendations } = require('../services/recommendation');

// Questions are returned without scoring tags so the test is not gamed.
router.get('/questions', (req, res) => {
  const lang = String(req.query.lang || 'EN').toUpperCase();
  res.json(
    QUESTIONS.map((q) => ({
      id: q.id,
      category: q.category,
      text: lang === 'TA' ? q.textTa : q.text,
      textEn: q.text,
      textTa: q.textTa,
      options: q.options.map((o) => ({ id: o.id, text: lang === 'TA' ? o.textTa : o.text, textEn: o.text, textTa: o.textTa })),
    })),
  );
});

router.post(
  '/submit',
  requireAuth,
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    const answers = req.body.answers;
    if (!Array.isArray(answers) || !answers.length) throw new HttpError(400, 'answers must be a non-empty array of { questionId, optionId }');
    const invalid = answers.filter(
      (a) => !QUESTIONS.some((q) => q.id === a.questionId && q.options.some((o) => o.id === a.optionId)),
    );
    if (invalid.length) throw new HttpError(400, 'Some answers reference unknown questions/options', invalid);

    const scores = scoreAnswers(answers);
    const assessment = await prisma.assessment.create({
      data: {
        userId: req.user.id,
        scores,
        answers: { create: answers.map((a) => ({ questionId: a.questionId, optionId: a.optionId })) },
      },
    });
    // Generate straight away so the learner sees results in one step.
    const recommendations = await generateRecommendations(req.user.id);
    res.status(201).json({ assessmentId: assessment.id, answered: answers.length, total: QUESTIONS.length, scores, recommendations });
  }),
);

const GROUPS = { interests: 'int_', aptitude: 'apt_', skills: 'sk_', workStyle: 'wp_', learning: 'lp_' };

// Latest assessment broken into labelled groups for the results screen.
// Parents see their linked child's latest assessment.
router.get(
  '/latest',
  requireAuth,
  asyncHandler(async (req, res) => {
    let userId = req.user.id;
    if (req.user.role === 'PARENT') {
      const familyId = req.user.parentProfile && req.user.parentProfile.familyId;
      const child = familyId && (await prisma.studentProfile.findFirst({ where: { familyId } }));
      if (!child) throw new HttpError(404, 'No linked student');
      userId = child.userId;
    }
    const assessment = await prisma.assessment.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { answers: true } });
    if (!assessment) return res.json({ completed: false, total: QUESTIONS.length });

    const scores = assessment.scores;
    const group = (prefix) =>
      Object.entries(scores)
        .filter(([tag]) => tag.startsWith(prefix))
        .map(([tag, score]) => ({ tag, score, label: TAG_LABELS[tag] }))
        .sort((a, b) => b.score - a.score);
    const groups = Object.fromEntries(Object.entries(GROUPS).map(([k, p]) => [k, group(p)]));
    const strengths = [...groups.aptitude, ...groups.skills].filter((s) => s.score >= 50).slice(0, 4);
    const top = (list, n) => list.slice(0, n).reduce((s, x) => s + x.score, 0) / Math.max(1, Math.min(n, list.length));
    // Readiness: how clearly the learner shows interest, aptitude and skill signals (0-100).
    const readiness = Math.round(0.4 * top(groups.interests, 1) + 0.35 * top(groups.aptitude, 3) + 0.25 * top(groups.skills, 2));

    res.json({
      completed: true,
      assessmentId: assessment.id,
      createdAt: assessment.createdAt,
      answered: assessment.answers.length,
      total: QUESTIONS.length,
      readiness,
      strengths,
      ...groups,
    });
  }),
);

module.exports = router;
