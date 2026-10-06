const router = require('express').Router();
const prisma = require('../lib/prisma');
const { asyncHandler, HttpError, enumValue } = require('../lib/http');
const { requireAuth, requireRole } = require('../middleware/auth');
const { CONCERN_TYPES, FAMILY_DECISIONS } = require('../lib/constants');
const { familyIdOf, familyView } = require('../services/family');

router.use(requireAuth);

// Connect a parent and a student into one family.
// Parent: { connectCode } (code shown on the student's profile) or { studentEmail }.
// Student: { parentEmail } of an already-registered parent.
router.post(
  '/connect',
  requireRole('STUDENT', 'PARENT'),
  asyncHandler(async (req, res) => {
    const { connectCode, studentEmail, parentEmail } = req.body;
    let familyId;
    let parentProfileId;

    if (req.user.role === 'PARENT') {
      parentProfileId = req.user.parentProfile.id;
      if (connectCode) {
        const family = await prisma.family.findUnique({ where: { connectCode: String(connectCode).toUpperCase().trim() } });
        if (!family) throw new HttpError(404, 'No family found for this code');
        familyId = family.id;
      } else if (studentEmail) {
        const student = await prisma.user.findFirst({
          where: { email: String(studentEmail).toLowerCase().trim(), role: 'STUDENT' },
          include: { studentProfile: true },
        });
        if (!student) throw new HttpError(404, 'No student found with this email');
        familyId = student.studentProfile.familyId;
      } else {
        throw new HttpError(400, 'Provide connectCode or studentEmail');
      }
    } else {
      if (!parentEmail) throw new HttpError(400, 'Provide parentEmail');
      const parent = await prisma.user.findFirst({
        where: { email: String(parentEmail).toLowerCase().trim(), role: 'PARENT' },
        include: { parentProfile: true },
      });
      if (!parent) throw new HttpError(404, 'No parent account found with this email. Ask them to register first.');
      parentProfileId = parent.parentProfile.id;
      familyId = req.user.studentProfile.familyId;
    }

    await prisma.parentProfile.update({ where: { id: parentProfileId }, data: { familyId } });
    res.json(await familyView(familyId));
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const familyId = familyIdOf(req.user);
    if (!familyId) return res.json({ family: null, message: 'Not connected to a family yet' });
    res.json(await familyView(familyId));
  }),
);

// Parent (or student) selects one or more concerns: { concerns: ["INCOME", "SAFETY"], careerId?, details? }
router.post(
  '/concerns',
  requireRole('STUDENT', 'PARENT'),
  asyncHandler(async (req, res) => {
    const familyId = familyIdOf(req.user);
    if (!familyId) throw new HttpError(400, 'Connect to a family first');
    const list = req.body.concerns || (req.body.type ? [req.body.type] : []);
    if (!Array.isArray(list) || !list.length) throw new HttpError(400, 'concerns must be a non-empty array');
    const types = [...new Set(list.map((t) => enumValue(t, CONCERN_TYPES, 'concern')))];
    let careerId = req.body.careerId || null;
    if (careerId) {
      const career = await prisma.career.findFirst({ where: { OR: [{ id: careerId }, { slug: careerId }] } });
      if (!career) throw new HttpError(404, 'Career not found');
      careerId = career.id;
    }
    const created = await prisma.$transaction(
      types.map((type) =>
        prisma.familyConcern.create({
          data: { familyId, raisedById: req.user.id, careerId, type, details: req.body.details },
        }),
      ),
    );
    res.status(201).json(created);
  }),
);

// Record the family's decision: { decision: "AGREED", selectedCareerId }
router.patch(
  '/decision',
  requireRole('STUDENT', 'PARENT'),
  asyncHandler(async (req, res) => {
    const familyId = familyIdOf(req.user);
    if (!familyId) throw new HttpError(400, 'Connect to a family first');
    const data = {};
    if (req.body.decision) data.decision = enumValue(req.body.decision, FAMILY_DECISIONS, 'decision');
    if (req.body.selectedCareerId) {
      const career = await prisma.career.findFirst({ where: { OR: [{ id: req.body.selectedCareerId }, { slug: req.body.selectedCareerId }] } });
      if (!career) throw new HttpError(404, 'Career not found');
      data.selectedCareerId = career.id;
    }
    await prisma.family.update({ where: { id: familyId }, data });
    res.json(await familyView(familyId));
  }),
);

module.exports = router;
