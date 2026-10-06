const prisma = require('../lib/prisma');
const { summariseOutcomes } = require('./outcomes');

// Unambiguous characters only, so parents can read the code aloud or type it easily.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

async function uniqueConnectCode() {
  for (;;) {
    const code = randomCode();
    if (!(await prisma.family.findUnique({ where: { connectCode: code } }))) return code;
  }
}

async function createFamilyForStudent(user, profile) {
  const family = await prisma.family.create({
    data: {
      name: `${user.name}'s family`,
      connectCode: await uniqueConnectCode(),
      district: user.district,
      state: user.state,
      areaType: profile.areaType,
      householdIncome: profile.householdIncome,
    },
  });
  await prisma.studentProfile.update({ where: { id: profile.id }, data: { familyId: family.id } });
  return family;
}

const familyIdOf = (user) =>
  (user.studentProfile && user.studentProfile.familyId) || (user.parentProfile && user.parentProfile.familyId) || null;

// Everything a parent needs to see to make the decision together with the learner.
async function familyView(familyId) {
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: {
      students: { include: { user: { select: { id: true, name: true, email: true, district: true, language: true } } } },
      parents: { include: { user: { select: { id: true, name: true, email: true, language: true } } } },
      concerns: { orderBy: { createdAt: 'desc' }, include: { career: { select: { id: true, name: true, nameTa: true } } } },
      selectedCareer: true,
    },
  });
  if (!family) return null;

  const students = [];
  for (const s of family.students) {
    const recs = await prisma.recommendation.findMany({
      where: { userId: s.userId },
      orderBy: { rank: 'asc' },
      include: {
        career: {
          include: {
            outcomes: { include: { provider: true } },
            courses: { include: { provider: true }, orderBy: { fee: 'asc' } },
          },
        },
      },
    });
    const roadmaps = await prisma.roadmap.findMany({ where: { userId: s.userId } });
    students.push({
      ...s,
      recommendations: recs.map(({ career, ...rec }) => {
        const { outcomes, ...careerInfo } = career;
        return {
          ...rec,
          career: careerInfo,
          evidence: summariseOutcomes(outcomes, s.user.district),
          roadmap: (roadmaps.find((r) => r.careerId === career.id) || {}).steps || null,
        };
      }),
    });
  }
  return { ...family, students };
}

module.exports = { createFamilyForStudent, uniqueConnectCode, familyIdOf, familyView };
