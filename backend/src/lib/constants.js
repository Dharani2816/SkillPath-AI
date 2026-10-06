const ROLES = ['STUDENT', 'PARENT', 'COUNSELLOR', 'ADMIN'];
const LANGUAGES = ['EN', 'TA'];
const AREA_TYPES = ['RURAL', 'SEMI_URBAN', 'URBAN'];
const INCOME_BRACKETS = ['BELOW_1L', '1L_3L', '3L_6L', 'ABOVE_6L'];
const CONCERN_TYPES = [
  'INCOME',
  'JOB_SECURITY',
  'SAFETY',
  'SOCIAL_PERCEPTION',
  'TRAINING_COST',
  'CAREER_GROWTH',
  'FURTHER_EDUCATION',
  'LOCATION',
];
const REQUEST_STATUSES = ['PENDING', 'CONTACTED', 'RESOLVED'];
const FAMILY_DECISIONS = ['EXPLORING', 'AGREED', 'UNDECIDED', 'DECLINED'];

const CONCERN_LABELS = {
  INCOME: { EN: 'Income', TA: 'வருமானம்' },
  JOB_SECURITY: { EN: 'Job Security', TA: 'வேலை நிலைத்தன்மை' },
  SAFETY: { EN: 'Safety', TA: 'பாதுகாப்பு' },
  SOCIAL_PERCEPTION: { EN: 'Social Perception', TA: 'சமூக மரியாதை' },
  TRAINING_COST: { EN: 'Training Cost', TA: 'பயிற்சி செலவு' },
  CAREER_GROWTH: { EN: 'Career Growth', TA: 'தொழில் முன்னேற்றம்' },
  FURTHER_EDUCATION: { EN: 'Further Education', TA: 'மேல்படிப்பு' },
  LOCATION: { EN: 'Location', TA: 'இடம் / தூரம்' },
};

// Ordinal ranks used to check whether a learner meets a trade's minimum education.
const EDUCATION_RANK = {
  '8th Pass': 1,
  '10th Pass': 2,
  '12th Pass': 3,
  ITI: 3,
  Diploma: 4,
  Graduate: 5,
};

const DEMO_DISCLAIMER = {
  EN: 'Demo data for prototype only — not official government statistics.',
  TA: 'இது முன்மாதிரிக்கான மாதிரி தரவு — அதிகாரப்பூர்வ அரசு புள்ளிவிவரம் அல்ல.',
};

module.exports = {
  ROLES,
  LANGUAGES,
  AREA_TYPES,
  INCOME_BRACKETS,
  CONCERN_TYPES,
  REQUEST_STATUSES,
  FAMILY_DECISIONS,
  CONCERN_LABELS,
  EDUCATION_RANK,
  DEMO_DISCLAIMER,
};
