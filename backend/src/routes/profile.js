const router = require('express').Router();
const prisma = require('../lib/prisma');
const { asyncHandler, enumValue } = require('../lib/http');
const { requireAuth } = require('../middleware/auth');
const { LANGUAGES, AREA_TYPES, INCOME_BRACKETS } = require('../lib/constants');
const { publicUser } = require('./auth');

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

const loadProfile = (id) =>
  prisma.user.findUnique({
    where: { id },
    include: {
      studentProfile: { include: { family: true } },
      parentProfile: { include: { family: true } },
    },
  });

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(publicUser(await loadProfile(req.user.id)));
  }),
);

router.put(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body;
    const userData = pick(body, ['name', 'phone', 'district', 'state']);
    if (body.language) userData.language = enumValue(body.language, LANGUAGES, 'language');
    await prisma.user.update({ where: { id: req.user.id }, data: userData });

    if (req.user.role === 'STUDENT' && req.user.studentProfile) {
      const data = pick(body, ['gender', 'educationLevel', 'stream', 'interests', 'learningPreference', 'location']);
      if (body.age !== undefined) data.age = Number(body.age);
      if (body.marksPercent !== undefined) data.marksPercent = Number(body.marksPercent);
      if (body.areaType) data.areaType = enumValue(body.areaType, AREA_TYPES, 'areaType');
      if (body.householdIncome) data.householdIncome = enumValue(body.householdIncome, INCOME_BRACKETS, 'householdIncome');
      const profile = await prisma.studentProfile.update({ where: { id: req.user.studentProfile.id }, data });
      // Keep the family's context (used for tailoring and analytics) in step with the learner.
      if (profile.familyId) {
        await prisma.family.update({
          where: { id: profile.familyId },
          data: pick({ district: userData.district, state: userData.state, areaType: data.areaType, householdIncome: data.householdIncome }, ['district', 'state', 'areaType', 'householdIncome']),
        });
      }
    }
    if (req.user.role === 'PARENT' && req.user.parentProfile) {
      await prisma.parentProfile.update({
        where: { id: req.user.parentProfile.id },
        data: pick(body, ['relation', 'occupation', 'educationLevel']),
      });
    }
    res.json(publicUser(await loadProfile(req.user.id)));
  }),
);

module.exports = router;
