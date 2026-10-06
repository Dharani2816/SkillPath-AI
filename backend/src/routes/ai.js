const router = require('express').Router();
const prisma = require('../lib/prisma');
const { asyncHandler, HttpError, enumValue } = require('../lib/http');
const { requireAuth } = require('../middleware/auth');
const { CONCERN_TYPES, LANGUAGES } = require('../lib/constants');
const ai = require('../services/ai');
const llm = require('../services/ai/llmProvider');
const { familyIdOf } = require('../services/family');

router.use(requireAuth);

router.get('/status', (req, res) => res.json({ provider: llm.providerName(), llmEnabled: llm.isEnabled() }));

// { message, conversationId?, careerId?, concernType?, language? }
router.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const result = await ai.chat(req.user, {
      message: req.body.message,
      conversationId: req.body.conversationId,
      careerId: req.body.careerId,
      concernType: enumValue(req.body.concernType, CONCERN_TYPES, 'concernType'),
      language: enumValue(req.body.language, LANGUAGES, 'language'),
    });
    res.json(result);
  }),
);

// { conversationId, sentiment: "REASSURED" | "NEUTRAL" | "CONCERNED" } — e.g. from a 👍 / 👎 button
router.post(
  '/feedback',
  asyncHandler(async (req, res) => {
    const sentiment = enumValue(req.body.sentiment, ['CONCERNED', 'NEUTRAL', 'REASSURED'], 'sentiment');
    if (!sentiment) throw new HttpError(400, 'sentiment is required');
    res.json(await ai.feedback(req.user, { conversationId: req.body.conversationId, sentiment }));
  }),
);

router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const familyId = familyIdOf(req.user);
    const conversations = await prisma.conversation.findMany({
      where: familyId ? { OR: [{ userId: req.user.id }, { familyId }] } : { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } }, sentimentRecords: true, user: { select: { name: true, role: true } } },
    });
    res.json(conversations);
  }),
);

module.exports = router;
