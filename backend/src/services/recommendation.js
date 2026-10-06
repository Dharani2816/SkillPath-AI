// AI-assisted career matching: an explainable weighted score, not a validated psychometric model.
const prisma = require('../lib/prisma');
const { QUESTIONS, TAG_MAX, TAG_LABELS } = require('../data/questions');
const { EDUCATION_RANK } = require('../lib/constants');
const { summariseOutcomes } = require('./outcomes');
const { upsertRoadmap } = require('./roadmap');

const WEIGHTS = { interest: 0.3, skill: 0.25, aptitude: 0.2, local: 0.15, growth: 0.1 };

// answers: [{ questionId, optionId }] -> { tag: 0..100 }
function scoreAnswers(answers) {
  const raw = {};
  answers.forEach(({ questionId, optionId }) => {
    const q = QUESTIONS.find((x) => x.id === questionId);
    const opt = q && q.options.find((o) => o.id === optionId);
    if (!opt) return;
    Object.entries(opt.tags).forEach(([tag, w]) => {
      raw[tag] = (raw[tag] || 0) + w;
    });
  });
  const scores = {};
  Object.keys(TAG_MAX).forEach((tag) => {
    scores[tag] = Math.round(((raw[tag] || 0) / TAG_MAX[tag]) * 100);
  });
  return scores;
}

const avg = (tags, scores) => (tags.length ? tags.reduce((s, t) => s + (scores[t] || 0), 0) / tags.length : 50);

// Interest tags are sparse (one strong interest usually), so reward the best match more than the mean.
const interestFit = (tags, scores) => {
  if (!tags.length) return 50;
  const vals = tags.map((t) => scores[t] || 0);
  return 0.7 * Math.max(...vals) + 0.3 * (vals.reduce((a, b) => a + b, 0) / vals.length);
};

function educationFit(career, educationLevel) {
  const need = EDUCATION_RANK[career.minEducation] || 2;
  const have = EDUCATION_RANK[educationLevel];
  if (!have) return 70; // unknown background: neutral
  return have >= need ? 100 : 40;
}

function buildReasons(career, scores, parts) {
  const tags = [...career.interests, ...career.aptitudes, ...career.skillTags]
    .filter((t) => (scores[t] || 0) >= 50)
    .sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
    .slice(0, 3);
  const en = tags.map((t) => TAG_LABELS[t].EN);
  const ta = tags.map((t) => TAG_LABELS[t].TA);
  if (career.growthScore >= 80) {
    en.push('strong career growth');
    ta.push('நல்ல தொழில் முன்னேற்ற வாய்ப்பு');
  }
  if (parts.local >= 75) {
    en.push('good placement record near you (demo data)');
    ta.push('உங்கள் பகுதியில் நல்ல வேலைவாய்ப்பு (மாதிரி தரவு)');
  } else if (career.demandLevel === 'HIGH') {
    en.push('high demand for this trade');
    ta.push('இந்தத் தொழிலுக்கு அதிக தேவை');
  }
  if (!en.length) {
    en.push('balanced match across your answers');
    ta.push('உங்கள் பதில்களுக்கு பொதுவாகப் பொருந்துகிறது');
  }
  return { en, ta };
}

async function generateRecommendations(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { studentProfile: true } });
  const assessment = await prisma.assessment.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
  if (!assessment) return null;

  const scores = assessment.scores;
  const careers = await prisma.career.findMany({ include: { outcomes: true } });
  const district = user.district;
  const educationLevel = user.studentProfile && user.studentProfile.educationLevel;

  const ranked = careers
    .map((career) => {
      const local = summariseOutcomes(career.outcomes, district);
      const parts = {
        interest: interestFit(career.interests, scores),
        skill: 0.5 * avg(career.skillTags, scores) + 0.5 * educationFit(career, educationLevel),
        aptitude: avg(career.aptitudes, scores),
        // Local opportunity: placement rate in the learner's district if we have it, else trade demand.
        local: local.count ? local.placementRate : career.demandScore,
        growth: career.growthScore,
      };
      const overall = Object.entries(WEIGHTS).reduce((s, [k, w]) => s + parts[k] * w, 0);
      return { career, parts, overall: Math.round(overall) };
    })
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 3);

  await prisma.recommendation.deleteMany({ where: { userId } });
  const created = [];
  for (const [i, r] of ranked.entries()) {
    const reasons = buildReasons(r.career, scores, r.parts);
    created.push(
      await prisma.recommendation.create({
        data: {
          userId,
          assessmentId: assessment.id,
          careerId: r.career.id,
          rank: i + 1,
          overallScore: r.overall,
          interestScore: Math.round(r.parts.interest),
          skillScore: Math.round(r.parts.skill),
          aptitudeScore: Math.round(r.parts.aptitude),
          localScore: Math.round(r.parts.local),
          growthScore: Math.round(r.parts.growth),
          reasons: reasons.en,
          reasonsTa: reasons.ta,
        },
      }),
    );
    await upsertRoadmap(userId, r.career.id);
  }
  return created;
}

module.exports = { WEIGHTS, scoreAnswers, generateRecommendations };
