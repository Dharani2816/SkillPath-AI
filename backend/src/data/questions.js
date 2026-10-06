// Prototype assessment: 10 short, picture-friendly questions.
// Each option adds weights to matcher tags (int_* interest, apt_* aptitude,
// sk_* skill, wp_* work preference, lp_* learning preference).

const QUESTIONS = [
  {
    id: 'q1',
    category: 'interest',
    text: 'Which of these would you enjoy doing the most?',
    textTa: 'இவற்றில் எதைச் செய்ய உங்களுக்கு மிகவும் பிடிக்கும்?',
    options: [
      { id: 'a', text: 'Fixing wiring, lights or fans at home', textTa: 'வீட்டில் வயரிங், விளக்கு, மின்விசிறி சரிசெய்வது', tags: { int_electrical: 3 } },
      { id: 'b', text: 'Repairing phones, radios or circuit boards', textTa: 'கைபேசி, ரேடியோ, சர்க்யூட் போர்டு பழுது பார்ப்பது', tags: { int_electronics: 3 } },
      { id: 'c', text: 'Repairing bikes or vehicles', textTa: 'பைக், வாகனங்கள் பழுது பார்ப்பது', tags: { int_automobile: 3, int_mechanical: 1 } },
      { id: 'd', text: 'Working with computers', textTa: 'கணினியில் வேலை செய்வது', tags: { int_computers: 3 } },
    ],
  },
  {
    id: 'q2',
    category: 'interest',
    text: 'Which topic interests you more?',
    textTa: 'எந்த விஷயம் உங்களுக்கு அதிக ஆர்வம் தருகிறது?',
    options: [
      { id: 'a', text: 'Solar and wind energy, clean environment', textTa: 'சூரிய, காற்று மின்சக்தி, சுத்தமான சுற்றுச்சூழல்', tags: { int_renewable: 3, int_electrical: 1 } },
      { id: 'b', text: 'Machines and how things are made', textTa: 'இயந்திரங்கள், பொருட்கள் எப்படி செய்யப்படுகின்றன', tags: { int_mechanical: 3, int_fabrication: 1 } },
      { id: 'c', text: 'Joining metal and building structures', textTa: 'உலோகம் இணைத்தல், கட்டமைப்புகள் உருவாக்குதல்', tags: { int_fabrication: 3 } },
      { id: 'd', text: 'Cooling machines like fridges and ACs', textTa: 'ஃப்ரிட்ஜ், ஏசி போன்ற குளிர்விக்கும் இயந்திரங்கள்', tags: { int_cooling: 3, int_electrical: 1 } },
    ],
  },
  {
    id: 'q3',
    category: 'practical_aptitude',
    text: 'When something breaks at home, what do you usually do?',
    textTa: 'வீட்டில் ஏதாவது பழுதானால் நீங்கள் பொதுவாக என்ன செய்வீர்கள்?',
    options: [
      { id: 'a', text: 'Open it and try to fix it myself', textTa: 'நானே திறந்து சரிசெய்ய முயற்சிப்பேன்', tags: { apt_hands_on: 3, apt_problem_solving: 1, sk_tools: 1 } },
      { id: 'b', text: 'Watch someone fix it and help them', textTa: 'யாராவது சரிசெய்யும்போது பார்த்து உதவுவேன்', tags: { apt_hands_on: 2 } },
      { id: 'c', text: 'Search for the solution on my phone', textTa: 'கைபேசியில் தீர்வைத் தேடுவேன்', tags: { sk_computer: 2, apt_problem_solving: 1 } },
      { id: 'd', text: 'Wait for a repair person', textTa: 'பழுது பார்ப்பவருக்காக காத்திருப்பேன்', tags: {} },
    ],
  },
  {
    id: 'q4',
    category: 'technical_interest',
    text: 'How comfortable are you using tools like a screwdriver, spanner or tester?',
    textTa: 'ஸ்க்ரூடிரைவர், ஸ்பானர், டெஸ்டர் போன்ற கருவிகளைப் பயன்படுத்துவதில் எவ்வளவு பழக்கம்?',
    options: [
      { id: 'a', text: 'Very comfortable', textTa: 'நன்றாகப் பழக்கம்', tags: { sk_tools: 3, apt_hands_on: 1 } },
      { id: 'b', text: 'Somewhat comfortable', textTa: 'ஓரளவு பழக்கம்', tags: { sk_tools: 2 } },
      { id: 'c', text: 'Used them a little', textTa: 'கொஞ்சம் பயன்படுத்தியிருக்கிறேன்', tags: { sk_tools: 1 } },
      { id: 'd', text: 'Never used them', textTa: 'பயன்படுத்தியதே இல்லை', tags: {} },
    ],
  },
  {
    id: 'q5',
    category: 'problem_solving',
    text: 'A fan has stopped working. What would you check first?',
    textTa: 'மின்விசிறி ஓடவில்லை. முதலில் எதைச் சரிபார்ப்பீர்கள்?',
    options: [
      { id: 'a', text: 'The switch and power supply', textTa: 'சுவிட்ச் மற்றும் மின்சாரம் வருகிறதா', tags: { apt_problem_solving: 3, int_electrical: 1 } },
      { id: 'b', text: 'The motor and moving parts', textTa: 'மோட்டார் மற்றும் சுழலும் பாகங்கள்', tags: { apt_technical: 2, int_mechanical: 1 } },
      { id: 'c', text: 'I would ask someone', textTa: 'யாரிடமாவது கேட்பேன்', tags: { apt_problem_solving: 1 } },
      { id: 'd', text: 'Buy a new fan', textTa: 'புதிய மின்விசிறி வாங்குவேன்', tags: {} },
    ],
  },
  {
    id: 'q6',
    category: 'technical_interest',
    text: 'How do you feel about measurements and calculations?',
    textTa: 'அளவீடுகள் மற்றும் கணக்குகள் பற்றி உங்கள் எண்ணம் என்ன?',
    options: [
      { id: 'a', text: 'I enjoy them', textTa: 'எனக்குப் பிடிக்கும்', tags: { sk_maths: 3, apt_precision: 2, apt_technical: 1 } },
      { id: 'b', text: 'Okay if they are simple', textTa: 'எளிமையாக இருந்தால் சரி', tags: { sk_maths: 2, apt_precision: 1 } },
      { id: 'c', text: 'I prefer drawings and diagrams', textTa: 'வரைபடங்கள் எனக்குப் பிடிக்கும்', tags: { sk_drawing: 3, apt_precision: 1 } },
      { id: 'd', text: 'I avoid them', textTa: 'தவிர்த்துவிடுவேன்', tags: {} },
    ],
  },
  {
    id: 'q7',
    category: 'work_preference',
    text: 'Where would you like to work?',
    textTa: 'நீங்கள் எங்கே வேலை செய்ய விரும்புகிறீர்கள்?',
    options: [
      { id: 'a', text: 'Outdoors — rooftops, sites', textTa: 'வெளியே — மாடிகள், கட்டுமான இடங்கள்', tags: { wp_outdoor: 3, wp_field: 1 } },
      { id: 'b', text: 'In a workshop or factory', textTa: 'பட்டறை அல்லது தொழிற்சாலையில்', tags: { wp_workshop: 3 } },
      { id: 'c', text: 'Indoors — office or service shop', textTa: 'உள்ளே — அலுவலகம் அல்லது சர்வீஸ் கடை', tags: { wp_indoor: 3 } },
      { id: 'd', text: 'Visiting customers at their homes', textTa: 'வாடிக்கையாளர் வீடுகளுக்குச் சென்று', tags: { wp_field: 3, sk_customer: 1 } },
    ],
  },
  {
    id: 'q8',
    category: 'work_preference',
    text: 'What kind of work suits you?',
    textTa: 'எந்த வகையான வேலை உங்களுக்குப் பொருந்தும்?',
    options: [
      { id: 'a', text: 'Physically active work', textTa: 'உடல் உழைப்பு அதிகமுள்ள வேலை', tags: { apt_physical: 3 } },
      { id: 'b', text: 'Careful, precise work with my hands', textTa: 'கவனமாக, துல்லியமாக கையால் செய்யும் வேலை', tags: { apt_precision: 3, apt_hands_on: 1 } },
      { id: 'c', text: 'A mix of both', textTa: 'இரண்டும் கலந்தது', tags: { apt_physical: 1, apt_precision: 1, apt_hands_on: 1 } },
      { id: 'd', text: 'Mostly sitting, working on a screen', textTa: 'பெரும்பாலும் உட்கார்ந்து திரையில் வேலை', tags: { sk_computer: 2, wp_indoor: 2 } },
    ],
  },
  {
    id: 'q9',
    category: 'learning_preference',
    text: 'How do you learn best?',
    textTa: 'நீங்கள் எப்படி சிறப்பாகக் கற்றுக்கொள்கிறீர்கள்?',
    options: [
      { id: 'a', text: 'By doing it myself', textTa: 'நானே செய்து பார்த்து', tags: { lp_practical: 3, apt_hands_on: 1 } },
      { id: 'b', text: 'By watching videos or demos', textTa: 'வீடியோ அல்லது செய்முறை பார்த்து', tags: { lp_visual: 3 } },
      { id: 'c', text: 'By reading books', textTa: 'புத்தகம் படித்து', tags: { lp_theory: 3 } },
      { id: 'd', text: 'A teacher explaining step by step', textTa: 'ஆசிரியர் படிப்படியாக விளக்கும்போது', tags: { lp_theory: 1, lp_practical: 1, lp_visual: 1 } },
    ],
  },
  {
    id: 'q10',
    category: 'work_preference',
    text: 'Do you like talking to people and solving their problems?',
    textTa: 'மக்களிடம் பேசி அவர்களின் பிரச்சினைகளைத் தீர்ப்பது பிடிக்குமா?',
    options: [
      { id: 'a', text: 'Yes, very much', textTa: 'ஆம், மிகவும் பிடிக்கும்', tags: { sk_customer: 3 } },
      { id: 'b', text: 'Sometimes', textTa: 'சில நேரங்களில்', tags: { sk_customer: 2 } },
      { id: 'c', text: 'I prefer working alone', textTa: 'தனியாக வேலை செய்வதே பிடிக்கும்', tags: { apt_technical: 1, apt_precision: 1 } },
      { id: 'd', text: 'I prefer working in a team', textTa: 'குழுவாக வேலை செய்வது பிடிக்கும்', tags: { apt_physical: 1, wp_workshop: 1 } },
    ],
  },
];

