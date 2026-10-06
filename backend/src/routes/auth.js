const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { asyncHandler, HttpError, enumValue } = require('../lib/http');
const { signToken } = require('../middleware/auth');
const { LANGUAGES, AREA_TYPES, INCOME_BRACKETS } = require('../lib/constants');
const { createFamilyForStudent } = require('../services/family');

// Counsellors and admins are provisioned (seeded), not self-registered.
const SELF_REGISTER_ROLES = ['STUDENT', 'PARENT'];

const publicUser = (u) => {
  const { passwordHash, ...rest } = u;
  return rest;
};

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, name, phone, district, state, connectCode } = req.body;
    if (!email || !password || !name) throw new HttpError(400, 'email, password and name are required');
    if (String(password).length < 6) throw new HttpError(400, 'password must be at least 6 characters');
    const role = enumValue(req.body.role || 'STUDENT', SELF_REGISTER_ROLES, 'role');
    const language = enumValue(req.body.language || 'EN', LANGUAGES, 'language');

    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase().trim(),
        passwordHash: await bcrypt.hash(password, 10),
        name,
        phone,
        role,
        language,
        district,
        state: state || 'Tamil Nadu',
      },
    });

    if (role === 'STUDENT') {
      const profile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          age: req.body.age ? Number(req.body.age) : null,
          gender: req.body.gender,
          educationLevel: req.body.educationLevel,
          stream: req.body.stream,
          areaType: enumValue(req.body.areaType, AREA_TYPES, 'areaType'),
          householdIncome: enumValue(req.body.householdIncome, INCOME_BRACKETS, 'householdIncome'),
          interests: Array.isArray(req.body.interests) ? req.body.interests : [],
        },
      });
      await createFamilyForStudent(user, profile);
    } else {
      let familyId = null;
      if (connectCode) {
        const family = await prisma.family.findUnique({ where: { connectCode: String(connectCode).toUpperCase() } });
        if (!family) throw new HttpError(400, 'Invalid family connect code');
        familyId = family.id;
      }
      await prisma.parentProfile.create({
        data: {
          userId: user.id,
          relation: req.body.relation,
          occupation: req.body.occupation,
          educationLevel: req.body.educationLevel,
          familyId,
        },
      });
    }

    const full = await prisma.user.findUnique({ where: { id: user.id }, include: { studentProfile: true, parentProfile: true } });
    res.status(201).json({ token: signToken(user), user: publicUser(full) });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new HttpError(400, 'email and password are required');
    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      include: { studentProfile: true, parentProfile: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(401, 'Invalid email or password');
    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

module.exports = router;
module.exports.publicUser = publicUser;
