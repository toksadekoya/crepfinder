# Iteration Log

This log summarises how the prototype evolved through iterative implementation passes. It is written as project evidence for the dissertation methodology chapter, linking implementation decisions to research validity and technical constraints.

## Iteration 1: Research Flow Foundation

Primary aim: make the prototype function as a controlled research instrument rather than a generic marketplace demo.

Completed work:

| Change | Rationale | Source Evidence |
| --- | --- | --- |
| Added consent screen | Participants must consent before entering the prototype | `frontend/src/components/ConsentScreen.jsx` |
| Generated participant codes in `P###` format | Enables anonymous response tracking and debrief code display | `backend/routes/study.js`, `backend/database/schema.sql` |
| Added condition assignment storage | Preserves between-subjects A/B design | `backend/routes/study.js`, `backend/database/schema.sql` |
| Added debrief screen | Discloses prototype nature after questionnaire completion | `frontend/src/components/DebriefScreen.jsx` |

Validation used:

| Check | Outcome |
| --- | --- |
| Backend import check | Passed |
| Frontend production build | Passed |

## Iteration 2: Validity Fixes And Condition Parity

Primary aim: prevent participants from discovering the experimental condition and ensure both conditions appear as one coherent marketplace.

Completed work:

| Change | Rationale | Source Evidence |
| --- | --- | --- |
| Removed visible condition banners and labels | Avoids revealing condition assignment to participants | `frontend/src/App.jsx`, `frontend/src/components/DevConditionToggle.jsx` |
| Kept condition switching development-only | Allows researcher testing without exposing the toggle to participants | `frontend/src/components/DevConditionToggle.jsx` |
| Refactored listing cards | Ensures Condition A and B differ only in the trust signal slot | `frontend/src/components/ListingCard.jsx` |
| Replaced purple styling with warm neutral tokens | Avoids colour priming and improves visual parity | `frontend/tailwind.config.js`, `frontend/src/styles/index.css` |

Validation used:

| Check | Outcome |
| --- | --- |
| Purple-reference source scan | Passed |
| Frontend production build | Passed |

## Iteration 3: High-Fidelity Browse Experience

Primary aim: reduce the "student demo" effect by improving the realism and credibility of the browse page.

Completed work:

| Change | Rationale | Source Evidence |
| --- | --- | --- |
| Added structured header, filter chips, and responsive listing grid | Creates a coherent marketplace interface while preserving research parity | `frontend/src/components/Navbar.jsx`, `frontend/src/components/FilterChips.jsx`, `frontend/src/components/ListingsPage.jsx` |
| Added varied product imagery | Prevents identical placeholders from lowering trust scores across both conditions | `frontend/public/listings/`, `frontend/src/mockData.js` |
| Standardised listing presentation helpers | Keeps typography, pricing, image, rating, and trust-cue formatting consistent | `frontend/src/lib/listingPresentation.js` |

Validation used:

| Check | Outcome |
| --- | --- |
| Frontend production build | Passed |

## Iteration 4: Measurement And Research Export

Primary aim: ensure participant responses can be collected and exported for analysis.

Completed work:

| Change | Rationale | Source Evidence |
| --- | --- | --- |
| Added trust questionnaire submission | Captures Likert-scale trust measures after purchase intent | `frontend/src/components/TrustModal.jsx`, `backend/routes/trust.js` |
| Stored trust responses against participant code | Keeps responses linkable to condition without using names | `backend/database/schema.sql`, `backend/routes/trust.js` |
| Added CSV export endpoint | Supports researcher analysis without manual database extraction | `backend/routes/research.js` |

Validation used:

| Check | Outcome |
| --- | --- |
| Backend import check | Passed |
| Frontend production build | Passed |

## Iteration 5: Bounded Social Verification

Primary aim: implement social verification as a defensible trust cue without claiming identity proof, fraud prevention, or authenticity guarantees.

Completed work:

| Change | Rationale | Source Evidence |
| --- | --- | --- |
| Added `social_verifications` table | Stores challenge-code verification state | `backend/database/schema.sql` |
| Added challenge-code routes | Allows sellers to start, submit, and check verification requests | `backend/routes/socialVerification.js` |
| Added moderator approve/reject routes | Keeps verification bounded and manually moderated | `backend/routes/socialVerification.js` |
| Added seller verification page | Lets sellers generate a code and submit evidence | `frontend/src/components/SellerVerificationPage.jsx` |
| Added buyer-facing verification badge | Displays public-safe verification state as a trust cue | `frontend/src/components/SocialVerificationBadge.jsx`, `frontend/src/components/ListingCard.jsx`, `frontend/src/components/ListingDetail.jsx` |

Validation used:

| Check | Outcome |
| --- | --- |
| Backend import check | Passed |
| Frontend production build | Passed |
| Overclaim wording scan | Passed except intentional boundary statements |

## Iteration 6: Optional OAuth Layer

Primary aim: add a real third-party sign-in integration without making OAuth central to the research design.

Completed work:

| Change | Rationale | Source Evidence |
| --- | --- | --- |
| Added Passport.js Google OAuth routes | Demonstrates third-party authentication integration aligned with the PID stack | `backend/routes/auth.js` |
| Added OAuth metadata to users table | Stores Google subject ID and profile metadata | `backend/database/schema.sql` |
| Added frontend callback screen | Completes OAuth redirect flow | `frontend/src/components/AuthCallback.jsx` |
| Added optional sign-in controls | Makes OAuth visible when configured while preserving consent-first study flow | `frontend/src/components/ConsentScreen.jsx`, `frontend/src/components/Navbar.jsx` |

Validation used:

| Check | Outcome |
| --- | --- |
| Backend import check | Passed |
| Frontend production build | Passed |
| `/api/auth/status` local route check | Passed when backend was restarted |

## Iteration 7: PID Alignment Pass

Primary aim: make the implementation materially align with PID statements about OAuth, search, messaging, account-age flags, and locked reviews.

Completed work:

| Change | Rationale | Source Evidence |
| --- | --- | --- |
| Refactored OAuth through Passport.js | Aligns implementation with the PID technology stack while preserving the consent-first research flow | `backend/app.js`, `backend/routes/auth.js`, `backend/package.json` |
| Added account-age and new-account indicators | Supports the PID identity-anchoring feature without overclaiming identity proof | `backend/routes/listings.js`, `frontend/src/lib/listingPresentation.js`, `frontend/src/components/ListingDetail.jsx` |
| Added keyword listing search | Supports the PID requirement for product search | `frontend/src/components/ListingsPage.jsx` |
| Added basic non-real-time messaging | Supports the PID messaging feature without adding real-time chat complexity | `backend/routes/messages.js`, `frontend/src/components/MessagesPage.jsx`, `frontend/src/components/ListingDetail.jsx` |
| Added purchase-request records and locked-review enforcement | Supports transaction-locked reviews without real payments | `backend/routes/purchaseRequests.js`, `backend/routes/reviews.js`, `backend/database/schema.sql` |
| Added OAuth data-use documentation | Supports GDPR/ethics transparency for OAuth profile data | `docs/ethics/oauth-data-use.md`, `frontend/src/components/ConsentScreen.jsx` |

Validation used:

| Check | Outcome |
| --- | --- |
| Backend import check | Passed |
| Frontend production build | Passed |

## Summary

The iteration log supports the claim that implementation was not completed as a single linear build. Instead, the artefact was refined through task-based passes, with high-risk research validity issues addressed before optional engineering features. This is consistent with a Kanban-style workflow layered on top of an initially sequential dissertation plan.
