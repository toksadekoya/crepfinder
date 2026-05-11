import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  beginGoogleOAuth,
  beginLinkedInOAuth,
  clearOAuthConnection,
  getInitials,
  getStoredOAuthConnection,
  logout,
} from '../lib/auth.js';

const navItems = [
  { label: 'Browse', href: '/' },
  { label: 'Sell', href: '/seller-verification' },
  { label: 'Messages', href: '/messages' },
];

export default function Navbar({ authStatus, onAuthUpdate }) {
  const { pathname } = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const user = authStatus?.user;
  const storedConnection = getStoredOAuthConnection();
  const connectedProvider = user?.auth_provider || storedConnection?.provider;
  const connectedEmail = user?.email || storedConnection?.email;
  const avatarLabel = user ? getInitials(user) : connectedProvider ? 'G' : 'GU';
  const signedInLabel = connectedProvider === 'linkedin' ? 'LinkedIn connected' : 'Google connected';
  const providerButtons = [
    { label: 'Google', enabled: authStatus?.googleOAuthEnabled, onClick: beginGoogleOAuth },
    { label: 'LinkedIn', enabled: authStatus?.linkedinOAuthEnabled, onClick: beginLinkedInOAuth },
  ];
  const showOAuthControl = user
    || providerButtons.some((provider) => provider.enabled)
    || import.meta.env.DEV;

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      clearOAuthConnection();
      onAuthUpdate?.({
        authenticated: false,
        googleOAuthEnabled: authStatus?.googleOAuthEnabled ?? false,
        linkedinOAuthEnabled: authStatus?.linkedinOAuthEnabled ?? false,
        user: null,
      });
    } finally {
      if (!authStatus?.authenticated) clearOAuthConnection();
      setSigningOut(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-20 bg-surface/95 backdrop-blur"
      style={{ borderBottom: '0.5px solid var(--border-subtle)' }}
    >
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="CrepFinder home">
          <span className="h-3.5 w-3.5 rounded-[2px] bg-primary" aria-hidden="true" />
          <span className="text-[15px] font-medium tracking-[-0.02em] text-primary">
            CrepFinder
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-4 sm:flex" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = item.href
                ? pathname === item.href || (item.href === '/' && pathname.startsWith('/listing/'))
                : false;
              const classes = active ? 'text-primary' : 'text-muted';

              if (!item.href) {
                return (
                  <span key={item.label} className={`text-[12px] font-medium ${classes}`}>
                    {item.label}
                  </span>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-[12px] font-medium ${classes}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {showOAuthControl && (
            connectedProvider ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-subtle px-3 py-1.5 text-[12px] font-medium text-primary"
                  title={connectedEmail || signedInLabel}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  {signedInLabel}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="rounded-full border border-border-subtle px-3 py-1.5 text-[12px] font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary disabled:cursor-not-allowed disabled:text-muted"
                >
                  {signingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                {providerButtons.map((provider) => (
                  <button
                    key={provider.label}
                    type="button"
                    onClick={provider.onClick}
                    disabled={!provider.enabled}
                    className="rounded-full border border-border-subtle px-3 py-1.5 text-[12px] font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary disabled:cursor-not-allowed disabled:text-muted"
                    title={provider.enabled ? `Continue with ${provider.label}` : `Set ${provider.label} OAuth env vars to enable sign-in`}
                  >
                    {provider.enabled ? provider.label : `${provider.label} off`}
                  </button>
                ))}
              </div>
            )
          )}

          <div
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-subtle text-[11px] font-medium text-secondary"
            title={user ? `Signed in as ${user.display_name || user.email}` : connectedProvider ? signedInLabel : 'Guest user'}
            aria-label={user ? `Signed in as ${user.display_name || user.email}` : connectedProvider ? signedInLabel : 'Guest user'}
          >
            {avatarLabel}
          </div>
        </div>
      </div>
    </header>
  );
}
