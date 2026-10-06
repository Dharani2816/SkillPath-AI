/* eslint-disable no-console */
// Seeds the prototype with DEMO data. Nothing here is an official statistic.
require('dotenv').config();
// Seeded chats always use the offline demo engine so seeding is fast and repeatable.
delete process.env.LLM_API_KEY;
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const careers = require('./data/careers');
const { scoreAnswers, generateRecommendations } = require('../src/services/recommendation');
const { createFamilyForStudent } = require('../src/services/family');
const ai = require('../src/services/ai');

const DEMO_PASSWORD = 'SkillPath@123';
const DATA_SOURCE = 'SkillPath synthetic demo dataset (prototype only)';

// Deterministic pseudo-random numbers so every seed run produces the same demo data.
let rngState = 42;
const rand = () => {
  rngState = (rngState * 1103515245 + 12345) % 2147483648;
  return rngState / 2147483648;
};
const between = (min, max) => Math.round(min + rand() * (max - min));
const round100 = (n) => Math.round(n / 100) * 100;

const PROVIDERS = [
  { name: 'Madurai Skill Training Centre (Demo)', type: 'GOVT_ITI', district: 'Madurai' },
  { name: 'Chennai Technical Skills Institute (Demo)', type: 'PRIVATE_ITI', district: 'Chennai' },
  { name: 'Kovai Industrial Training Centre (Demo)', type: 'GOVT_ITI', district: 'Coimbatore' },
  { name: 'Trichy Vocational Academy (Demo)', type: 'SKILL_CENTRE', district: 'Tiruchirappalli' },
  { name: 'Salem Polytechnic Skill Wing (Demo)', type: 'POLYTECHNIC', district: 'Salem' },
  { name: 'Nellai Rural Skills Centre (Demo)', type: 'SKILL_CENTRE', district: 'Tirunelveli' },
  { name: 'Villupuram Rural Skill Hub (Demo)', type: 'SKILL_CENTRE', district: 'Villupuram' },
  { name: 'Dharmapuri Green Skills Centre (Demo)', type: 'SKILL_CENTRE', district: 'Dharmapuri' },
];

// Rural districts get slightly lower placement/earnings in the demo data.
const DISTRICT_FACTOR = { Chennai: 1.08, Coimbatore: 1.06, Madurai: 1.0, Tiruchirappalli: 1.0, Salem: 0.98, Tirunelveli: 0.95, Villupuram: 0.9, Dharmapuri: 0.88 };

const ANSWER_PROFILES = {
  solar: ['a', 'a', 'a', 'a', 'a', 'b', 'a', 'c', 'a', 'b'],
  electrician: ['a', 'd', 'a', 'a', 'a', 'b', 'd', 'c', 'a', 'a'],
  auto: ['c', 'b', 'a', 'a', 'b', 'b', 'b', 'a', 'a', 'd'],
  computers: ['d', 'b', 'c', 'c', 'c', 'a', 'c', 'd', 'b', 'a'],
  cnc: ['c', 'b', 'b', 'b', 'b', 'a', 'b', 'b', 'c', 'c'],
  welder: ['c', 'c', 'b', 'a', 'b', 'c', 'b', 'a', 'a', 'd'],
  ac: ['a', 'd', 'a', 'b', 'a', 'b', 'd', 'c', 'a', 'a'],
};
const toAnswers = (profile) => ANSWER_PROFILES[profile].map((optionId, i) => ({ questionId: `q${i + 1}`, optionId }));

// Scripted family chats, run through the real AI pipeline so concerns and sentiment are recorded authentically.
const SCRIPTS = {
  social_concerned: { lang: 'EN', msgs: ['Relatives say this is a low job. What about respect in society?', 'I am still worried about what people will say at marriage time.'] },
  social_reassured: { lang: 'EN', msgs: ['Will my son get respect in society doing this work?', 'Okay, that makes sense. Thank you.'] },
  safety_concerned: { lang: 'EN', msgs: ['Is this work dangerous? I am afraid of accidents.', 'I am still scared, I am not sure.'] },
  income_reassured: { lang: 'EN', msgs: ['How much salary will my child earn after training?', 'Good, thank you, this is helpful.'] },
  job_neutral: { lang: 'EN', msgs: ['Will my child get a permanent job?', 'Can he do a diploma later?'] },
  cost_concerned_ta: { lang: 'TA', msgs: ['பயிற்சி கட்டணம் எவ்வளவு? எங்களால் முடியாது, கவலையாக உள்ளது.', 'இன்னும் கவலை தான்.'] },
  growth_reassured_ta: { lang: 'TA', msgs: ['எதிர்காலத்தில் முன்னேற்றம் இருக்குமா?', 'சரி, நன்றி, புரிந்தது.'] },
  social_concerned_ta: { lang: 'TA', msgs: ['உறவினர்கள் இது மரியாதை இல்லாத வேலை என்கிறார்கள்.', 'எனக்கு இன்னும் தயக்கம் உள்ளது.'] },
  income_reassured_ta: { lang: 'TA', msgs: ['சம்பளம் எவ்வளவு கிடைக்கும்?', 'நல்லது, நன்றி.'] },
};

