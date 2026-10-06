// Collects everything the counsellor AI is allowed to talk about for this family.
const prisma = require('../../lib/prisma');
const { summariseOutcomes } = require('../outcomes');

async function findFamilyForUser(user) {
  const familyId = (user.studentProfile && user.studentProfile.familyId) || (user.parentProfile && user.parentProfile.familyId);
  if (!familyId) return null;
  return prisma.family.findUnique({
    where: { id: familyId },
    include: {
      students: { include: { user: true } },
      parents: { include: { user: true } },
      concerns: { where: { status: 'OPEN' } },
    },
  });
}

async function buildContext(user, { careerId } = {}) {
  const family = await findFamilyForUser(user);
  const studentProfile = user.role === 'STUDENT' ? user.studentProfile : family && family.students[0];
  const studentUser = user.role === 'STUDENT' ? user : studentProfile && studentProfile.user;

  // Career priority: explicitly asked > family's chosen career > student's top recommendation.
  let resolvedCareerId = careerId || (family && family.selectedCareerId);
  let recommendation = null;
  if (studentUser) {
    recommendation = await prisma.recommendation.findFirst({
      where: { userId: studentUser.id, ...(resolvedCareerId ? { careerId: resolvedCareerId } : {}) },
      orderBy: { rank: 'asc' },
    });
    if (!resolvedCareerId && recommendation) resolvedCareerId = recommendation.careerId;
  }

  const career = resolvedCareerId
    ? await prisma.career.findFirst({
        where: { OR: [{ id: resolvedCareerId }, { slug: resolvedCareerId }] },
        include: { outcomes: { include: { provider: true } }, courses: { include: { provider: true }, orderBy: { fee: 'asc' } } },
      })
    : null;

  const district = (studentUser && studentUser.district) || (family && family.district) || user.district;

  return {
    role: user.role,
    userName: user.name,
    family,
    student: studentProfile
      ? {
          name: studentUser.name,
          educationLevel: studentProfile.educationLevel,
          areaType: studentProfile.areaType || (family && family.areaType),
          householdIncome: studentProfile.householdIncome || (family && family.householdIncome),
          district,
        }
      : null,
    district,
    career,
    recommendation,
    outcomeSummary: career ? summariseOutcomes(career.outcomes, district) : { count: 0, scope: 'NONE' },
    openConcerns: family ? family.concerns.map((c) => c.type) : [],
  };
}

// Compact, LLM-friendly facts. The same facts ground both the demo engine and any LLM.
function factsFor(ctx) {
  if (!ctx.career) return null;
  const c = ctx.career;
  const o = ctx.outcomeSummary;
  return {
    career: c.name,
    careerTa: c.nameTa,
    description: c.description,
    requiredEducation: c.requiredEducation,
    trainingDuration: c.trainingDuration,
    trainingCostINR: [c.trainingCostMin, c.trainingCostMax],
    salaryMonthlyINR: { entry: c.salaryMin, experienced: c.salaryMax },
    demandLevel: c.demandLevel,
    careerProgression: c.careerProgression,
    nsqf: { entry: c.nsqfEntryLevel, max: c.nsqfMaxLevel, info: c.nsqfInfo },
    furtherEducation: c.furtherEducation,
    safety: c.safetyNotes,
    socialPerception: c.perceptionNotes,
    cheapestCourses: c.courses.slice(0, 3).map((x) => ({ name: x.name, provider: x.provider.name, district: x.provider.district, feeINR: x.fee, months: x.durationMonths })),
    outcomes: o.count
      ? {
          scope: o.scope === 'DISTRICT' ? `district: ${o.district}` : 'all districts in dataset',
          placementRatePercent: o.placementRate,
          avgMonthlyEarningsINR: o.avgEarnings,
          earningsRangeINR: [o.earningsMin, o.earningsMax],
          sampleSize: o.sampleSize,
          providers: o.providers,
          nextProgression: o.nextProgressionLevel,
          furtherEducationRoute: o.furtherEducationRoute,
          dataLabel: o.isDemo ? 'DEMO DATA — not official statistics' : 'VERIFIED',
        }
      : null,
    family: ctx.student,
  };
}

module.exports = { buildContext, factsFor, findFamilyForUser };
