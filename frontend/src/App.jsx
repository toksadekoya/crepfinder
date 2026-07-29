import { Link, Redirect, Route, Switch, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import DevConditionToggle from './components/DevConditionToggle.jsx';
import ConsentScreen from './components/ConsentScreen.jsx';
import DebriefScreen from './components/DebriefScreen.jsx';
import ListingsPage from './components/ListingsPage.jsx';
import ListingDetail from './components/ListingDetail.jsx';
import SellPage from './components/SellPage.jsx';
import SellerVerificationPage from './components/SellerVerificationPage.jsx';
import AuthCallback from './components/AuthCallback.jsx';
import MessagesPage from './components/MessagesPage.jsx';
import { fetchAuthStatus } from './lib/auth.js';
import { getStoredStudySession, persistStudySession } from './lib/studySession.js';

const studyModeEnabled = import.meta.env.VITE_ENABLE_STUDY_MODE === 'true';
const devToolsEnabled = import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';
const defaultTrustMode = import.meta.env.VITE_DEFAULT_TRUST_MODE || 'social';

function NotFound() {
  return (
    <div className="rounded-[10px] border border-border-subtle bg-surface px-6 py-16 text-center">
      <div className="mx-auto mb-4 h-10 w-10 rounded-[10px] bg-subtle" />
      <h2 className="text-[18px] font-medium text-primary">Page not found</h2>
      <p className="mt-2 text-[14px] leading-[1.55] text-secondary">That URL does not exist in CrepFinder.</p>
      <Link href="/" className="mt-6 inline-flex text-[14px] font-medium text-secondary hover:text-primary">
        Back to browse
      </Link>
    </div>
  );
}

export default function App() {
  const [location] = useLocation();
  const [studySession, setStudySession] = useState(() => (studyModeEnabled ? getStoredStudySession() : null));
  const [authStatus, setAuthStatus] = useState({
    authenticated: false,
    googleOAuthEnabled: false,
    linkedinOAuthEnabled: false,
    user: null,
  });
  const condition = studyModeEnabled ? (studySession?.condition ?? 'A') : 'A';
  const trustMode = studyModeEnabled ? (condition === 'B' ? 'ratings' : 'social') : defaultTrustMode;

  useEffect(() => {
    let active = true;

    fetchAuthStatus()
      .then((status) => {
        if (active) setAuthStatus(status);
      })
      .catch(() => {
        if (active) {
          setAuthStatus({
            authenticated: false,
            googleOAuthEnabled: false,
            linkedinOAuthEnabled: false,
            user: null,
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSetCondition = (val) => {
    if (!studySession) return;
    const nextSession = { ...studySession, condition: val };
    setStudySession(nextSession);
    persistStudySession(nextSession);
  };

  const handleStudyComplete = (listing) => {
    const nextSession = {
      ...studySession,
      completedAt: new Date().toISOString(),
      completedListingId: listing?.id ?? null,
    };

    setStudySession(nextSession);
    persistStudySession(nextSession);
  };

  if (location === '/auth/callback') {
    return <AuthCallback onAuthUpdate={setAuthStatus} />;
  }

  if (studyModeEnabled && !studySession) {
    return (
      <ConsentScreen
        onConsent={setStudySession}
        authStatus={authStatus}
        onAuthUpdate={setAuthStatus}
      />
    );
  }

  return (
    <div className="min-h-screen bg-page text-primary">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar authStatus={authStatus} onAuthUpdate={setAuthStatus} />
      <main id="main-content" className="mx-auto w-full max-w-[1180px] px-6 py-6 md:py-8" tabIndex={-1}>
        <Switch>
          <Route path="/">
            {studyModeEnabled && studySession?.completedAt
              ? <Redirect to="/debrief" replace />
              : <ListingsPage condition={condition} participant={studySession} trustMode={trustMode} />}
          </Route>
          <Route path="/listing/:id">
            {studyModeEnabled && studySession?.completedAt ? (
              <Redirect to="/debrief" replace />
            ) : (
                <ListingDetail
                  condition={condition}
                  participant={studySession}
                  authStatus={authStatus}
                  trustMode={trustMode}
                  studyMode={studyModeEnabled}
                  onStudyComplete={handleStudyComplete}
                />
            )}
          </Route>
          <Route path="/debrief">
            {studyModeEnabled && studySession?.completedAt
              ? <DebriefScreen session={studySession} />
              : <Redirect to="/" replace />}
          </Route>
          <Route path="/sell">
            <SellPage authStatus={authStatus} />
          </Route>
          <Route path="/seller-verification">
            {studyModeEnabled && studySession?.completedAt
              ? <Redirect to="/debrief" replace />
              : <SellerVerificationPage authStatus={authStatus} />}
          </Route>
          <Route path="/messages">
            {studyModeEnabled && studySession?.completedAt
              ? <Redirect to="/debrief" replace />
              : <MessagesPage authStatus={authStatus} />}
          </Route>
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </main>
      <footer className="border-t border-border-subtle">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-3 px-6 py-4 text-[10px] font-medium text-muted">
          <span>Trust cues are signals, not purchase or authenticity guarantees.</span>
          <span>© 2026 CrepFinder</span>
        </div>
      </footer>
      {studyModeEnabled && devToolsEnabled && !studySession?.completedAt && (
        <DevConditionToggle condition={condition} setCondition={handleSetCondition} />
      )}
    </div>
  );
}
