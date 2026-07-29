# CrepFinder Productization Roadmap

CrepFinder is now structured as a deployable portfolio MVP while retaining the original research workflow behind feature flags. This roadmap distinguishes a credible graduate-project release from a regulated, high-volume marketplace.

## Implemented MVP

- Browse-first product shell
- OAuth-linked accounts
- Authenticated seller listing creation
- Account-linked messages and purchase requests
- Role-aware order status transitions
- Moderated social-profile challenge flow
- Transaction-gated review eligibility
- PostgreSQL-backed application sessions
- Production configuration validation, security headers, CORS, and rate limits
- Multi-stage Docker image, Railway config-as-code, readiness checks, and graceful shutdown
- GitHub Actions tests/build plus Dependabot
- Study routes isolated behind production flags

## Before Public Portfolio Launch

1. Publish only the canonical CrepFinder folder as a clean GitHub repository.
2. Deploy the single-origin application to Railway with Neon PostgreSQL.
3. Configure one OAuth provider and test sign-in/callback/logout.
4. Add three to five polished, genuine demo listings.
5. Add a privacy policy, terms page, and data-deletion contact before moving Google OAuth beyond test users.
6. Add a live URL and CI badge to the README.
7. Record a 60-90 second walkthrough showing browse, trust evidence, sell, purchase request, and persistence after redeploy.

## StockX / Alias-Class Roadmap

### 1. Catalogue And Inventory

- Canonical sneaker catalogue with style IDs, colourways, release dates, and size variants
- Search indexing, saved searches, wishlists, market data, and price history
- Seller inventory, asks, bids, reservations, and duplicate-listing controls
- Object storage, image transformations, malware scanning, and content moderation

### 2. Money Movement

- Stripe Connect seller onboarding and KYC
- Payment intents created server-side
- Signed webhook processing with idempotency keys
- Platform fees, refunds, disputes, payout schedules, reconciliation, and ledger entries
- No order state changed to `paid` from a browser request

### 3. Fulfilment And Authenticity

- Carrier integrations, tracked labels, delivery webhooks, and address validation
- Authentication-centre workflow or a clearly bounded peer-to-peer alternative
- Chain of custody, inspection outcomes, returns, lost parcels, and evidence storage
- Service-level timers and customer notifications

### 4. Trust, Safety, And Operations

- Identity/risk scoring, device and velocity signals, sanctions checks where required
- Reports, moderation queues, suspensions, appeals, and immutable audit logs
- Admin console with least-privilege roles and mandatory MFA
- Privacy requests, retention schedules, incident response, backups, and restore drills

### 5. Scale And Reliability

- Durable queues for emails, webhooks, images, and fulfilment jobs
- Redis caching and distributed rate limits
- Structured logs, tracing, error monitoring, SLOs, alerts, and runbooks
- Idempotent migrations, staging environments, load tests, and disaster recovery

## Product Principle

Trust signals must remain explainable. CrepFinder should show what was verified, when it was verified, and what that verification does not prove. It should never turn a weak social signal into an authenticity guarantee.