// Highest weight each tag can reach across the whole test — used to normalise to 0-100.
const TAG_MAX = QUESTIONS.reduce((acc, q) => {
  const perQuestion = {};
  q.options.forEach((o) =>
    Object.entries(o.tags).forEach(([tag, w]) => {
      perQuestion[tag] = Math.max(perQuestion[tag] || 0, w);
    }),
  );
  Object.entries(perQuestion).forEach(([tag, w]) => {
    acc[tag] = (acc[tag] || 0) + w;
  });
  return acc;
}, {});

const TAG_LABELS = {
  int_electrical: { EN: 'interest in electrical work', TA: 'மின் வேலையில் ஆர்வம்' },
  int_electronics: { EN: 'interest in electronics', TA: 'எலக்ட்ரானிக்ஸில் ஆர்வம்' },
  int_mechanical: { EN: 'interest in machines', TA: 'இயந்திரங்களில் ஆர்வம்' },
  int_automobile: { EN: 'interest in vehicles', TA: 'வாகனங்களில் ஆர்வம்' },
  int_computers: { EN: 'interest in computers', TA: 'கணினியில் ஆர்வம்' },
  int_fabrication: { EN: 'interest in metal work', TA: 'உலோக வேலையில் ஆர்வம்' },
  int_cooling: { EN: 'interest in cooling systems', TA: 'குளிர்சாதனங்களில் ஆர்வம்' },
  int_renewable: { EN: 'interest in clean energy', TA: 'பசுமை மின்சக்தியில் ஆர்வம்' },
  apt_hands_on: { EN: 'strong practical (hands-on) aptitude', TA: 'கையால் செய்யும் திறன் அதிகம்' },
  apt_technical: { EN: 'technical thinking', TA: 'தொழில்நுட்ப சிந்தனை' },
  apt_problem_solving: { EN: 'good problem solving', TA: 'பிரச்சினை தீர்க்கும் திறன்' },
  apt_precision: { EN: 'careful, precise working style', TA: 'கவனமான, துல்லியமான வேலை' },
  apt_physical: { EN: 'comfortable with active work', TA: 'உடல் உழைப்புக்குத் தயார்' },
  sk_tools: { EN: 'comfort with tools', TA: 'கருவிகளில் பழக்கம்' },
  sk_maths: { EN: 'comfort with measurement', TA: 'அளவீட்டில் பழக்கம்' },
  sk_computer: { EN: 'computer comfort', TA: 'கணினிப் பழக்கம்' },
  sk_drawing: { EN: 'reads drawings well', TA: 'வரைபடம் புரிந்துகொள்ளும் திறன்' },
  sk_customer: { EN: 'good with people', TA: 'மக்களிடம் பழகும் திறன்' },
  wp_outdoor: { EN: 'prefers outdoor work', TA: 'வெளிப்புற வேலை விருப்பம்' },
  wp_workshop: { EN: 'prefers workshop work', TA: 'பட்டறை வேலை விருப்பம்' },
  wp_indoor: { EN: 'prefers indoor work', TA: 'உள்ளரங்கு வேலை விருப்பம்' },
  wp_field: { EN: 'happy to visit customers', TA: 'வாடிக்கையாளரிடம் செல்லத் தயார்' },
  lp_practical: { EN: 'learns by doing', TA: 'செய்து கற்றுக்கொள்பவர்' },
  lp_visual: { EN: 'learns by watching', TA: 'பார்த்து கற்றுக்கொள்பவர்' },
  lp_theory: { EN: 'learns by reading', TA: 'படித்து கற்றுக்கொள்பவர்' },
};

module.exports = { QUESTIONS, TAG_MAX, TAG_LABELS };