const FAMILIES = [
  { student: 'Karthik', parent: 'Murugan', district: 'Villupuram', area: 'RURAL', income: 'BELOW_1L', profile: 'welder', scripts: ['social_concerned_ta', 'safety_concerned'], decision: 'UNDECIDED', escalate: 'SOCIAL_PERCEPTION' },
  { student: 'Divya', parent: 'Selvi', district: 'Villupuram', area: 'RURAL', income: 'BELOW_1L', profile: 'electrician', scripts: ['safety_concerned', 'social_concerned'], decision: 'DECLINED', escalate: 'SAFETY' },
  { student: 'Vignesh', parent: 'Rajendran', district: 'Villupuram', area: 'RURAL', income: '1L_3L', profile: 'solar', scripts: ['cost_concerned_ta'], decision: 'EXPLORING', escalate: 'TRAINING_COST' },
  { student: 'Saravanan', parent: 'Kannan', district: 'Dharmapuri', area: 'RURAL', income: 'BELOW_1L', profile: 'auto', scripts: ['social_concerned_ta', 'cost_concerned_ta'], decision: 'UNDECIDED', escalate: 'SOCIAL_PERCEPTION' },
  { student: 'Meena', parent: 'Pushpa', district: 'Dharmapuri', area: 'RURAL', income: '1L_3L', profile: 'computers', scripts: ['social_concerned', 'job_neutral'], decision: 'EXPLORING' },
  { student: 'Ajith', parent: 'Velu', district: 'Tirunelveli', area: 'SEMI_URBAN', income: '1L_3L', profile: 'ac', scripts: ['income_reassured_ta', 'safety_concerned'], decision: 'EXPLORING' },
  { student: 'Gokul', parent: 'Shanthi', district: 'Tirunelveli', area: 'SEMI_URBAN', income: 'BELOW_1L', profile: 'electrician', scripts: ['cost_concerned_ta'], decision: 'UNDECIDED', escalate: 'TRAINING_COST', resolved: true },
  { student: 'Priya', parent: 'Revathi', district: 'Salem', area: 'SEMI_URBAN', income: '1L_3L', profile: 'computers', scripts: ['growth_reassured_ta'], decision: 'AGREED' },
  { student: 'Manoj', parent: 'Ganesan', district: 'Salem', area: 'SEMI_URBAN', income: '3L_6L', profile: 'cnc', scripts: ['income_reassured', 'job_neutral'], decision: 'AGREED' },
  { student: 'Hari', parent: 'Sundar', district: 'Tiruchirappalli', area: 'SEMI_URBAN', income: '1L_3L', profile: 'auto', scripts: ['social_reassured'], decision: 'AGREED' },
  { student: 'Kavya', parent: 'Malathi', district: 'Tiruchirappalli', area: 'URBAN', income: '3L_6L', profile: 'computers', scripts: ['income_reassured'], decision: 'AGREED' },
  { student: 'Surya', parent: 'Ramesh', district: 'Coimbatore', area: 'URBAN', income: '3L_6L', profile: 'cnc', scripts: ['income_reassured', 'growth_reassured_ta'], decision: 'AGREED' },
  { student: 'Naveen', parent: 'Sivakumar', district: 'Coimbatore', area: 'URBAN', income: '1L_3L', profile: 'welder', scripts: ['safety_concerned'], decision: 'EXPLORING', escalate: 'SAFETY', resolved: true },
  { student: 'Rahul', parent: 'Anitha', district: 'Chennai', area: 'URBAN', income: '3L_6L', profile: 'electrician', scripts: ['social_reassured', 'income_reassured'], decision: 'AGREED' },
  { student: 'Deepak', parent: 'Usha', district: 'Chennai', area: 'URBAN', income: 'ABOVE_6L', profile: 'computers', scripts: ['social_concerned'], decision: 'UNDECIDED' },
  { student: 'Bala', parent: 'Kumar', district: 'Madurai', area: 'SEMI_URBAN', income: '1L_3L', profile: 'solar', scripts: ['income_reassured_ta', 'job_neutral'], decision: 'EXPLORING' },
];

const loadUser = (id) => prisma.user.findUnique({ where: { id }, include: { studentProfile: true, parentProfile: true } });

