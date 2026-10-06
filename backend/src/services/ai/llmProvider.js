// Optional LLM provider. If LLM_API_KEY is not set, isEnabled() is false and the demo engine is used.
// Supports Anthropic (default) or any OpenAI-compatible chat completions endpoint.

const PROVIDER = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase();
const API_KEY = process.env.LLM_API_KEY;
const TIMEOUT_MS = 20000;

const isEnabled = () => Boolean(API_KEY);
const providerName = () => (isEnabled() ? PROVIDER : 'demo');

function systemPrompt(facts, lang) {
  return [
    'You are SkillPath AI, a warm, patient vocational career counsellor in India speaking with a learner and their parents together.',
    `Reply ONLY in ${lang === 'TA' ? 'simple spoken Tamil (Tamil script), suitable for parents with low literacy' : 'simple, low-jargon English'}.`,
    'Use short sentences. Maximum 120 words. Address parental worries about income, job security, safety, social respect, cost, growth and further education.',
    'Use ONLY the facts in the JSON below. Never invent numbers, schemes, companies or statistics.',
    'If the facts include DEMO DATA, say once that the figures are demo data, not official statistics.',
    "If the facts cannot answer the question, say you don't have verified information for that question and ask if they want to speak with a counsellor, then end your reply with the token [ESCALATE].",
    'If the user asks for a human or counsellor, end your reply with [ESCALATE].',
    '',
    `FACTS: ${JSON.stringify(facts || { note: 'No career selected and no outcome data available.' })}`,
  ].join('\n');
}

async function postJson(url, headers, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// history: [{ role: 'user'|'assistant', content }]
async function generate({ facts, language, history }) {
  const system = systemPrompt(facts, language);
  let text;
  if (PROVIDER === 'anthropic') {
    const data = await postJson(
      process.env.LLM_BASE_URL || 'https://api.anthropic.com/v1/messages',
      { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
      { model: process.env.LLM_MODEL || 'claude-sonnet-5-5', max_tokens: 600, system, messages: history },
    );
    text = data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  } else {
    const data = await postJson(
      process.env.LLM_BASE_URL || 'https://api.openai.com/v1/chat/completions',
      { authorization: `Bearer ${API_KEY}` },
      { model: process.env.LLM_MODEL || 'gpt-4o-mini', max_tokens: 600, messages: [{ role: 'system', content: system }, ...history] },
    );
    text = data.choices[0].message.content;
  }
  const needsEscalation = text.includes('[ESCALATE]');
  return { reply: text.replace('[ESCALATE]', '').trim(), needsEscalation };
}

module.exports = { isEnabled, providerName, generate };
