// Lightweight rule-based language understanding for the prototype (English + Tamil keywords).

const CONCERN_KEYWORDS = {
  INCOME: ['salary', 'earn', 'income', 'money', 'pay', 'wage', 'how much', 'சம்பளம்', 'வருமானம்', 'பணம்', 'சம்பாதி', 'ஊதியம்'],
  JOB_SECURITY: ['job', 'stable', 'security', 'permanent', 'placement', 'unemploy', 'hire', 'hiring', 'demand', 'வேலை கிடைக்', 'வேலைவாய்ப்பு', 'நிரந்தர', 'நிலையான', 'வேலை பாதுகாப்பு'],
  SAFETY: ['safe', 'danger', 'risk', 'accident', 'injur', 'shock', 'hurt', 'ஆபத்து', 'விபத்து', 'பாதுகாப்பா', 'அபாயம்'],
  SOCIAL_PERCEPTION: ['respect', 'status', 'society', 'relative', 'marriage', 'prestige', 'shame', 'low job', 'people say', 'மரியாதை', 'சமூக', 'உறவினர்', 'திருமண', 'கௌரவ', 'மதிப்பு'],
  TRAINING_COST: ['fee', 'cost', 'afford', 'loan', 'scholarship', 'expensive', 'கட்டணம்', 'செலவு', 'கடன்', 'உதவித்தொகை'],
  CAREER_GROWTH: ['growth', 'promotion', 'future', 'grow', 'business', 'later', 'senior', 'முன்னேற்ற', 'பதவி உயர்வு', 'எதிர்கால', 'சொந்த தொழில்'],
  FURTHER_EDUCATION: ['degree', 'diploma', 'study further', 'college', 'higher stud', 'engineering', 'continue stud', 'மேல்படிப்பு', 'பட்டம்', 'டிப்ளமோ', 'கல்லூரி', 'படிப்பை தொடர'],
};

const ESCALATION_KEYWORDS = ['counsellor', 'counselor', 'human', 'real person', 'talk to someone', 'call me', 'speak to', 'ஆலோசகர்', 'நபரிடம்', 'பேச வேண்டும்', 'அழையுங்கள்'];
const GREETING_KEYWORDS = ['hello', 'hi', 'hey', 'vanakkam', 'வணக்கம்', 'நமஸ்காரம்'];

const CONCERNED_WORDS = ['worried', 'worry', 'afraid', 'scared', 'fear', 'not sure', 'doubt', 'unsure', 'risky', "don't want", 'dont want', 'not good', 'low status', 'no future', 'cannot afford', "can't afford", 'useless', 'waste', 'கவலை', 'பயம்', 'சந்தேகம்', 'முடியாது', 'வேண்டாம்', 'தயக்கம்', 'நம்பிக்கை இல்லை'];
const REASSURED_WORDS = ['ok', 'okay', 'good', 'great', 'thank', 'convinced', 'makes sense', 'happy', 'agree', 'sounds fine', 'helpful', 'clear now', 'understood', 'நன்றி', 'சரி', 'நல்லது', 'புரிந்தது', 'திருப்தி', 'சம்மதம்', 'மகிழ்ச்சி'];

const isLatinLetter = (ch) => ch >= 'a' && ch <= 'z';

// English keywords must start at a word boundary ("ok" should not match "book"); Tamil uses substring match.
function matches(text, word) {
  if (!isLatinLetter(word[0])) return text.includes(word);
  let i = text.indexOf(word);
  while (i !== -1) {
    if (i === 0 || !isLatinLetter(text[i - 1])) return true;
    i = text.indexOf(word, i + 1);
  }
  return false;
}

const countMatches = (text, words) => words.filter((w) => matches(text, w)).length;

function detectConcern(message) {
  const text = message.toLowerCase();
  let best = null;
  let bestScore = 0;
  Object.entries(CONCERN_KEYWORDS).forEach(([type, words]) => {
    // Longer phrase matches count more, so "வேலை பாதுகாப்பு" beats a bare "பாதுகாப்பு".
    const score = words.reduce((s, w) => (matches(text, w) ? s + w.length : s), 0);
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  });
  return best;
}

function classifySentiment(message) {
  const text = message.toLowerCase();
  const concerned = countMatches(text, CONCERNED_WORDS);
  const reassured = countMatches(text, REASSURED_WORDS);
  if (concerned > reassured) return 'CONCERNED';
  if (reassured > concerned) return 'REASSURED';
  return 'NEUTRAL';
}

const wantsHuman = (message) => countMatches(message.toLowerCase(), ESCALATION_KEYWORDS) > 0;

const isGreeting = (message) => {
  const text = message.toLowerCase().trim();
  return text.length < 25 && GREETING_KEYWORDS.some((g) => text.startsWith(g) && !isLatinLetter(text[g.length] || ' '));
};

module.exports = { detectConcern, classifySentiment, wantsHuman, isGreeting };
