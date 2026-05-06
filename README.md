# CrepFinder

CrepFinder is a final year dissertation prototype for testing trust signals in a peer-to-peer sneaker marketplace. It is not intended to be a production marketplace. The main study flow is: consent, random A/B condition assignment, browse listings, request purchase, complete the trust questionnaire, then view the debrief and participant code.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL
- Auth: Passport.js with Google and LinkedIn OAuth 2.0, plus the original password login route

## A/B Conditions

- Condition A: social trust cues, including Google/LinkedIn OAuth account anchoring where configured, challenge-code social verification, account age, new-account flags, mutual connections and locked review counts.
- Condition B: traditional marketplace cues, including star ratings, review counts, rating distribution and recent written reviews.

The product listings, images, prices and layout are kept the same across both conditions. Only the seller trust layer changes.

## Local Setup

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create the database schema and seed data:

```bash
cd backend
npm run db:init
npm run seed
```

Run the backend:

```bash
cd backend
npm run dev
```

Run the frontend:

```bash
cd frontend
npm run dev
```

Local URLs:

```text
Backend:  http://localhost:3001
Frontend: http://localhost:5173
```

## Environment Variables

Backend:

```text
DATABASE_URL=postgres://...
SESSION_SECRET=<32+ char random string>
NODE_ENV=production
BACKEND_PUBLIC_URL=https://your-backend-url
FRONTEND_ORIGIN=https://your-frontend-url
RESEARCH_EXPORT_TOKEN=<private export token>
SOCIAL_VERIFICATION_ADMIN_TOKEN=<private moderation token>
GOOGLE_CLIENT_ID=<Google OAuth client id>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
GOOGLE_OAUTH_REDIRECT_URI=https://your-backend-url/api/auth/google/callback
LINKEDIN_CLIENT_ID=<LinkedIn OAuth client id>
LINKEDIN_CLIENT_SECRET=<LinkedIn OAuth client secret>
LINKEDIN_OAUTH_REDIRECT_URI=https://your-backend-url/api/auth/linkedin/callback
```

The backend also supports separate database variables:

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
VITE_ETHICS_REFERENCE=Ethics ref. TETHIC-2025-112494
```

`VITE_API_URL` also works as an alias for `VITE_API_BASE_URL`.

## OAuth

Google and LinkedIn OAuth are optional. If provider client IDs and secrets are not set, the study still runs without OAuth. LinkedIn sign-in uses the current OpenID Connect flow with `openid profile email` scopes.

Local redirect URIs:

```text
http://localhost:3001/api/auth/google/callback
http://localhost:3001/api/auth/linkedin/callback
```

OAuth data stored in `users`:

- Google or LinkedIn subject ID
- email
- email verification status
- display name
- avatar URL
- auth provider
- last login timestamp

OAuth is used for account anchoring only. It does not prove seller identity or guarantee seller trustworthiness.

## Tests

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm test
```

The current tests cover API route contracts, OAuth provider status, consent rendering, a basic automated accessibility check and key listing presentation helpers.

## Docker

Local Docker setup is provided for the frontend, backend and PostgreSQL database:

```bash
docker compose up --build
```

In another terminal, initialise and seed the database once the containers are running:

```bash
docker compose exec backend npm run db:init
docker compose exec backend npm run seed
```

Docker URLs:

```text
Backend:  http://localhost:3001
Frontend: http://localhost:5173
Postgres: localhost:5432
```

## Prototype Features

- Product listings
- Brand filters and keyword search
- Listing detail page
- Basic non-real-time messaging
- Google and LinkedIn OAuth sign-in when configured
- Challenge-code social verification
- Database-backed mutual connection cues
- Transaction-locked review eligibility
- Random A/B condition assignment
- McKnight trust questionnaire
- Participant code generation in `P###` format
- Debrief screen
- CSV research export

## Research Export

```text
/api/research/export.csv?token=<RESEARCH_EXPORT_TOKEN>
```

The export includes participant codes, condition assignments, consent timestamps, listing metadata and trust questionnaire responses.

## Social Verification

Routes:

```text
POST /api/social-verification/start
POST /api/social-verification/submit
GET /api/social-verification/me?user_id=<seller id>
GET /api/social-verification/seller/<seller id>
POST /api/social-verification/<verification id>/approve
POST /api/social-verification/<verification id>/reject
```

The seller receives a `CREPFINDER-XXXXXX` challenge code and submits evidence that the code appears on or alongside their social profile. Public buyer views only show safe fields: platform, username/profile URL, status and verified date.

This feature should be described as moderated social profile verification. It should not be described as fraud prevention, identity proof or product authentication.

## Development Notes

The project used a hybrid development approach. Planning was sequential because the dissertation had fixed research, ethics and evaluation requirements. The prototype was then built iteratively using a Kanban-style backlog.

Supporting notes are in:

```text
docs/project-management/hybrid-development-methodology.md
docs/project-management/kanban-board.md
docs/project-management/iteration-log.md
docs/ethics/oauth-data-use.md
docs/accessibility/wcag-2-1-aa-audit.md
docs/architecture.md
```

## Deployment Outline

1. Create a production PostgreSQL database.
2. Deploy the backend and set the backend environment variables.
3. Run `npm run db:init` and `npm run seed` against the production database.
4. Deploy the frontend.
5. Set `VITE_API_BASE_URL` to the deployed backend URL.
6. Set `FRONTEND_ORIGIN` on the backend to the deployed frontend URL.
7. Add the deployed OAuth callback URLs in Google Cloud Console and the LinkedIn Developer Portal if OAuth is being used.
8. Test the full flow: consent, browse, listing detail, purchase request, trust questionnaire and debrief.
