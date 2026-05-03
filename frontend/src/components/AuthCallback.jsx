import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAuthStatus } from '../lib/auth.js';

const errorCopy = {
  access_denied: 'Google sign-in was cancelled.',
  email_not_verified: 'Google did not confirm a verified email address for this account.',
  invalid_state: 'The sign-in session expired. Please try again.',
  not_configured: 'Google sign-in is not configured for this environment.',
  profile_fetch_failed: 'Google sign-in completed, but the profile could not be loaded.',
  token_exchange_failed: 'Google sign-in could not be completed.',
  oauth_failed: 'Google sign-in failed. Please try again.',
};

export default function AuthCallback({ onAuthUpdate }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing Google sign-in...');
  const status = searchParams.get('oauth');
  const reason = searchParams.get('reason');

  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      if (status !== 'success') {
        setMessage(errorCopy[reason] || 'Google sign-in could not be completed.');
        return;
      }

      try {
        const authStatus = await fetchAuthStatus();
        if (!active) return;

        onAuthUpdate(authStatus);
        setMessage('Google sign-in complete. Returning to the study...');
        window.setTimeout(() => navigate('/', { replace: true }), 900);
      } catch {
        if (active) setMessage('Sign-in completed, but the local session could not be refreshed.');
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
          <h1 className="text-[26px] font-medium tracking-[-0.03em] text-primary">Google Sign-In</h1>
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
