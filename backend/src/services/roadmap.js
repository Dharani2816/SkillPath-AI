const prisma = require('../lib/prisma');

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

// Assessment -> Training -> Certification -> First Job -> Advanced Role
function buildSteps(career, course) {
  const prog = career.careerProgression;
  return [
    {
      stage: 'ASSESSMENT',
      title: 'Career assessment',
      titleTa: 'தொழில் மதிப்பீடு',
      description: `Completed — ${career.name} is one of your top matches.`,
      descriptionTa: `முடிந்தது — ${career.nameTa} உங்களுக்குப் பொருத்தமான தொழில்களில் ஒன்று.`,
      duration: 'Done',
      nsqfLevel: null,
    },
    {
      stage: 'TRAINING',
      title: course ? course.name : `${career.name} training`,
      titleTa: `${career.nameTa} பயிற்சி`,
      description: course
        ? `${course.provider.name}, ${course.provider.district} — ${course.durationMonths} months, fee about ${rupees(course.fee)}.`
        : `${career.trainingDuration}, fee ${rupees(career.trainingCostMin)}–${rupees(career.trainingCostMax)}.`,
      descriptionTa: course
        ? `${course.provider.name}, ${course.provider.district} — ${course.durationMonths} மாதங்கள், கட்டணம் சுமார் ${rupees(course.fee)}.`
        : `${career.trainingDuration}, கட்டணம் ${rupees(career.trainingCostMin)}–${rupees(career.trainingCostMax)}.`,
      duration: career.trainingDuration,
      nsqfLevel: career.nsqfEntryLevel,
    },
    {
      stage: 'CERTIFICATION',
      title: `NSQF Level ${career.nsqfEntryLevel} certificate`,
      titleTa: `NSQF நிலை ${career.nsqfEntryLevel} சான்றிதழ்`,
      description: 'Nationally recognised NSQF-aligned certificate after passing the assessment.',
      descriptionTa: 'தேர்வில் தேர்ச்சி பெற்ற பிறகு தேசிய அளவில் அங்கீகரிக்கப்பட்ட NSQF சான்றிதழ்.',
      duration: '1 month',
      nsqfLevel: career.nsqfEntryLevel,
    },
    {
      stage: 'FIRST_JOB',
      title: prog[1] || prog[0],
      titleTa: 'முதல் வேலை',
      description: `Starting salary around ${rupees(career.salaryMin)}/month.`,
      descriptionTa: `தொடக்க சம்பளம் மாதம் சுமார் ${rupees(career.salaryMin)}.`,
      duration: '0–2 years',
      nsqfLevel: career.nsqfEntryLevel,
    },
    {
      stage: 'ADVANCED_ROLE',
      title: prog[prog.length - 1],
      titleTa: 'மேம்பட்ட பதவி',
      description: `With 3–5 years' experience, up to ${rupees(career.salaryMax)}/month. Further study: ${career.furtherEducation[0]}.`,
      descriptionTa: `3–5 ஆண்டு அனுபவத்தில் மாதம் ${rupees(career.salaryMax)} வரை. மேல்படிப்பு: ${career.furtherEducation[0]}.`,
      duration: '3–5 years',
      nsqfLevel: career.nsqfMaxLevel,
    },
  ];
}

async function upsertRoadmap(userId, careerId) {
  const career = await prisma.career.findUnique({ where: { id: careerId } });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const courses = await prisma.course.findMany({ where: { careerId }, include: { provider: true }, orderBy: { fee: 'asc' } });
  const course =
    courses.find((c) => user.district && c.provider.district.toLowerCase() === user.district.toLowerCase()) || courses[0];
  const steps = buildSteps(career, course);
  return prisma.roadmap.upsert({
    where: { userId_careerId: { userId, careerId } },
    create: { userId, careerId, steps },
    update: { steps },
  });
}

module.exports = { upsertRoadmap, buildSteps, rupees };
