import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import DevConditionToggle from './components/DevConditionToggle.jsx';
import ConsentScreen from './components/ConsentScreen.jsx';
import DebriefScreen from './components/DebriefScreen.jsx';
import ListingsPage from './components/ListingsPage.jsx';
import ListingDetail from './components/ListingDetail.jsx';
import SellerVerificationPage from './components/SellerVerificationPage.jsx';
import AuthCallback from './components/AuthCallback.jsx';
import MessagesPage from './components/MessagesPage.jsx';
import { fetchAuthStatus } from './lib/auth.js';
import { getStoredStudySession, persistStudySession } from './lib/studySession.js';

function NotFound() {
  return (
    <div className="rounded-[10px] border border-border-subtle bg-surface px-6 py-16 text-center">
      <div className="mx-auto mb-4 h-10 w-10 rounded-[10px] bg-subtle" />
      <h2 className="text-[18px] font-medium text-primary">Page not found</h2>
      <p className="mt-2 text-[14px] leading-[1.55] text-secondary">That URL does not exist in this prototype.</p>
      <Link to="/" className="mt-6 inline-flex text-[14px] font-medium text-secondary hover:text-primary">
        Back to browse
      </Link>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const ethicsReference = import.meta.env.VITE_ETHICS_REFERENCE || 'Ethics ref. pending confirmation';
  const [studySession, setStudySession] = useState(() => getStoredStudySession());
  const [authStatus, setAuthStatus] = useState({
    authenticated: false,
    googleOAuthEnabled: false,
    user: null,
  });
  const condition = studySession?.condition ?? 'A';

  useEffect(() => {
    let active = true;

    fetchAuthStatus()
      .then((status) => {
        if (active) setAuthStatus(status);
      })
      .catch(() => {
        if (active) {
          setAuthStatus({ authenticated: false, googleOAuthEnabled: false, user: null });
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

  if (!studySession && location.pathname === '/auth/callback') {
    return <AuthCallback onAuthUpdate={setAuthStatus} />;
  }

  if (!studySession) {
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
      <Navbar authStatus={authStatus} onAuthUpdate={setAuthStatus} />
      <main className="mx-auto w-full max-w-[1180px] px-6 py-6 md:py-8">
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback onAuthUpdate={setAuthStatus} />} />
          <Route
            path="/"
            element={studySession.completedAt ? <Navigate to="/debrief" replace /> : <ListingsPage condition={condition} />}
          />
          <Route
            path="/listing/:id"
            element={
              studySession.completedAt ? (
                <Navigate to="/debrief" replace />
              ) : (
                <ListingDetail
                  condition={condition}
                  participant={studySession}
                  onStudyComplete={handleStudyComplete}
                />
              )
            }
          />
          <Route
            path="/debrief"
            element={studySession.completedAt ? <DebriefScreen session={studySession} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/seller-verification"
            element={studySession.completedAt ? <Navigate to="/debrief" replace /> : <SellerVerificationPage />}
          />
          <Route
            path="/messages"
            element={studySession.completedAt ? <Navigate to="/debrief" replace /> : <MessagesPage />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-border-subtle">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-3 px-6 py-4 text-[10px] font-medium text-muted">
          <span>{ethicsReference}</span>
          <span>© 2026 CrepFinder</span>
        </div>
      </footer>
      {!studySession.completedAt && (
        <DevConditionToggle condition={condition} setCondition={handleSetCondition} />
      )}
    </div>
  );
}
