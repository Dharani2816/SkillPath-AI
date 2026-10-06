// Counselling chat orchestrator: context -> concern & sentiment -> answer (LLM or demo) -> storage.
const prisma = require('../../lib/prisma');
const { HttpError } = require('../../lib/http');
const { buildContext, factsFor } = require('./context');
const demoEngine = require('./demoEngine');
const llm = require('./llmProvider');
const nlu = require('../nlu');

const CONCERNED_TURNS_BEFORE_ESCALATION = 3;

async function loadConversation(user, conversationId, ctx, lang, careerId) {
  if (conversationId) {
    const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
    const sameFamily = convo && ctx.family && convo.familyId === ctx.family.id;
    if (!convo || (convo.userId !== user.id && !sameFamily)) throw new HttpError(404, 'Conversation not found');
    return convo;
  }
  return prisma.conversation.create({
    data: {
      userId: user.id,
      familyId: ctx.family ? ctx.family.id : null,
      careerId: careerId || (ctx.career ? ctx.career.id : null),
      language: lang,
    },
  });
}

// One SentimentRecord per (conversation, concern): "before" is set when the concern is first raised,
// "after" tracks the latest user message on it. Messages with no concern update the latest record.
async function recordSentiment({ convo, user, ctx, concernType, sentiment }) {
  const existing = await prisma.sentimentRecord.findFirst({
    where: { conversationId: convo.id, ...(concernType ? { concernType } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) {
    return prisma.sentimentRecord.update({ where: { id: existing.id }, data: { afterSentiment: sentiment } });
  }
  // Raising a worry with neutral wording still counts as a concerned starting point.
  const before = concernType && sentiment === 'NEUTRAL' ? 'CONCERNED' : sentiment;
  return prisma.sentimentRecord.create({
    data: {
      conversationId: convo.id,
      userId: user.id,
      familyId: convo.familyId,
      role: user.role,
      concernType,
      beforeSentiment: before,
      afterSentiment: before,
      district: ctx.district,
    },
  });
}

async function trackFamilyConcern(ctx, user, concernType, escalated) {
  if (!ctx.family || !concernType) return;
  const existing = await prisma.familyConcern.findFirst({
    where: { familyId: ctx.family.id, type: concernType, status: { not: 'ADDRESSED' } },
  });
  const status = escalated ? 'ESCALATED' : undefined;
  if (existing) {
    if (status) await prisma.familyConcern.update({ where: { id: existing.id }, data: { status } });
    return;
  }
  await prisma.familyConcern.create({
    data: {
      familyId: ctx.family.id,
      raisedById: user.id,
      careerId: ctx.career ? ctx.career.id : null,
      type: concernType,
      details: 'Raised in AI chat',
      status: status || 'OPEN',
    },
  });
}

async function chat(user, { message, conversationId, careerId, concernType, language }) {
  if (!message || !String(message).trim()) throw new HttpError(400, 'message is required');
  const lang = language || user.language || 'EN';
  const ctx = await buildContext(user, { careerId });
  const convo = await loadConversation(user, conversationId, ctx, lang, careerId);
  if (convo.careerId && (!ctx.career || ctx.career.id !== convo.careerId)) {
    Object.assign(ctx, await buildContext(user, { careerId: convo.careerId }));
  }

  const detected = concernType || nlu.detectConcern(message);
  const sentiment = nlu.classifySentiment(message);
  const wantsHuman = nlu.wantsHuman(message);

  const history = await prisma.chatMessage.findMany({ where: { conversationId: convo.id }, orderBy: { createdAt: 'asc' } });
  await prisma.chatMessage.create({
    data: { conversationId: convo.id, role: 'USER', content: message, concernType: detected, sentiment },
  });

  let result;
  let provider = 'demo';
  if (llm.isEnabled()) {
    try {
      const turns = [...history.slice(-10), { role: 'USER', content: message }].map((m) => ({
        role: m.role === 'USER' ? 'user' : 'assistant',
        content: m.content,
      }));
      result = await llm.generate({ facts: factsFor(ctx), language: lang, history: turns });
      provider = llm.providerName();
    } catch (err) {
      console.warn('LLM failed, using demo engine:', err.message);
    }
  }
  if (!result) {
    result = demoEngine.respond(ctx, { message, concernType: detected, language: lang, wantsHuman, isGreeting: nlu.isGreeting(message) });
  }

  // Persistent worry: suggest a human once the family stays concerned for several turns.
  const concernedTurns = history.filter((m) => m.role === 'USER' && m.sentiment === 'CONCERNED').length + (sentiment === 'CONCERNED' ? 1 : 0);
  const needsEscalation = result.needsEscalation || wantsHuman || concernedTurns >= CONCERNED_TURNS_BEFORE_ESCALATION;
  let reply = result.reply;
  if (needsEscalation && !result.needsEscalation && !wantsHuman) {
    reply +=
      lang === 'TA'
        ? '\n\nஉங்கள் கவலை இன்னும் தீரவில்லை என்று தோன்றுகிறது. ஒரு ஆலோசகருடன் பேச விரும்புகிறீர்களா?'
        : '\n\nIt seems this worry is not fully resolved. Would you like to speak with a counsellor?';
  }

  const outcome = ctx.outcomeSummary;
  const sources = ctx.career
    ? {
        careerId: ctx.career.id,
        career: ctx.career.name,
        outcomeScope: outcome.scope,
        outcomeRecords: outcome.count,
        dataLabel: outcome.count ? (outcome.isDemo ? 'DEMO' : 'VERIFIED') : null,
        dataSources: outcome.dataSources || [],
      }
    : null;

  await prisma.chatMessage.create({
    data: { conversationId: convo.id, role: 'ASSISTANT', content: reply, concernType: detected, needsEscalation, sources },
  });
  if (detected && !convo.concernType) {
    await prisma.conversation.update({ where: { id: convo.id }, data: { concernType: detected } });
  }
  const sentimentRecord = await recordSentiment({ convo, user, ctx, concernType: detected, sentiment });
  await trackFamilyConcern(ctx, user, detected, needsEscalation);

  return {
    conversationId: convo.id,
    reply,
    language: lang,
    concernType: detected,
    sentiment,
    sentimentShift: { before: sentimentRecord.beforeSentiment, after: sentimentRecord.afterSentiment },
    needsEscalation,
    escalation: needsEscalation ? { suggested: true, endpoint: 'POST /api/counsellor/request' } : null,
    sources,
    provider,
  };
}

// Explicit thumbs-up / thumbs-down from low-literacy users updates the latest sentiment record.
async function feedback(user, { conversationId, sentiment }) {
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId || '' } });
  const familyId = (user.studentProfile && user.studentProfile.familyId) || (user.parentProfile && user.parentProfile.familyId);
  if (!convo || (convo.userId !== user.id && (!familyId || convo.familyId !== familyId))) {
    throw new HttpError(404, 'Conversation not found');
  }
  const record = await prisma.sentimentRecord.findFirst({ where: { conversationId }, orderBy: { createdAt: 'desc' } });
  if (!record) throw new HttpError(404, 'No sentiment record for this conversation yet');
  return prisma.sentimentRecord.update({ where: { id: record.id }, data: { afterSentiment: sentiment } });
}

module.exports = { chat, feedback };
