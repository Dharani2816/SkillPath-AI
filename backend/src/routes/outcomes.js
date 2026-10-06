const router = require('express').Router();
const prisma = require('../lib/prisma');
const { asyncHandler, HttpError } = require('../lib/http');
const { summariseOutcomes, disclaimerFor } = require('../services/outcomes');
const { findCareer } = require('./careers');

router.get(
  '/:careerId',
  asyncHandler(async (req, res) => {
    const lang = String(req.query.lang || 'EN').toUpperCase();
    const career = await findCareer(req.params.careerId);
    if (!career) throw new HttpError(404, 'Career not found');
    const where = { careerId: career.id };
    if (req.query.verifiedOnly === 'true') where.verificationStatus = 'VERIFIED';
    const outcomes = await prisma.outcomeData.findMany({ where, include: { provider: true }, orderBy: { placementRate: 'desc' } });
    const summary = summariseOutcomes(outcomes, req.query.district);
    res.json({
      career: { id: career.id, slug: career.slug, name: career.name, nameTa: career.nameTa },
      summary,
      disclaimer: disclaimerFor(summary, lang),
      outcomes,
    });
  }),
);

module.exports = router;
