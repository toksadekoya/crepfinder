# CrepFinder Research Prototype

CrepFinder is a controlled A/B study prototype for a final-year dissertation on trust signals in peer-to-peer sneaker marketplaces. The app is intentionally scoped as a research instrument rather than a commercial marketplace: participants see one assigned condition, evaluate a seller, complete a trust questionnaire, and receive a debrief with a participant code.

## Study Flow

1. Consent screen creates a participant code in `P###` format.
2. The backend assigns Condition A or Condition B and stores the assignment.
3. The participant browses identical listings under their assigned condition.
4. The participant selects a listing and requests purchase.
5. The trust questionnaire is submitted against the participant code.
6. The app shows a debrief explaining the simulated trust cues and displays a copyable participant code.

## Conditions

Condition A presents social verification cues: Google OAuth account anchoring where configured, challenge-code verification status, account age, new-account flags, mutual connections, transaction-locked review count, seller status, recent buyers, and controlled community verification metadata.

Condition B presents traditional marketplace rating cues: star rating, transaction-locked review count, rating distribution, and recent written reviews.

All listing imagery, product information, layout, prices, sellers, spacing, and visual treatment are held constant except for the trust signal layer.

## Local Setup

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run db:init
npm run seed
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` to the backend on `http://localhost:3001` during local development.

## Environment Variables

Backend:

```text
DATABASE_URL=postgres://...
SESSION_SECRET=<32+ char random string>
NODE_ENV=production
BACKEND_PUBLIC_URL=https://your-backend-url
FRONTEND_ORIGIN=https://your-frontend.vercel.app
RESEARCH_EXPORT_TOKEN=<private export token>
SOCIAL_VERIFICATION_ADMIN_TOKEN=<private moderation token>
GOOGLE_CLIENT_ID=<Google OAuth client id>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
GOOGLE_OAUTH_REDIRECT_URI=https://your-backend-url/api/auth/google/callback
```

The backend also supports separate Postgres variables if `DATABASE_URL` is not used:

```text
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
```

Frontend:

```text
VITE_API_BASE_URL=https://your-backend-url
VITE_ETHICS_REFERENCE=<ethics reference once confirmed>
```

`VITE_API_URL` is also accepted as an alias for `VITE_API_BASE_URL`.

## Optional Google OAuth

Google OAuth is implemented with Passport.js as an optional sign-in layer, not as a replacement for the participant consent flow. If `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are absent, the research prototype remains usable and the Google button is hidden in production.

Backend routes:

```text
GET /api/auth/status
GET /api/auth/google
GET /api/auth/google/callback
GET /api/auth/me
POST /api/auth/logout
```

For local development, add this redirect URI to the Google Cloud OAuth client if the frontend talks directly to the backend:

```text
http://localhost:3001/api/auth/google/callback
```

For production, add the deployed backend callback URL:

```text
https://your-backend-url/api/auth/google/callback
```

OAuth stores Google account metadata on the local `users` table: Google subject ID, email, email verification status, display name, avatar URL, provider, and last login timestamp. It does not turn the seller verification badge into identity proof; the social verification workflow remains the challenge-code moderation flow described below.

## Marketplace Prototype Features

The prototype includes basic product listings, brand and keyword search, listing detail pages, a non-real-time messaging workflow, and transaction-locked review enforcement. Reviews can only be submitted through the backend after a completed prototype purchase request exists for the participant and listing. This provides the dissertation feature boundary for "locked reviews" without implementing real payment processing.

## Research Export

The researcher CSV export is available at:

```text
/api/research/export.csv?token=<RESEARCH_EXPORT_TOKEN>
```

The export includes participant codes, condition assignments, consent timestamps, listing metadata, trust measurement IDs, and all seven questionnaire responses.

## Social Verification Workflow

CrepFinder includes a moderated challenge-code verification flow for sellers:

```text
POST /api/social-verification/start
POST /api/social-verification/submit
GET /api/social-verification/me?user_id=<seller id>
GET /api/social-verification/seller/<seller id>
POST /api/social-verification/<verification id>/approve
POST /api/social-verification/<verification id>/reject
```

The start route generates a unique `CREPFINDER-XXXXXX` challenge code. The seller then submits evidence that the code appears on or alongside their linked social profile. The public seller endpoint only exposes platform, profile URL/username, status, and verification date; it does not expose challenge codes, evidence text, admin notes, or private user data.

In production, approval and rejection require `SOCIAL_VERIFICATION_ADMIN_TOKEN` via the `x-admin-token` header or `?token=` query parameter.

## Deployment Plan

1. Create a Neon Postgres project and copy the connection string.
2. Deploy the backend to Railway or another Node host.
3. Set backend environment variables, including `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV`, `BACKEND_PUBLIC_URL`, `FRONTEND_ORIGIN`, `RESEARCH_EXPORT_TOKEN`, `SOCIAL_VERIFICATION_ADMIN_TOKEN`, and OAuth variables if using Google sign-in.
4. Run `npm run db:init` and `npm run seed` against the Neon database.
5. Deploy the frontend to Vercel.
6. Set `VITE_API_BASE_URL` to the deployed backend URL.
7. Update `FRONTEND_ORIGIN` on the backend to the deployed frontend URL and redeploy the backend.
8. Add the deployed backend OAuth callback URL to the Google Cloud Console if OAuth is enabled.
9. Smoke test the full study journey end-to-end.

## Notes For Methodology

The prototype uses a bounded challenge-code workflow for social profile verification, while other marketplace trust cues such as mutual connections and review summaries remain controlled study materials. This is intentional: OAuth proves account ownership, not marketplace seller trustworthiness, and uncontrolled live marketplace data would weaken the A/B comparison. Controlled cues allow the study to isolate how different trust signal designs affect perceived trust while keeping all non-trust listing variables constant.

## Development Methodology Evidence

The project used a hybrid development approach. Early planning followed a broadly sequential structure to define the research aim, ethics constraints, experimental design, and required study flow. Implementation then proceeded iteratively using Kanban-style task tracking, with work broken into small cards and prioritised by research risk.

Project-management evidence is recorded in:

```text
docs/project-management/hybrid-development-methodology.md
docs/project-management/kanban-board.md
docs/project-management/iteration-log.md
```

These documents map completed implementation tasks to actual source files and validation checks, so the methodology chapter can truthfully describe the software artefact as iteratively developed after the sequential planning stage.

## Social Verification Boundary

CrepFinder also includes a bounded challenge-code workflow for moderated social profile verification. Sellers can link a social profile, receive a unique `CREPFINDER-XXXXXX` challenge code, submit evidence that the code appears on or alongside that profile, and wait for a moderator decision. Buyer-facing UI only claims that the seller completed CrepFinder's social verification challenge. It does not claim identity proof, fraud prevention, or product authenticity.
