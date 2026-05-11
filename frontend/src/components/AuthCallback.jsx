import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAuthStatus, persistOAuthConnection } from '../lib/auth.js';

const errorCopy = {
  access_denied: 'OAuth sign-in was cancelled.',
  email_not_verified: 'The provider did not confirm a verified email address for this account.',
  invalid_state: 'The sign-in session expired. Please try again.',
  not_configured: 'OAuth sign-in is not configured for this environment.',
  profile_fetch_failed: 'OAuth sign-in completed, but the profile could not be loaded.',
  token_exchange_failed: 'OAuth sign-in could not be completed.',
  oauth_failed: 'OAuth sign-in failed. Please try again.',
};

export default function AuthCallback({ onAuthUpdate }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing OAuth sign-in...');
  const status = searchParams.get('oauth');
  const reason = searchParams.get('reason');

  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      if (status !== 'success') {
        setMessage(errorCopy[reason] || 'OAuth sign-in could not be completed.');
        return;
      }

      try {
        const authStatus = await fetchAuthStatus();
        if (!active) return;

        persistOAuthConnection({
          provider: authStatus?.user?.auth_provider || 'google',
          email: authStatus?.user?.email || null,
          displayName: authStatus?.user?.display_name || null,
          connectedAt: new Date().toISOString(),
        });
        onAuthUpdate(authStatus);
        setMessage('OAuth sign-in complete. Returning to the study...');
        window.setTimeout(() => navigate('/', { replace: true }), 900);
      } catch {
        persistOAuthConnection({
          provider: 'google',
          email: null,
          displayName: null,
          connectedAt: new Date().toISOString(),
        });
        if (active) {
          setMessage('OAuth sign-in complete. Returning to the study...');
          window.setTimeout(() => navigate('/', { replace: true }), 900);
        }
      }
    }

    finishSignIn();

    return () => {
      active = false;
    };
  }, [navigate, onAuthUpdate, reason, status]);

  return (
    <div className="min-h-screen bg-page text-primary">
      <main className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col justify-center px-6 py-10">
        <div className="rounded-[10px] border border-border-subtle bg-surface p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-[2px] bg-primary" aria-hidden="true" />
            <span className="text-[15px] font-medium tracking-[-0.02em] text-primary">CrepFinder</span>
          </div>
          <h1 className="text-[26px] font-medium tracking-[-0.03em] text-primary">OAuth Sign-In</h1>
          <p className="mt-3 text-[14px] leading-[1.55] text-secondary">{message}</p>
          {status !== 'success' && (
            <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-surface">
              Return to study
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
