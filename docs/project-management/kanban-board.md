# Kanban Board

This board records the iterative implementation work for the CrepFinder prototype. It is intentionally lightweight and Kanban-style rather than a full agile framework: tasks are small, prioritised, and tracked by status, but the project does not claim formal Scrum ceremonies or sprint planning.

## Workflow Columns

| Column | Entry Criteria | Exit Criteria |
| --- | --- | --- |
| Backlog | Task identified from requirements, validity review, or implementation issue | Task is prioritised and has a clear implementation target |
| Ready | Task can be started without major ambiguity | Development begins |
| In Progress | Code, UI, data, or documentation is being changed | Implementation is complete enough to validate |
| Review / Validation | Build, import, route, wording, or visual checks are being run | Checks pass or follow-up work is created |
| Done | Task is implemented and documented | No further action needed unless requirements change |

## Current Board

| ID | Task | Priority | Status | Evidence |
| --- | --- | --- | --- | --- |
| CF-001 | Remove participant-visible condition labels and keep condition switching development-only | High | Done | `frontend/src/components/DevConditionToggle.jsx`, `frontend/src/App.jsx` |
| CF-002 | Redesign browse page using warm neutral design tokens | High | Done | `frontend/tailwind.config.js`, `frontend/src/styles/index.css`, `frontend/src/components/ListingsPage.jsx`, `frontend/src/components/Navbar.jsx` |
| CF-003 | Refactor listing cards so Condition A and B remain visually equivalent except trust slot | High | Done | `frontend/src/components/ListingCard.jsx`, `frontend/src/lib/listingPresentation.js` |
| CF-004 | Replace repeated placeholder sneaker image with varied listing imagery | Medium | Done | `frontend/public/listings/`, `frontend/src/mockData.js`, `backend/database/seed.js` |
| CF-005 | Add consent gate, participant code generation, and random condition assignment | High | Done | `frontend/src/components/ConsentScreen.jsx`, `frontend/src/lib/studySession.js`, `backend/routes/study.js`, `backend/database/schema.sql` |
| CF-006 | Add trust questionnaire submission and debrief flow | High | Done | `frontend/src/components/TrustModal.jsx`, `frontend/src/components/DebriefScreen.jsx`, `backend/routes/trust.js` |
| CF-007 | Add research CSV export endpoint | Medium | Done | `backend/routes/research.js`, `README.md` |
| CF-008 | Add challenge-code social verification workflow | High | Done | `backend/routes/socialVerification.js`, `frontend/src/components/SellerVerificationPage.jsx`, `frontend/src/components/SocialVerificationBadge.jsx` |
| CF-009 | Add optional Google OAuth sign-in layer without replacing consent | Low | Done | `backend/routes/auth.js`, `frontend/src/components/AuthCallback.jsx`, `frontend/src/components/ConsentScreen.jsx`, `frontend/src/components/Navbar.jsx` |
| CF-010 | Prepare deployment documentation and environment variable list | Medium | Done | `README.md`, `backend/vercel.json`, `frontend/vercel.json` |
| CF-011 | Document architecture and research boundaries | Medium | Done | `docs/architecture.md`, `README.md` |
| CF-012 | Add project-management evidence for hybrid methodology | Medium | Done | `docs/project-management/hybrid-development-methodology.md`, `docs/project-management/kanban-board.md`, `docs/project-management/iteration-log.md` |
| CF-013 | Align implementation with PID OAuth, search, messaging, account-age, and locked-review claims | High | Done | `backend/routes/auth.js`, `backend/routes/messages.js`, `backend/routes/purchaseRequests.js`, `frontend/src/components/ListingsPage.jsx`, `frontend/src/components/MessagesPage.jsx` |

## Backlog

| ID | Task | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| CF-014 | Add production database and deployment URLs | High | Backlog | Requires Neon/Railway/Vercel setup and environment variables |
| CF-015 | Capture screenshots of Condition A and Condition B for Chapter 4 | Medium | Backlog | Requires local or deployed prototype running |
| CF-016 | Pilot study with a small number of users | High | Backlog | Requires final ethics wording and stable deployed URL |

## Review / Validation Checks Used

| Check | Purpose |
| --- | --- |
| `npm run build` in `frontend` | Confirms Vite production build succeeds |
| `node -e "import('./app.js').then(() => console.log('backend app imports'))"` in `backend` | Confirms the Express app imports without syntax/module errors |
| `rg -n "indigo|violet|purple|#6366" frontend/src` | Confirms old purple condition styling is not present in source |
| `rg -n "identity verified|fraud-proof|guaranteed authentic|OAuth verified"` | Confirms interface/docs do not overclaim verification |

## Kanban Rationale

The board shows how implementation was decomposed into independent cards and prioritised by research risk. Validity blockers, such as participant-visible condition labels, were handled before design polish. Research-flow tasks, such as consent, assignment, questionnaire, debrief, and export, were prioritised before optional platform features such as OAuth.
