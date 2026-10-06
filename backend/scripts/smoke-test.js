/* eslint-disable no-console */
// End-to-end check of every prototype API against a running server with seeded data.
// Usage: npm run dev (in another terminal), then npm test
const BASE = process.env.API_URL || 'http://localhost:5000/api';
const PASSWORD = 'SkillPath@123';

let failures = 0;
async function call(method, path, { token, body, expect = 200 } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  const ok = res.status === expect;
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${method} ${path} -> ${res.status}${ok ? '' : ` (expected ${expect}) ${JSON.stringify(data).slice(0, 300)}`}`);
  return data;
}

const login = async (email) => (await call('POST', '/auth/login', { body: { email, password: PASSWORD } })).token;

async function main() {
  await call('GET', '/health');

  // Auth
  const email = `smoke.${Date.now()}@skillpath.demo`;
  const reg = await call('POST', '/auth/register', {
    expect: 201,
    body: { email, password: 'test1234', name: 'Smoke Student', role: 'STUDENT', district: 'Madurai', educationLevel: '10th Pass', areaType: 'RURAL', householdIncome: 'BELOW_1L' },
  });
  await call('POST', '/auth/login', { body: { email, password: 'wrong' }, expect: 401 });
  await call('POST', '/auth/register', { body: { email: 'x@y.z', password: 'test1234', name: 'X', role: 'ADMIN' }, expect: 400 });
  const student = reg.token;
  const code = reg.user.studentProfile && (await call('GET', '/profile', { token: student })).studentProfile.family.connectCode;

  // Profile
  await call('GET', '/profile', { expect: 401 });
  await call('PUT', '/profile', { token: student, body: { phone: '9999999999', language: 'TA' } });

  // Assessment + recommendations
  const questions = await call('GET', '/assessment/questions?lang=TA');
  console.log(`      ${questions.length} questions, first: ${questions[0].text}`);
  await call('POST', '/recommendations/generate', { token: student, expect: 400 });
  const submitted = await call('POST', '/assessment/submit', {
    token: student,
    expect: 201,
    body: { answers: questions.map((q) => ({ questionId: q.id, optionId: 'a' })) },
  });
  console.log(`      top match: ${submitted.recommendations[0].overallScore}%`);
  const gen = await call('POST', '/recommendations/generate', { token: student, expect: 201 });
  gen.recommendations.forEach((r) => console.log(`      #${r.rank} ${r.career.name} ${r.matchPercent}% — ${r.why.join('; ')}`));
  await call('GET', '/recommendations', { token: student });
  await call('GET', '/recommendations/roadmaps', { token: student });

  // Careers + outcomes
  const careers = await call('GET', '/careers?lang=TA&district=Madurai');
  console.log(`      ${careers.length} careers`);
  await call('GET', '/careers/solar-pv-technician');
  await call('GET', '/careers/does-not-exist', { expect: 404 });
  const outcomes = await call('GET', '/outcomes/solar-pv-technician?district=Madurai');
  console.log(`      outcome rows: ${outcomes.outcomes.length}, disclaimer: ${outcomes.disclaimer}`);

  // Family: new parent joins with the student's connect code
  const parentEmail = `smoke.parent.${Date.now()}@skillpath.demo`;
  const parentReg = await call('POST', '/auth/register', { expect: 201, body: { email: parentEmail, password: 'test1234', name: 'Smoke Parent', role: 'PARENT', language: 'TA' } });
  const parent = parentReg.token;
  await call('GET', '/recommendations', { token: parent, expect: 400 });
  await call('POST', '/family/connect', { token: parent, body: { connectCode: code } });
  const fam = await call('GET', '/family', { token: parent });
  console.log(`      family: ${fam.name}, students: ${fam.students.length}, parents: ${fam.parents.length}`);
  await call('GET', '/recommendations', { token: parent });
  await call('POST', '/family/concerns', { token: parent, expect: 201, body: { concerns: ['INCOME', 'SOCIAL_PERCEPTION'] } });
  await call('POST', '/family/concerns', { token: parent, expect: 400, body: { concerns: ['NOPE'] } });
  await call('PATCH', '/family/decision', { token: parent, body: { decision: 'EXPLORING' } });

  // AI chat
  const c1 = await call('POST', '/ai/chat', { token: parent, body: { message: 'Will my child get a stable job?', language: 'EN' } });
  console.log(`      [${c1.concernType}/${c1.sentiment}] ${c1.reply.split('\n')[0]}`);
  const c2 = await call('POST', '/ai/chat', { token: parent, body: { message: 'சம்பளம் எவ்வளவு கிடைக்கும்?', language: 'TA', conversationId: c1.conversationId } });
  console.log(`      [${c2.concernType}] ${c2.reply.split('\n')[0]}`);
  const c3 = await call('POST', '/ai/chat', { token: parent, body: { message: 'Okay, thank you, that makes sense', conversationId: c1.conversationId } });
  console.log(`      shift: ${JSON.stringify(c3.sentimentShift)}`);
  const c4 = await call('POST', '/ai/chat', { token: parent, body: { message: 'I want to talk to a counsellor' } });
  console.log(`      escalation suggested: ${c4.needsEscalation}`);
  await call('POST', '/ai/feedback', { token: parent, body: { conversationId: c1.conversationId, sentiment: 'REASSURED' } });
  await call('GET', '/ai/conversations', { token: parent });
  await call('POST', '/ai/chat', { token: parent, body: {}, expect: 400 });

  // A learner with no family or results gets the honest "no data" answer.
  const loner = await call('POST', '/auth/register', { expect: 201, body: { email: `smoke.p2.${Date.now()}@skillpath.demo`, password: 'test1234', name: 'Lone Parent', role: 'PARENT' } });
  const noData = await call('POST', '/ai/chat', { token: loner.token, body: { message: 'Is this job safe?' } });
  console.log(`      no-data reply: ${noData.reply}`);

  // Counsellor escalation
  const reqd = await call('POST', '/counsellor/request', { token: parent, expect: 201, body: { conversationId: c4.conversationId, concernType: 'SAFETY', language: 'TA' } });
  const counsellor = await login('counsellor@skillpath.demo');
  const queue = await call('GET', '/counsellor/requests?status=PENDING', { token: counsellor });
  console.log(`      pending requests: ${queue.length}`);
  await call('PATCH', `/counsellor/requests/${reqd.id}`, { token: counsellor, body: { status: 'CONTACTED', notes: 'Called family' } });
  await call('PATCH', `/counsellor/requests/${reqd.id}`, { token: parent, body: { status: 'RESOLVED' }, expect: 403 });

  // Admin analytics
  await call('GET', '/admin/analytics', { token: student, expect: 403 });
  const admin = await login('admin@skillpath.demo');
  const a = await call('GET', '/admin/analytics', { token: admin });
  console.log(`      overview: ${JSON.stringify(a.overview)}`);
  console.log(`      most resistant district: ${a.resistanceByDistrict[0].district} (index ${a.resistanceByDistrict[0].resistanceIndex}, top concern ${a.resistanceByDistrict[0].topConcern})`);

  // Seeded demo accounts
  const demoParent = await login('parent@skillpath.demo');
  const demoFam = await call('GET', '/family', { token: demoParent });
  console.log(`      demo family top career: ${demoFam.students[0].recommendations[0].career.name}`);

  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
  process.exitCode = failures ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