async function wipe() {
  // Child tables first.
  await prisma.sentimentRecord.deleteMany();
  await prisma.counsellorRequest.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.familyConcern.deleteMany();
  await prisma.roadmap.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.assessmentAnswer.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.family.deleteMany();
  await prisma.user.deleteMany();
  await prisma.outcomeData.deleteMany();
  await prisma.course.deleteMany();
  await prisma.trainingProvider.deleteMany();
  await prisma.career.deleteMany();
}

async function seedCatalogue() {
  const providers = [];
  for (const p of PROVIDERS) {
    providers.push(await prisma.trainingProvider.create({ data: { ...p, state: 'Tamil Nadu', contact: 'demo-contact@skillpath.demo', isDemo: true } }));
  }
  let outcomeCount = 0;
  for (const [i, c] of careers.entries()) {
    const career = await prisma.career.create({ data: c });
    // Every career is offered in Madurai (demo learner's district) plus three rotating districts.
    const offered = [providers[0], ...[1, 2, 3].map((k) => providers[1 + ((i + k * 2) % (providers.length - 1))])];
    for (const provider of [...new Set(offered)]) {
      const isGovt = provider.type === 'GOVT_ITI';
      const fee = round100(isGovt ? c.trainingCostMin : between(c.trainingCostMin + (c.trainingCostMax - c.trainingCostMin) * 0.3, c.trainingCostMax));
      await prisma.course.create({
        data: {
          name: `${c.name} (NSQF L${c.nsqfEntryLevel})`,
          careerId: career.id,
          providerId: provider.id,
          nsqfLevel: c.nsqfEntryLevel,
          durationMonths: c.trainingMonths,
          fee,
          mode: c.trainingMonths <= 6 && !isGovt ? 'WEEKEND' : 'FULL_TIME',
          certification: `NSQF Level ${c.nsqfEntryLevel} certificate (demo)`,
        },
      });

      const f = DISTRICT_FACTOR[provider.district] || 1;
      const placementRate = Math.min(95, Math.round((45 + c.demandScore * 0.4 + between(-6, 6)) * f));
      const earningsMin = round100(c.salaryMin * 0.85 * f);
      const earningsMax = round100(c.salaryMin * 1.6 * f);
      await prisma.outcomeData.create({
        data: {
          careerId: career.id,
          providerId: provider.id,
          district: provider.district,
          state: 'Tamil Nadu',
          placementRate,
          earningsMin,
          earningsMax,
          avgEarnings: round100(c.salaryMin * f * (1.05 + rand() * 0.2)),
          nsqfLevel: c.nsqfEntryLevel,
          nextProgressionLevel: `NSQF Level ${Math.min(c.nsqfEntryLevel + 1, c.nsqfMaxLevel)} — ${c.careerProgression[2] || c.careerProgression[1]}`,
          furtherEducationRoute: c.furtherEducation[0],
          sampleSize: between(40, 180),
          dataYear: 2025,
          dataSource: DATA_SOURCE,
          verificationStatus: 'DEMO',
          notes: 'Synthetic values for demonstration. Replace with verified placement-tracking data.',
        },
      });
      outcomeCount += 1;
    }
  }
  return { providers: providers.length, outcomes: outcomeCount };
}

async function createUser({ email, name, role, language = 'EN', district, phone }) {
  return prisma.user.create({
    data: { email, name, role, language, district, state: 'Tamil Nadu', phone, passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10) },
  });
}

async function createStudentFamily({ email, name, district, area, income, education = '10th Pass', parentEmail, parentName, relation, parentLanguage }) {
  const student = await createUser({ email, name, role: 'STUDENT', district });
  const profile = await prisma.studentProfile.create({
    data: { userId: student.id, age: between(15, 18), educationLevel: education, areaType: area, householdIncome: income, interests: [] },
  });
  const family = await createFamilyForStudent(student, profile);
  const parent = await createUser({ email: parentEmail, name: parentName, role: 'PARENT', language: parentLanguage, district });
  await prisma.parentProfile.create({ data: { userId: parent.id, relation, occupation: 'Farmer', educationLevel: '8th Pass', familyId: family.id } });
  return { student, parent, family };
}

async function runAssessment(userId, profile) {
  const answers = toAnswers(profile);
  await prisma.assessment.create({
    data: { userId, scores: scoreAnswers(answers), answers: { create: answers } },
  });
  return generateRecommendations(userId);
}

async function runScript(userId, scriptKey, daysAgo) {
  const script = SCRIPTS[scriptKey];
  let conversationId;
  let last;
  for (const message of script.msgs) {
    last = await ai.chat(await loadUser(userId), { message, conversationId, language: script.lang });
    conversationId = last.conversationId;
  }
  const at = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
  await prisma.conversation.update({ where: { id: conversationId }, data: { createdAt: at } });
  return last;
}

