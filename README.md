# SkillPath AI

**Family-centred AI counselling for vocational careers** — a Smart India Hackathon prototype.

Most career-guidance tools only talk to the learner. In rural and semi-urban India, though, parents often make (or veto) the decision, and they see vocational training as lower-status than a degree. SkillPath AI counsels the **learner and the family together**. It answers parents' worries about income, job security, safety and social standing in **Tamil or English**, using structured outcome data. When the AI cannot resolve a worry, the family is passed to a **human counsellor**. Scheme administrators get a dashboard showing **where and why family resistance is concentrated**.

> ⚠️ **Prototype.** All career outcome figures are **DEMO DATA**: synthetic values made for demonstration, **not official government statistics**. Every response carries a `DEMO` label, and the data model is built so verified datasets can replace the demo data.

```
Learner + Parent → AI counselling → Career evidence → Parent concerns
      → AI explanation → Family decision → Human counsellor (if unresolved)
      → Admin resistance analytics
```

---

## Architecture

```
skillpath-ai/
├── frontend/                React 18 + Vite + Tailwind v4 + Recharts + Lucide
│   └── src/
│       ├── api/client.js     Axios instance (JWT header, /api proxy)
│       ├── context/          Auth + language (EN / TA) providers
│       ├── lib/i18n.js       All UI strings in English and Tamil, concern metadata
│       ├── components/       Layout, evidence cards, roadmap timeline, counsellor form…
│       └── pages/            Public, student/ and parent/ screens
└── backend/                 Node.js + Express + Prisma (PostgreSQL)
    ├── prisma/
    │   ├── schema.prisma    Data model (17 models)
    │   ├── seed.js          Demo accounts, catalogue, families, chats
    │   └── data/careers.js  10 bilingual career definitions
    ├── scripts/smoke-test.js  End-to-end API test
    └── src/
        ├── app.js / index.js
        ├── middleware/      JWT auth, role guard, error handling
        ├── data/questions.js  10-question bilingual assessment
        ├── routes/          auth, profile, assessment, recommendations, careers,
        │                    outcomes, family, ai, counsellor, admin
        └── services/
            ├── recommendation.js  Explainable weighted matcher
            ├── outcomes.js        Outcome aggregation (district → state fallback)
            ├── roadmap.js         5-stage career roadmap
            ├── family.js          Family linking + parent view
            ├── nlu.js             Rule-based concern & sentiment detection (EN + TA)
            └── ai/
                ├── index.js       Chat orchestration + storage
                ├── context.js     Grounding facts for the family
                ├── demoEngine.js  Offline bilingual counsellor (no API key needed)
                └── llmProvider.js Optional Anthropic / OpenAI-compatible LLM
```

It is a single Express app on a single Postgres database, with no extra infrastructure. The Vite dev server proxies `/api` to the backend on port 5000.

## Setup

**Requirements:** Node.js 18+ and PostgreSQL 13+.

```bash
cd backend
npm install
cp .env.example .env          # then edit DATABASE_URL
npm run setup                 # creates tables (migration "init") + seeds demo data
npm run dev                   # API on http://localhost:5000
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev                   # app on http://localhost:5173
```

Run the backend end-to-end API test (with the backend running):

```bash
cd backend && npm test
```

Other scripts: `npm run db:seed` re-seeds (it wipes all data first), `npm run db:reset` drops and rebuilds the database, and `npm start` runs without nodemon.

## Demo accounts

All demo accounts use the password **`SkillPath@123`**.

| Role | Email | Notes |
|---|---|---|
| Student | `student@skillpath.demo` | Arun Kumar, Madurai, 10th pass. Assessment done; top match Solar PV Technician |
| Parent | `parent@skillpath.demo` | Lakshmi Kumar (mother), prefers Tamil. Linked to Arun (family code `ARUN01`) |
| Counsellor | `counsellor@skillpath.demo` | Priya Raman. Has pending, contacted and resolved requests in the queue |
| Admin | `admin@skillpath.demo` | Sees the resistance analytics |

The seed also creates 16 synthetic families across 8 Tamil Nadu districts (`<name>.student@…` / `<name>.parent@…`, e.g. `karthik.parent@skillpath.demo`). Their chats run through the real AI pipeline, so the dashboard has realistic concern and sentiment patterns. Rural districts (Villupuram, Dharmapuri) are scripted to show higher social-perception and safety resistance.

## Frontend

The main demo journey is: Student → Assessment → Recommendations → Parent connection → Parent concern → Evidence → AI counselling → Decision or counsellor escalation.

| Area | Screens |
|---|---|
| Public | Landing, Login (one-tap demo accounts), Register (learner or parent), Explore careers, Career detail, Outcome evidence |
| Student | Dashboard, Profile, Assessment, Results, My matches, Career roadmap, Family Centre, AI counsellor, Family career plan (printable) |
| Parent | Dashboard, Family Centre, Career evidence, Concerns, AI counsellor, Talk to a counsellor |

