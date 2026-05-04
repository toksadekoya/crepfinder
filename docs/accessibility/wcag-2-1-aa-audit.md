# WCAG 2.1 AA Accessibility Pass

This note records the accessibility work completed on the CrepFinder prototype. It is written as project evidence rather than a formal certification.

## Scope

Checked screens:

- Participant consent
- Browse listings
- Listing detail
- Trust questionnaire modal
- Seller verification
- Messages
- Debrief

Target standard: WCAG 2.1 AA.

## Implemented

- `html lang="en"` and responsive viewport metadata are present.
- Main application layout includes a keyboard skip link to the main content.
- Primary navigation is labelled and uses `aria-current` for the active route.
- Interactive filter chips use `aria-pressed`.
- Listing cards include descriptive accessible labels with product, price, size and seller.
- Product images use descriptive `alt` text.
- Form fields use visible labels or screen-reader labels.
- Status and error messages use `role="status"` or `role="alert"` where appropriate.
- The trust questionnaire modal uses `role="dialog"`, `aria-modal`, labelled heading and close-button text.
- Trust questionnaire rating controls are grouped with fieldsets and labelled radio inputs.
- Visible focus styles are defined globally with `:focus-visible`.
- Reduced-motion preferences are respected through a global `prefers-reduced-motion` rule.
- Colour choices use the warm neutral design token set and avoid low-contrast purple accents.
- A frontend `jest-axe` smoke test checks the consent screen for obvious automated accessibility violations.

## Manual Checks

- The prototype can be navigated using keyboard tab order across the main study flow.
- Focus remains visible on links, buttons, form controls and the trust questionnaire.
- The consent screen can be completed without OAuth.
- The browse page remains usable at mobile, tablet and desktop widths.
- The trust questionnaire can be completed using only keyboard input.
- The debrief participant code can be reached and copied with keyboard navigation.

## Limits

- This is a prototype audit, not an external accessibility certification.
- No production screen-reader lab test has been completed.
- No large-scale usability test with disabled participants has been completed.
- The final deployed URL should be rechecked after deployment because hosting, browser autofill and OAuth redirects can affect the experience.
