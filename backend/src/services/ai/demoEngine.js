// Offline counsellor: answers parental concerns from stored career + outcome data, in simple English or Tamil.
// Used whenever no LLM key is configured, and as the fallback if the LLM call fails.
const { rupees } = require('../roadmap');
const { DEMO_DISCLAIMER } = require('../../lib/constants');

const NO_DATA = {
  EN: "I don't have verified information for this specific question. Would you like to speak with a counsellor?",
  TA: 'இந்தக் கேள்விக்கு என்னிடம் சரிபார்க்கப்பட்ட தகவல் இல்லை. நீங்கள் ஒரு ஆலோசகருடன் பேச விரும்புகிறீர்களா?',
};

const ESCALATE = {
  EN: 'Of course. I can connect you with a human counsellor who speaks your language. Shall I raise a request for a call back?',
  TA: 'நிச்சயமாக. உங்கள் மொழியில் பேசும் ஆலோசகருடன் உங்களை இணைக்க முடியும். திரும்ப அழைக்க கோரிக்கை அனுப்பட்டுமா?',
};

const FOLLOW_UP = {
  EN: 'Do you have any other worry? You can ask about salary, job security, safety, respect in society, fees, growth or further studies.',
  TA: 'வேறு ஏதாவது கவலை உள்ளதா? சம்பளம், வேலை நிலைத்தன்மை, பாதுகாப்பு, சமூக மரியாதை, கட்டணம், முன்னேற்றம், மேல்படிப்பு பற்றி கேட்கலாம்.',
};

const INCOME_MONTHS = { BELOW_1L: 7000, '1L_3L': 16000, '3L_6L': 37000, ABOVE_6L: 60000 };