- **Language.** The English / தமிழ் toggle in the header switches every label on the main journey. After login, the app opens in the user's saved language. Chat questions go to the AI in the selected language.
- **Family Decision Centre.** Shows the learner's profile, the recommended career (switchable between the top 3) and its evidence. Families tap large concern cards, which are saved to the backend and open the AI counsellor with that question already asked. The family's decision is recorded on the same screen.
- **AI counsellor.** Each answer comes with evidence cards for placement, earnings, training and NSQF progression, with the card for the asked concern highlighted. The cards carry a DEMO / VERIFIED badge and the data source. Suggested questions are tap-to-ask. 👍 / 👎 feedback updates the stored sentiment. Answers can be read aloud when the browser has a voice for that language. When the AI can't answer, the family stays concerned or they tap 👎, a "Would you like to speak with a counsellor?" card appears. It opens a prefilled request form (concern, language, district, call time).
- **Low-literacy design.** Large text and tap targets, icons on every action, buttons instead of dropdowns, short sentences, visual timelines and progress rings, and icon tab navigation on phones.
- **Not built yet.** Counsellor and admin accounts only see a read-only request queue; their consoles come in the next phase.

## Database

| Area | Models |
|---|---|
| People | `User` (role STUDENT / PARENT / COUNSELLOR / ADMIN, language EN / TA), `StudentProfile` (education, area type, income bracket), `ParentProfile` |
| Family | `Family` (connect code, district, decision, selected career), `FamilyConcern` (8 concern types incl. LOCATION; OPEN → ESCALATED → ADDRESSED) |
| Catalogue | `Career` (bilingual, NSQF entry/max, progression, further education, safety & perception notes), `TrainingProvider`, `Course` |
| Evidence | `OutcomeData`: placement rate, earnings range/average, NSQF level, next progression level, further-education route, sample size, data source, **verificationStatus `VERIFIED` / `DEMO`** |
| Matching | `Assessment` (tag scores), `AssessmentAnswer`, `Recommendation` (component scores + bilingual reasons), `Roadmap` |
| Counselling | `Conversation`, `ChatMessage` (concern, sentiment, escalation flag, data sources used), `CounsellorRequest` (PENDING / CONTACTED / RESOLVED), `SentimentRecord` (before → after per concern) |

**Replacing demo data:** load official rows into `OutcomeData` with `verificationStatus = VERIFIED` and a real `dataSource`. The API aggregates them automatically. `GET /api/outcomes/:id?verifiedOnly=true` hides demo rows, and the disclaimer disappears once no demo rows are in a summary.

## API

