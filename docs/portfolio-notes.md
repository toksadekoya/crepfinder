# CrepFinder Portfolio Notes

## CV Bullet Before Deployment

Productionised CrepFinder, a full-stack sneaker marketplace built with React, Express, and PostgreSQL, adding OAuth authentication, moderated seller verification, transaction-gated reviews, role-aware order workflows, PostgreSQL-backed sessions, Docker packaging, and GitHub Actions CI while preserving a feature-flagged A/B research mode.

## CV Bullet After Deployment

Built and deployed CrepFinder, a full-stack React, Express, and PostgreSQL
sneaker marketplace on Google Cloud Run, with OAuth authentication, moderated
seller verification, transaction-gated reviews, role-aware order workflows,
PostgreSQL-backed sessions, Docker delivery, keyless GitHub Actions CI/CD, and
automated schema migrations.

Add a verified study metric only if it matches the submitted dissertation and underlying analysis. A safe extension is:

> Designed and evaluated its trust interface through a controlled, balanced-random A/B study with **[verified participant count]** participants.

## 30-Second Interview Pitch

CrepFinder began as an A/B research prototype comparing social trust cues with conventional ratings. I separated the study flow from the product, made the marketplace the production default, hardened identity and order ownership on the API, moved sessions into PostgreSQL, and packaged the React and Express services as one same-origin Docker deployment. The interesting design trade-off is that each trust cue states what it proves without presenting social verification as an authenticity guarantee.

## Strong Engineering Talking Points

- **Architecture choice:** one production origin avoids depending on third-party cookies for OAuth sessions.
- **Security boundary:** request-body user IDs are ignored for production actions; identity comes from the server-side session.
- **Data integrity:** reviews require a completed purchase record and order transitions depend on actor role.
- **Operational readiness:** configuration fails fast, database readiness is
  separate from liveness, and a Cloud Run job prepares the schema before the
  immutable application image is deployed.
- **Research reproducibility:** consent, balanced random assignment, measurement, debrief, and export remain available behind explicit flags.
- **Honest scope:** payments and authenticity operations are documented as future systems rather than implied by a purchase-request button.

## Portfolio Checklist

- [ ] Standalone GitHub repository named `crepfinder`
- [ ] Green CI run on `main`
- [ ] Cloud Run production URL
- [ ] Neon backups/restore settings reviewed
- [ ] Google or LinkedIn OAuth callback verified
- [ ] Three to five polished listings
- [ ] README live link and CI badge
- [ ] Short demo video
- [ ] Privacy, terms, and data-deletion pages before public OAuth access