function greeting(ctx, lang) {
  const careerName = ctx.career ? (lang === 'TA' ? ctx.career.nameTa : ctx.career.name) : null;
  if (lang === 'TA') {
    return `வணக்கம்! நான் SkillPath ஆலோசனை உதவியாளர். ${careerName ? `${careerName} பற்றி ` : ''}உங்கள் குடும்பத்தின் சந்தேகங்களுக்கு எளிய முறையில் பதில் சொல்கிறேன். ${FOLLOW_UP.TA}`;
  }
  return `Hello! I am the SkillPath counselling assistant. I can answer your family's questions${careerName ? ` about ${careerName}` : ''} in simple words. ${FOLLOW_UP.EN}`;
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

function where(o, lang) {
  if (o.scope === 'DISTRICT') return lang === 'TA' ? `${o.district} மாவட்டத்தில்` : `in ${o.district}`;
  return lang === 'TA' ? 'எங்கள் தரவில் உள்ள மாவட்டங்களில்' : 'across districts in our dataset';
}

const ANSWERS = {
  INCOME(ctx, lang) {
    const c = ctx.career;
    const o = ctx.outcomeSummary;
    if (!o.count) return null;
    if (lang === 'TA') {
      return `${c.nameTa} பயிற்சி முடித்தவர்கள் ${where(o, lang)} முதல் வேலையில் மாதம் சராசரியாக ${rupees(o.avgEarnings)} சம்பாதிக்கிறார்கள் (${rupees(o.earningsMin)} – ${rupees(o.earningsMax)}). இது ${o.sampleSize} பேரின் தகவல். 3–5 ஆண்டு அனுபவத்திற்குப் பிறகு மாதம் ${rupees(c.salaryMax)} வரை சம்பாதிக்க முடியும்.`;
    }
    return `People trained as ${c.name} ${where(o, lang)} earned about ${rupees(o.avgEarnings)} per month on average in their first job (range ${rupees(o.earningsMin)} – ${rupees(o.earningsMax)}), based on ${o.sampleSize} learners. With 3–5 years of experience, earnings can grow to about ${rupees(c.salaryMax)} per month.`;
  },
  JOB_SECURITY(ctx, lang) {
    const c = ctx.career;
    const o = ctx.outcomeSummary;
    if (!o.count) return null;
    const demand = { HIGH: ['high', 'அதிகம்'], MEDIUM: ['steady', 'நிலையானது'], LOW: ['limited', 'குறைவு'] }[c.demandLevel] || ['steady', 'நிலையானது'];
    if (lang === 'TA') {
      return `${where(o, lang)} ${c.nameTa} பயிற்சி பெற்றவர்களில் ${o.placementRate}% பேருக்கு வேலை கிடைத்தது. இந்தத் தொழிலுக்கான தேவை ${demand[1]}. ${c.sector} துறையில் நிறுவனங்கள் தொடர்ந்து ஆட்களை எடுக்கின்றன, மேலும் சொந்தமாகத் தொழில் செய்யவும் வாய்ப்பு உண்டு.`;
    }
    return `${cap(where(o, lang))}, ${o.placementRate}% of trained ${c.name}s got placed in a job. Demand for this trade is ${demand[0]} — employers in the ${c.sector} sector hire regularly, and the skill also allows self-employment, so the learner is not dependent on a single employer.`;
  },
  SAFETY(ctx, lang) {
    return lang === 'TA' ? ctx.career.safetyNotesTa : ctx.career.safetyNotes;
  },
  SOCIAL_PERCEPTION(ctx, lang) {
    const c = ctx.career;
    const top = c.careerProgression[c.careerProgression.length - 1];
    if (lang === 'TA') {
      return `${c.perceptionNotesTa} NSQF சான்றிதழ் இந்தியா முழுவதும் அங்கீகரிக்கப்பட்டது. அனுபவத்துடன் "${top}" நிலை வரை உயரலாம் — இது ஒரு மதிப்பான, திறமை சார்ந்த தொழில்.`;
    }
    return `${c.perceptionNotes} The NSQF certificate is recognised across India, and with experience your child can grow to "${top}" — a respected, skill-based profession, not a dead end.`;
  },
  TRAINING_COST(ctx, lang) {
    const c = ctx.career;
    const cheapest = c.courses[0];
    const o = ctx.outcomeSummary;
    const monthly = o.count ? o.avgEarnings : c.salaryMin;
    const fee = cheapest ? cheapest.fee : c.trainingCostMin;
    const payback = Math.max(1, Math.ceil(fee / monthly));
    const income = ctx.student && INCOME_MONTHS[ctx.student.householdIncome];
    if (lang === 'TA') {
      let text = `${c.nameTa} பயிற்சிக் கட்டணம் ${rupees(c.trainingCostMin)} முதல் ${rupees(c.trainingCostMax)} வரை. `;
      if (cheapest) text += `குறைந்த கட்டண வாய்ப்பு: ${cheapest.provider.name} (${cheapest.provider.district}) — ${rupees(cheapest.fee)}. `;
      text += `முதல் வேலையின் சம்பளத்தில் சுமார் ${payback} மாதத்தில் இந்தச் செலவை திரும்பப் பெறலாம்.`;
      if (income && income < 20000) text += ' அரசு ஐடிஐ-களில் கட்டணம் பொதுவாகக் குறைவு; உதவித்தொகை வாய்ப்புகள் பற்றி ஆலோசகரிடம் கேட்கலாம்.';
      return text;
    }
    let text = `Training for ${c.name} costs between ${rupees(c.trainingCostMin)} and ${rupees(c.trainingCostMax)}. `;
    if (cheapest) text += `The lowest-fee option in our data is ${cheapest.provider.name} (${cheapest.provider.district}) at ${rupees(cheapest.fee)}. `;
    text += `At first-job earnings, this cost is recovered in about ${payback} month${payback > 1 ? 's' : ''}.`;
    if (income && income < 20000) text += ' Government ITIs usually have much lower fees — a counsellor can tell you about scholarships you may be eligible for.';
    return text;
  },
  CAREER_GROWTH(ctx, lang) {
    const c = ctx.career;
    const steps = c.careerProgression.join(' → ');
    if (lang === 'TA') {
      return `${c.nameTa} தொழில் வளர்ச்சிப் பாதை: ${steps}. NSQF நிலை ${c.nsqfEntryLevel}-இல் தொடங்கி நிலை ${c.nsqfMaxLevel} வரை உயரலாம். சம்பளம் மாதம் ${rupees(c.salaryMin)}-இல் தொடங்கி ${rupees(c.salaryMax)} வரை உயரும்.`;
    }
    return `The growth path for ${c.name} is: ${steps}. The learner starts at NSQF Level ${c.nsqfEntryLevel} and can move up to Level ${c.nsqfMaxLevel}. ${c.nsqfInfo} Salary grows from about ${rupees(c.salaryMin)} to ${rupees(c.salaryMax)} per month.`;
  },
  FURTHER_EDUCATION(ctx, lang) {
    const c = ctx.career;
    const routes = c.furtherEducation.join('; ');
    if (lang === 'TA') {
      return `இந்தப் பயிற்சி படிப்பின் முடிவு அல்ல. ${c.nameTa} பயிற்சிக்குப் பிறகு மேல்படிப்பு வழிகள்: ${routes}. வேலை செய்துகொண்டே படிப்பைத் தொடரவும் முடியும்.`;
    }
    return `Vocational training does not close the door to further studies. After ${c.name} training, routes include: ${routes}. Many learners continue studying while earning.`;
  },
  LOCATION(ctx, lang) {
    const c = ctx.career;
    const district = ctx.district;
    const near = district ? c.courses.filter((x) => x.provider.district.toLowerCase() === district.toLowerCase()) : [];
    const o = ctx.outcomeSummary;
    if (!near.length && o.scope !== 'DISTRICT') return null;
    if (lang === 'TA') {
      let text = '';
      if (near.length) text += `${district} மாவட்டத்திலேயே பயிற்சி பெறலாம்: ${near.map((x) => x.provider.name).join(', ')}. வெளியூர் செல்ல வேண்டியதில்லை. `;
      if (o.scope === 'DISTRICT') text += `${district} பகுதியில் பயிற்சி பெற்றவர்களில் ${o.placementRate}% பேருக்கு வேலை கிடைத்தது.`;
      return text.trim();
    }
    let text = '';
    if (near.length) text += `Training is available in ${district} itself: ${near.map((x) => x.provider.name).join(', ')}, so your child does not need to move away. `;
    if (o.scope === 'DISTRICT') text += `In ${district}, ${o.placementRate}% of trained learners found work, so jobs are available close to home.`;
    return text.trim();
  },
};

function overview(ctx, lang) {
  const c = ctx.career;
  const o = ctx.outcomeSummary;
  if (lang === 'TA') {
    let text = `${c.nameTa}: ${c.descriptionTa} பயிற்சி காலம் ${c.trainingDuration}.`;
    if (o.count) text += ` ${where(o, lang)} ${o.placementRate}% பேருக்கு வேலை கிடைத்தது, சராசரி மாத சம்பளம் ${rupees(o.avgEarnings)}.`;
    return text;
  }
  let text = `${c.name}: ${c.description} Training takes ${c.trainingDuration}.`;
  if (o.count) text += ` ${cap(where(o, lang))}, ${o.placementRate}% were placed, earning about ${rupees(o.avgEarnings)} per month on average.`;
  return text;
}

// Adds a short note tailored to the family when the learner may need a bridge to the course.
function tailoring(ctx, lang) {
  const edu = ctx.student && ctx.student.educationLevel;
  if (edu === '8th Pass' && ctx.career && ctx.career.minEducation !== '8th Pass') {
    return lang === 'TA'
      ? ` குறிப்பு: இந்தப் படிப்புக்கு ${ctx.career.minEducation} தேவை; ஆலோசகர் இணைப்பு வழிகளைச் சொல்வார்.`
      : ` Note: this course needs ${ctx.career.minEducation}; a counsellor can explain bridge options.`;
  }
  return '';
}

function respond(ctx, { message, concernType, language, wantsHuman, isGreeting }) {
  const lang = language === 'TA' ? 'TA' : 'EN';

  if (wantsHuman) return { reply: ESCALATE[lang], needsEscalation: true };
  if (isGreeting && !concernType) return { reply: greeting(ctx, lang), needsEscalation: false };
  if (!ctx.career) return { reply: NO_DATA[lang], needsEscalation: true };

  const answer = concernType ? ANSWERS[concernType](ctx, lang) : overview(ctx, lang);
  if (!answer) return { reply: NO_DATA[lang], needsEscalation: true };

  const usedOutcomes = ['INCOME', 'JOB_SECURITY', 'TRAINING_COST', 'LOCATION', null].includes(concernType || null) && ctx.outcomeSummary.count;
  const disclaimer = usedOutcomes && ctx.outcomeSummary.isDemo ? `\n\n(${DEMO_DISCLAIMER[lang]})` : '';
  return {
    reply: `${answer}${tailoring(ctx, lang)}${disclaimer}\n\n${FOLLOW_UP[lang]}`,
    needsEscalation: false,
  };
}

module.exports = { respond, NO_DATA, ESCALATE };
