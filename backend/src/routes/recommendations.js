const router = require('express').Router();
const prisma = require('../lib/prisma');
const { asyncHandler, HttpError } = require('../lib/http');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generateRecommendations, WEIGHTS } = require('../services/recommendation');
const { summariseOutcomes, disclaimerFor } = require('../services/outcomes');

const LABEL = 'AI-assisted career matching (explainable weighted score; not a scientifically validated test)';

async function present(userId, district, lang) {
  const recs = await prisma.recommendation.findMany({
    where: { userId },
    orderBy: { rank: 'asc' },
    include: { career: { include: { outcomes: { include: { provider: true } } } } },
  });
  const roadmaps = await prisma.roadmap.findMany({ where: { userId } });
  return recs.map(({ career, ...r }) => {
    const { outcomes, ...careerInfo } = career;
    const evidence = summariseOutcomes(outcomes, district);
    return {
      ...r,
      matchPercent: r.overallScore,
      careerDemand: career.demandLevel,
      why: lang === 'TA' ? r.reasonsTa : r.reasons,
      career: careerInfo,
      evidence: { ...evidence, disclaimer: disclaimerFor(evidence, lang) },
      roadmap: (roadmaps.find((m) => m.careerId === career.id) || {}).steps || null,
    };
  });
}

// Parents (and counsellors) see the linked/requested student's results.
async function resolveStudent(req) {
  if (req.user.role === 'STUDENT') return req.user;
  if (req.user.role === 'PARENT') {
    const familyId = req.user.parentProfile && req.user.parentProfile.familyId;
    if (!familyId) throw new HttpError(400, 'Connect to your child first (POST /api/family/connect)');
    const student = await prisma.studentProfile.findFirst({ where: { familyId }, include: { user: true } });
    if (!student) throw new HttpError(404, 'No student linked to this family');
    return student.user;
  }
  if (!req.query.studentId) throw new HttpError(400, 'studentId query parameter is required');
  const user = await prisma.user.findFirst({ where: { id: String(req.query.studentId), role: 'STUDENT' } });
  if (!user) throw new HttpError(404, 'Student not found');
  return user;
}

router.post(
  '/generate',
  requireAuth,
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    const created = await generateRecommendations(req.user.id);
    if (!created) throw new HttpError(400, 'Complete the assessment first (POST /api/assessment/submit)');
    const lang = String(req.query.lang || req.user.language).toUpperCase();
    res.status(201).json({ method: LABEL, weights: WEIGHTS, recommendations: await present(req.user.id, req.user.district, lang) });
  }),
);

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const student = await resolveStudent(req);
    const lang = String(req.query.lang || req.user.language).toUpperCase();
    res.json({
      student: { id: student.id, name: student.name, district: student.district },
      method: LABEL,
      weights: WEIGHTS,
      recommendations: await present(student.id, student.district, lang),
    });
  }),
);

router.get(
  '/roadmaps',
  requireAuth,
  asyncHandler(async (req, res) => {
    const student = await resolveStudent(req);
    res.json(await prisma.roadmap.findMany({ where: { userId: student.id }, include: { career: { select: { id: true, name: true, nameTa: true } } } }));
  }),
);

module.exports = router;
