import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
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
  { label: 'Sell', href: '/sell' },
  { label: 'Verify', href: '/seller-verification' },
  { label: 'Messages', href: '/messages' },
];

export default function Navbar({ authStatus, onAuthUpdate }) {
  const [pathname] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const showOAuthControl = user || providerButtons.some((provider) => provider.enabled);

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
      <div className="mx-auto w-full max-w-[1180px] px-6">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="shrink-0" aria-label="CrepFinder home">
            <span className="font-logo text-[16px] font-bold tracking-normal text-primary">
              CrepFinder
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <nav className="hidden items-center gap-4 sm:flex" aria-label="Primary navigation">
              {navItems.map((item) => {
                const active = pathname === item.href
                  || (item.href === '/' && pathname.startsWith('/listing/'));
                const classes = active ? 'text-primary' : 'text-muted';

                return (
                  <Link
                    key={item.label}
                    href={item.href}
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

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center text-secondary transition-colors hover:text-primary sm:hidden"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>

            <div
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-subtle text-[11px] font-medium text-secondary"
              title={user ? `Signed in as ${user.display_name || user.email}` : connectedProvider ? signedInLabel : 'Guest user'}
              aria-label={user ? `Signed in as ${user.display_name || user.email}` : connectedProvider ? signedInLabel : 'Guest user'}
            >
              {avatarLabel}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-border-subtle pb-4 sm:hidden"
          >
            <nav className="grid grid-cols-2" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const active = pathname === item.href
                  || (item.href === '/' && pathname.startsWith('/listing/'));

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 items-center border-b border-border-subtle text-[13px] font-medium ${
                      active ? 'text-primary' : 'text-secondary'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {showOAuthControl && (
              <div className="flex flex-wrap items-center gap-2 pt-3">
                {connectedProvider ? (
                  <>
                    <span className="mr-auto text-[12px] font-medium text-secondary">
                      {connectedEmail || signedInLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={signingOut}
                      className="min-h-10 px-2 text-[12px] font-medium text-secondary disabled:cursor-not-allowed disabled:text-muted"
                    >
                      {signingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </>
                ) : (
                  providerButtons.map((provider) => (
                    <button
                      key={provider.label}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        provider.onClick();
                      }}
                      disabled={!provider.enabled}
                      className="min-h-10 px-2 text-[12px] font-medium text-secondary disabled:cursor-not-allowed disabled:text-muted"
                      title={provider.enabled ? `Continue with ${provider.label}` : `Set ${provider.label} OAuth env vars to enable sign-in`}
                    >
                      {provider.enabled ? `Continue with ${provider.label}` : `${provider.label} sign-in unavailable`}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