All endpoints are under `/api`. Authenticated endpoints need `Authorization: Bearer <token>`. Most read endpoints accept `?lang=EN|TA`.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | – | Register a STUDENT or PARENT. A student automatically gets a family with a connect code. A parent may pass `connectCode` |
| POST | `/auth/login` | – | Returns `{ token, user }` |
| GET / PUT | `/profile` | any | View / update user + role profile (district, education, income bracket, language…) |
| GET | `/assessment/questions` | – | 10 bilingual questions (scoring tags hidden) |
| GET | `/assessment/latest` | student / parent | Latest scores grouped into interests, aptitude, skills, work style and learning, plus readiness and strengths (parents see their child's) |
| POST | `/assessment/submit` | student | `{ answers: [{ questionId, optionId }] }`. Scores the answers and generates the top 3 matches |
| POST | `/recommendations/generate` | student | Regenerates the top 3 from the latest assessment |
| GET | `/recommendations` | student / parent / staff | Top 3 with component scores, reasons, local evidence and roadmap. Parents see their linked child's results; staff pass `?studentId=` |
| GET | `/recommendations/roadmaps` | same | Stored roadmaps |
| GET | `/careers` | – | All careers + outcome summary (`?district=` for local figures) |
| GET | `/careers/:idOrSlug` | – | Career detail, courses, providers, outcome rows |
| GET | `/outcomes/:careerIdOrSlug` | – | Outcome rows + weighted summary + demo disclaimer (`?district=`, `?verifiedOnly=true`) |
| POST | `/family/connect` | student / parent | Parent: `{ connectCode }` or `{ studentEmail }`. Student: `{ parentEmail }` |
| GET | `/family` | any | Family, members, concerns and each student's recommendations with evidence + roadmap |
| POST | `/family/concerns` | student / parent | `{ concerns: ["INCOME","SAFETY",…], careerId?, details? }` |
| PATCH | `/family/decision` | student / parent | `{ decision: EXPLORING/AGREED/UNDECIDED/DECLINED, selectedCareerId? }` |
| POST | `/ai/chat` | any | `{ message, conversationId?, careerId?, concernType?, language? }` → see below |
| POST | `/ai/feedback` | any | `{ conversationId, sentiment }` (for 👍 / 👎 buttons) |
| GET | `/ai/conversations` | any | The family's conversations with messages |
| GET | `/ai/status` | any | Which AI provider is active |
| POST | `/counsellor/request` | any | `{ concern? , conversationId?, concernType?, language?, location?, preferredTime? }` |
| GET | `/counsellor/requests` | any | Counsellor/admin: the full queue (`?status=`). Families: their own requests |
| PATCH | `/counsellor/requests/:id` | counsellor / admin | `{ status, notes }`. Assigns the counsellor; RESOLVED marks the concern ADDRESSED |
| GET | `/admin/analytics` | admin / counsellor | Resistance dashboard data |

**`POST /api/ai/chat` response**

```json
{
  "conversationId": "…",
  "reply": "மதுரை மாவட்டத்தில் சோலார் பிவி … (இது முன்மாதிரிக்கான மாதிரி தரவு …)",
  "language": "TA",
  "concernType": "INCOME",
  "sentiment": "NEUTRAL",
  "sentimentShift": { "before": "CONCERNED", "after": "REASSURED" },
  "needsEscalation": false,
  "escalation": null,
  "sources": { "career": "Solar PV Technician", "outcomeScope": "DISTRICT", "outcomeRecords": 1, "dataLabel": "DEMO" },
  "provider": "demo"
}
```

**`GET /api/admin/analytics`** returns:

- `overview`
- `concernsByType`, with reassured and improved rates for each concern
- `resistanceByDistrict`, `resistanceByAreaType` and `resistanceByIncome`, each with a resistance index, top concern, still-concerned rate and declined families
- the `sentimentShift` matrix (before → after)
- `concernsByCareer`
- `escalations`, by status, concern and language
- `familyDecisions`
- conversations by language and over the last 14 days

## AI approach

**1. Career matching ("AI-assisted career matching").** Each answer adds weights to tags: interests (`int_*`), aptitudes (`apt_*`), skills (`sk_*`), work preference (`wp_*`) and learning preference (`lp_*`). Tag totals are normalised to 0–100. Each career is then scored as:

| Component | Weight | How it is computed |
|---|---|---|
| Interest match | 30% | Best matching interest tag (70%) + mean of the career's interest tags (30%) |
| Skill match | 25% | Mean of the career's skill tags (50%) + whether the learner meets the minimum education (50%) |
| Aptitude match | 20% | Mean of the career's aptitude / work-style tags |
| Local opportunity | 15% | Placement rate in the learner's district (falls back to trade demand) |
| Career growth | 10% | Career growth score |

The top 3 are stored with every component score and plain-language reasons in English and Tamil, e.g. *"interest in clean energy; strong practical (hands-on) aptitude; strong career growth"*. This is a transparent heuristic, **not a scientifically validated test**.

**2. Counselling chat.** For every message the backend:

1. Builds the family context: the learner's district, education and income bracket, the career (explicit, then the family's choice, then the top recommendation), outcome data for that district (falling back to state level) and courses.
2. Detects the concern (income, job security, safety, social perception, cost, growth, further education, location) and the sentiment with English + Tamil keyword rules.
3. Answers:
   - **No API key (default):** the offline `demoEngine` fills simple, bilingual answer templates with the stored figures. For example, a cost answer works out how many months of first-job salary it takes to pay back the fee. It adds a scholarship hint for low-income households and a bridge-course note when the learner lacks the minimum education.
   - **With `LLM_API_KEY`:** an LLM (Anthropic by default, or any OpenAI-compatible endpoint) gets *only* the same grounding facts as JSON. It is told never to invent numbers, to reply in simple Tamil or English, and to emit `[ESCALATE]` when the facts don't cover the question. If the LLM call fails, the demo engine answers instead.
4. If there is no relevant data, it says *"I don't have verified information for this specific question. Would you like to speak with a counsellor?"* and sets `needsEscalation`.
5. It also escalates when the user asks for a human, or stays concerned for 3 turns.

**3. Sentiment.** Messages are classified CONCERNED / NEUTRAL / REASSURED using keyword rules. A `SentimentRecord` per (conversation, concern) stores the **before** sentiment (raising a worry counts as concerned) and the latest **after** sentiment. `/ai/feedback` lets 👍 / 👎 buttons override it for low-literacy users.

## Demo data limitations

- Outcome figures (placement %, earnings, sample sizes), course fees and provider names are **synthetic**. Providers are fictional and labelled "(Demo)". Nothing represents a real institute or an official statistic.
- Career descriptions, NSQF levels and progression paths are indicative summaries for the demo and should be checked against official NSQF / NCVET qualification files before real use.
- Concern detection and sentiment are keyword-based. They miss nuance, sarcasm and code-mixed Tanglish.
- The Tamil text is kept simple for parents but has not been reviewed by a professional translator.
- The resistance index is an illustrative heuristic for the dashboard, not a validated measure.
- Authentication is basic JWT with no refresh tokens or rate limiting. Fine for a demo, not for production.
