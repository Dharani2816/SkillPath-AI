const router = require('express').Router();
const prisma = require('../lib/prisma');
const { asyncHandler, HttpError } = require('../lib/http');
const { requireAuth, requireRole } = require('../middleware/auth');
const { QUESTIONS } = require('../data/questions');
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

module.exports = router;