async function main() {
  console.log('Seeding SkillPath AI demo data…');
  await wipe();
  const catalogue = await seedCatalogue();

  // Core demo accounts.
  const demo = await createStudentFamily({
    email: 'student@skillpath.demo',
    name: 'Arun Kumar',
    district: 'Madurai',
    area: 'SEMI_URBAN',
    income: '1L_3L',
    parentEmail: 'parent@skillpath.demo',
    parentName: 'Lakshmi Kumar',
    relation: 'MOTHER',
    parentLanguage: 'TA',
  });
  await prisma.family.update({ where: { id: demo.family.id }, data: { name: 'Kumar family', connectCode: 'ARUN01' } });
  const counsellor = await createUser({ email: 'counsellor@skillpath.demo', name: 'Priya Raman', role: 'COUNSELLOR', language: 'TA', district: 'Madurai', phone: '+91-00000-00000' });
  await createUser({ email: 'admin@skillpath.demo', name: 'Scheme Admin', role: 'ADMIN', district: 'Chennai' });

  const recs = await runAssessment(demo.student.id, 'solar');
  await prisma.familyConcern.createMany({
    data: [
      { familyId: demo.family.id, raisedById: demo.parent.id, careerId: recs[0].careerId, type: 'INCOME', details: 'Selected on family page' },
      { familyId: demo.family.id, raisedById: demo.parent.id, careerId: recs[0].careerId, type: 'SAFETY', details: 'Worried about rooftop work' },
    ],
  });
  await runScript(demo.parent.id, 'income_reassured_ta', 1);
  const safetyChat = await runScript(demo.parent.id, 'safety_concerned', 0);
  await prisma.counsellorRequest.create({
    data: {
      userId: demo.parent.id,
      familyId: demo.family.id,
      conversationId: safetyChat.conversationId,
      concernType: 'SAFETY',
      concern: 'Mother is worried about rooftop safety for solar work and wants to talk to someone.',
      language: 'TA',
      location: 'Madurai',
      preferredTime: 'Evening 6–8 PM',
    },
  });

  // Synthetic families across districts, for the resistance dashboard.
  for (const [i, f] of FAMILIES.entries()) {
    const slug = f.student.toLowerCase();
    const fam = await createStudentFamily({
      email: `${slug}.student@skillpath.demo`,
      name: f.student,
      district: f.district,
      area: f.area,
      income: f.income,
      education: i % 5 === 0 ? '12th Pass' : '10th Pass',
      parentEmail: `${slug}.parent@skillpath.demo`,
      parentName: f.parent,
      relation: i % 2 ? 'MOTHER' : 'FATHER',
      parentLanguage: f.scripts.some((s) => s.endsWith('_ta')) ? 'TA' : 'EN',
    });
    const famRecs = await runAssessment(fam.student.id, f.profile);
    await prisma.family.update({ where: { id: fam.family.id }, data: { decision: f.decision, selectedCareerId: f.decision === 'AGREED' ? famRecs[0].careerId : null } });
    let lastChat;
    for (const [k, s] of f.scripts.entries()) lastChat = await runScript(fam.parent.id, s, (i + k * 3) % 14);
    if (f.escalate) {
      await prisma.counsellorRequest.create({
        data: {
          userId: fam.parent.id,
          familyId: fam.family.id,
          conversationId: lastChat.conversationId,
          concernType: f.escalate,
          concern: `Family still has concerns about ${f.escalate.toLowerCase().replace('_', ' ')}.`,
          language: SCRIPTS[f.scripts[0]].lang,
          location: f.district,
          status: f.resolved ? 'RESOLVED' : i % 2 ? 'CONTACTED' : 'PENDING',
          counsellorId: f.resolved || i % 2 ? counsellor.id : null,
          notes: f.resolved ? 'Explained details on a phone call; family reassured.' : null,
        },
      });
      await prisma.familyConcern.updateMany({
        where: { familyId: fam.family.id, type: f.escalate },
        data: f.resolved ? { status: 'ADDRESSED', resolvedAt: new Date() } : { status: 'ESCALATED' },
      });
    }
  }

  const counts = {
    careers: await prisma.career.count(),
    providers: catalogue.providers,
    courses: await prisma.course.count(),
    outcomes: catalogue.outcomes,
    users: await prisma.user.count(),
    families: await prisma.family.count(),
    conversations: await prisma.conversation.count(),
    concerns: await prisma.familyConcern.count(),
    sentimentRecords: await prisma.sentimentRecord.count(),
    counsellorRequests: await prisma.counsellorRequest.count(),
  };
  console.table(counts);
  console.log(`Demo password for all accounts: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
