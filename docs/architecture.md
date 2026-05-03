# Architecture Diagram

```mermaid
flowchart LR
  P["Participant browser"] --> C["Consent screen"]
  P --> OAuthStart["Optional Google sign-in"]
  OAuthStart --> Google["Google OAuth 2.0"]
  Google --> OAuthCallback["GET /api/auth/google/callback"]
  OAuthCallback --> U[("users table")]
  C --> S["POST /api/study/consent"]
  S --> PG[("Neon Postgres")]
  S --> A["Condition assignment A/B"]
  A --> B["Browse listings"]
  B --> D["Listing detail / seller panel"]
  B --> Search["Keyword and brand search"]
  D --> Msg["POST /api/messages"]
  D --> T["Trust questionnaire modal"]
  T --> Q["POST /api/trust"]
  T --> PR["POST /api/purchase-requests"]
  Q --> PG
  PR --> PG
  Msg --> PG
  T --> R["Debrief screen with P### code"]
  Seller["Seller prototype page"] --> SVS["POST /api/social-verification/start"]
  SVS --> Code["CREPFINDER-XXXXXX challenge code"]
  Seller --> SVU["POST /api/social-verification/submit"]
  SVU --> PG
  Moderator["Researcher / moderator"] --> SVA["POST approve / reject"]
  SVA --> PG
  B --> SVG["GET public seller verification status"]
  SVG --> PG

  subgraph Frontend["React + Vite frontend"]
    C
    OAuthStart
    B
    Search
    D
    Msg
    T
    R
    Seller
    Code
  end

  subgraph Backend["Node / Express API"]
    S
    OAuthCallback
    A
    Q
    PR
    E["GET /api/research/export.csv"]
    SVS
    SVU
    SVA
    SVG
  end

  E --> PG
  Researcher["Researcher"] --> E
```

## Data Captured

The backend stores participant codes, condition assignments, consent timestamps, trust questionnaire responses, selected listing IDs, social verification requests, moderation status, and exportable research data. Product listings and trust cues are controlled prototype materials rather than live marketplace records.

## OAuth Scope

Google OAuth is implemented as an optional sign-in layer. It stores account metadata on the `users` table and demonstrates a real third-party authentication integration, but it does not replace the consent screen and does not prove marketplace trustworthiness. Participant responses remain tied to the generated `P###` participant code.

## Development Methodology Trace

The implementation is documented as a hybrid methodology in `docs/project-management/`. The planning stage is represented by the fixed research flow, condition definitions, and ethical boundaries. The implementation stage is represented by a Kanban-style task board and iteration log that map prototype features to source files and validation checks.

## Social Verification Scope

The prototype implements moderated challenge-code verification as a bounded trust cue. Sellers can link a social profile, receive a unique `CREPFINDER-XXXXXX` challenge code, submit evidence, and receive a `pending`, `submitted`, `verified`, or `rejected` status. Public listing and seller-profile views expose only safe fields: platform, username/profile URL, status, and verification date.

This workflow supports the dissertation claim that CrepFinder implements social verification indicators. It does not prove legal identity, prevent scams, or guarantee product authenticity.
