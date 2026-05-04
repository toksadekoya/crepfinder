# OAuth Data Use And GDPR Note

CrepFinder implements Google OAuth 2.0 and LinkedIn OpenID Connect sign-in as optional authentication mechanisms for the prototype. OAuth is used to anchor an account to a third-party provider; it is not treated as proof of real-world identity, seller reliability, fraud prevention, or product authenticity.

## Data Stored

When a user chooses OAuth sign-in, the backend stores the following fields in the `users` table:

| Field | Purpose |
| --- | --- |
| `google_id` | Stable Google subject identifier used to recognise returning Google users |
| `linkedin_id` | Stable LinkedIn subject identifier used to recognise returning LinkedIn users |
| `email` | Account contact identifier returned by the OAuth provider |
| `display_name` | Display name for the local prototype account |
| `avatar_url` | Optional profile image URL for avatar display |
| `oauth_email_verified` | Whether the provider reported the email address as verified |
| `auth_provider` | Records whether the account was created via Google or LinkedIn |
| `last_login_at` | Records the last successful OAuth sign-in time |

The prototype does not request access to Gmail, contacts, Drive, calendar, LinkedIn posting permissions, LinkedIn contacts, or other provider services beyond sign-in profile data.

## Consent And Transparency

The participant consent screen explains that Google or LinkedIn sign-in is optional and that study responses are stored against a participant code rather than the participant's name. The debrief also clarifies that OAuth only verifies control of a provider account and should not be interpreted as proof of seller trustworthiness.

## Data Minimisation

OAuth data is limited to the minimum profile fields required for account sign-in and display. Trust measurement responses remain tied to the generated `P###` participant code. This separation supports the study design while reducing the amount of personal data required for analysis.

## Dissertation Boundary

The implementation supports this claim:

> CrepFinder includes optional Google and LinkedIn OAuth 2.0 authentication that anchors local prototype accounts to a third-party provider account.

It does not support this claim:

> CrepFinder verifies a seller's real-world identity or prevents fraudulent marketplace behaviour.
