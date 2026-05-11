import { useState } from 'react';
import api from '../lib/api.js';
import { beginGoogleOAuth, beginLinkedInOAuth, getInitials, logout } from '../lib/auth.js';
import { createFallbackStudySession, persistStudySession } from '../lib/studySession.js';

export default function ConsentScreen({ onConsent, authStatus, onAuthUpdate }) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const user = authStatus?.user;
  const oauthProviders = [
    { label: 'Google', enabled: authStatus?.googleOAuthEnabled, onClick: beginGoogleOAuth },
    { label: 'LinkedIn', enabled: authStatus?.linkedinOAuthEnabled, onClick: beginLinkedInOAuth },
  ];
  const showOAuthPanel = user || oauthProviders.some((provider) => provider.enabled) || import.meta.env.DEV;

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      onAuthUpdate({
        authenticated: false,
        googleOAuthEnabled: authStatus?.googleOAuthEnabled ?? false,
        linkedinOAuthEnabled: authStatus?.linkedinOAuthEnabled ?? false,
        user: null,
      });
    } catch {
      setError('Could not sign out. Please refresh and try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const handleStart = async () => {
    if (!accepted) {
      setError('Please confirm consent before continuing.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data } = await api.post('/api/study/consent', { consented: true });
      const session = {
        participantCode: data.participant_code,
        condition: data.condition_name,
        consentedAt: data.consented_at,
      };

      persistStudySession(session);
      onConsent(session);
    } catch {
      if (import.meta.env.DEV) {
        const session = createFallbackStudySession();
        persistStudySession(session);
        onConsent(session);
        return;
      }

      setError('The study session could not be created. Please refresh and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-primary">
      <main id="main-content" className="mx-auto flex min-h-screen w-full max-w-[760px] flex-col justify-center px-6 py-10">
        <div className="space-y-8">
          <div className="space-y-3">
            <div>
              <span className="font-logo text-[16px] font-bold tracking-[-0.03em] text-primary">CrepFinder</span>
            </div>
            <h1 className="text-[26px] font-medium tracking-[-0.03em] text-primary">Participant Consent</h1>
            <p className="text-[14px] leading-[1.55] text-secondary">
              This study asks you to browse a fictional peer-to-peer sneaker marketplace and evaluate one seller.
              No real purchase will be made, and the marketplace content is part of a research prototype.
            </p>
          </div>

          <div className="grid gap-3 text-[14px] leading-[1.55] text-secondary">
            <div className="rounded-[10px] border border-border-subtle bg-surface p-4">
              Participation is voluntary. You may stop at any point before submitting the trust questionnaire.
            </div>
            <div className="rounded-[10px] border border-border-subtle bg-surface p-4">
              Your responses are stored against a participant code rather than your name.
            </div>
            <div className="rounded-[10px] border border-border-subtle bg-surface p-4">
              The interface condition is assigned automatically so the comparison remains controlled.
            </div>
            <div className="rounded-[10px] border border-border-subtle bg-surface p-4">
              If you choose optional Google or LinkedIn sign-in, the prototype stores your account ID, email,
              display name, avatar URL and login time for authentication only. The study responses remain linked
              to your participant code.
            </div>
          </div>

          {showOAuthPanel && (
            <div className="rounded-[10px] border border-border-subtle bg-surface p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-[13px] font-medium text-secondary">
                    {user ? getInitials(user) : 'G'}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-primary">
                      {user ? `Signed in as ${user.display_name || user.email}` : 'Optional OAuth sign-in'}
                    </p>
                    <p className="mt-1 text-[12px] leading-[1.45] text-muted">
                      {user
                        ? 'Your study responses still use the participant code, not your name.'
                        : 'Not required for the study. Used only if the prototype is configured to demonstrate account anchoring.'}
                    </p>
                  </div>
                </div>

                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={signingOut}
                    className="rounded-full border border-border-subtle px-4 py-2 text-[12px] font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary disabled:cursor-not-allowed disabled:text-muted"
                  >
                    {signingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {oauthProviders.map((provider) => (
                      <button
                        key={provider.label}
                        type="button"
                        onClick={provider.onClick}
                        disabled={!provider.enabled}
                        className="rounded-full border border-border-subtle px-4 py-2 text-[12px] font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary disabled:cursor-not-allowed disabled:text-muted"
                      >
                        {provider.enabled ? `Continue with ${provider.label}` : `${provider.label} sign-in not configured`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <label className="flex items-start gap-3 rounded-[10px] border border-border-subtle bg-surface p-4 text-[14px] leading-[1.55] text-secondary">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 accent-stone-950"
            />
            <span>
              I confirm that I understand the study information and consent to take part in this research prototype.
            </span>
          </label>

          {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleStart}
              disabled={submitting}
              className="rounded-full bg-primary px-6 py-3 text-[14px] font-medium text-surface transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted"
            >
              {submitting ? 'Creating study session...' : 'Begin Study'}
            </button>
            <p className="text-[12px] leading-[1.55] text-muted">
              Your participant code will be shown on the debrief screen.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
