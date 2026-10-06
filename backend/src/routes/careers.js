const router = require('express').Router();
const prisma = require('../lib/prisma');
const { asyncHandler, HttpError } = require('../lib/http');
const { summariseOutcomes, disclaimerFor } = require('../services/outcomes');

const findCareer = (idOrSlug, include) =>
  prisma.career.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }, include });

// Careers are public so families can browse before signing up.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const lang = String(req.query.lang || 'EN').toUpperCase();
    const careers = await prisma.career.findMany({ include: { outcomes: true }, orderBy: { name: 'asc' } });
    res.json(
      careers.map(({ outcomes, ...c }) => {
        const evidence = summariseOutcomes(outcomes, req.query.district);
        return {
          ...c,
          displayName: lang === 'TA' ? c.nameTa : c.name,
          displayDescription: lang === 'TA' ? c.descriptionTa : c.description,
          evidence: { ...evidence, disclaimer: disclaimerFor(evidence, lang) },
        };
      }),
    );
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const lang = String(req.query.lang || 'EN').toUpperCase();
    const career = await findCareer(req.params.id, {
      outcomes: { include: { provider: true }, orderBy: { district: 'asc' } },
      courses: { include: { provider: true }, orderBy: { fee: 'asc' } },
    });
    if (!career) throw new HttpError(404, 'Career not found');
    const evidence = summariseOutcomes(career.outcomes, req.query.district);
    res.json({
      ...career,
      displayName: lang === 'TA' ? career.nameTa : career.name,
      displayDescription: lang === 'TA' ? career.descriptionTa : career.description,
      evidence: { ...evidence, disclaimer: disclaimerFor(evidence, lang) },
    });
  }),
);

module.exports = router;
module.exports.findCareer = findCareer;
