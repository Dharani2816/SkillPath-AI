const router = require('express').Router();
const prisma = require('../lib/prisma');
const { asyncHandler, HttpError, enumValue } = require('../lib/http');
const { requireAuth, requireRole } = require('../middleware/auth');
const { CONCERN_TYPES, LANGUAGES, REQUEST_STATUSES } = require('../lib/constants');
const { familyIdOf } = require('../services/family');

router.use(requireAuth);

const include = {
  user: { select: { id: true, name: true, email: true, phone: true, role: true, district: true } },
  family: { select: { id: true, name: true, district: true, decision: true } },
  counsellor: { select: { id: true, name: true } },
  conversation: { include: { messages: { orderBy: { createdAt: 'asc' } } } },
};

// { concern, concernType?, conversationId?, language?, location?, preferredTime? }
router.post(
  '/request',
  asyncHandler(async (req, res) => {
    const concernType = enumValue(req.body.concernType, CONCERN_TYPES, 'concernType');
    let conversationId = req.body.conversationId || null;
    let lastQuestion = null;
    if (conversationId) {
      const convo = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { where: { role: 'USER' }, orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      if (!convo) throw new HttpError(404, 'Conversation not found');
      lastQuestion = convo.messages[0] && convo.messages[0].content;
    }
    const concern = req.body.concern || lastQuestion;
    if (!concern) throw new HttpError(400, 'concern (text) or conversationId is required');
    const familyId = familyIdOf(req.user);

    const request = await prisma.counsellorRequest.create({
      data: {
        userId: req.user.id,
        familyId,
        conversationId,
        concernType,
        concern,
        language: enumValue(req.body.language, LANGUAGES, 'language') || req.user.language,
        location: req.body.location || req.user.district,
        preferredTime: req.body.preferredTime,
      },
      include,
    });
    if (familyId && concernType) {
      await prisma.familyConcern.updateMany({ where: { familyId, type: concernType, status: 'OPEN' }, data: { status: 'ESCALATED' } });
    }
    res.status(201).json(request);
  }),
);

// Counsellors/admins see the queue; families see their own requests.
router.get(
  '/requests',
  asyncHandler(async (req, res) => {
    const where = {};
    if (['STUDENT', 'PARENT'].includes(req.user.role)) {
      const familyId = familyIdOf(req.user);
      where.OR = [{ userId: req.user.id }, ...(familyId ? [{ familyId }] : [])];
    }
    if (req.query.status) where.status = enumValue(req.query.status, REQUEST_STATUSES, 'status');
    res.json(await prisma.counsellorRequest.findMany({ where, include, orderBy: { createdAt: 'desc' } }));
  }),
);

// { status, notes? } — the acting counsellor is assigned automatically.
router.patch(
  '/requests/:id',
  requireRole('COUNSELLOR', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const status = enumValue(req.body.status, REQUEST_STATUSES, 'status');
    const existing = await prisma.counsellorRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, 'Request not found');
    const updated = await prisma.counsellorRequest.update({
      where: { id: req.params.id },
      data: {
        ...(status ? { status } : {}),
        ...(req.body.notes !== undefined ? { notes: req.body.notes } : {}),
        counsellorId: existing.counsellorId || (req.user.role === 'COUNSELLOR' ? req.user.id : null),
      },
      include,
    });
    if (status === 'RESOLVED' && existing.familyId && existing.concernType) {
      await prisma.familyConcern.updateMany({
        where: { familyId: existing.familyId, type: existing.concernType, status: 'ESCALATED' },
        data: { status: 'ADDRESSED', resolvedAt: new Date() },
      });
    }
    res.json(updated);
  }),
);

module.exports = router;
