import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from './Navbar.jsx';

const authStatus = {
  authenticated: false,
  googleOAuthEnabled: false,
  linkedinOAuthEnabled: false,
  user: null,
};

describe('Navbar', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
  });

  it('provides mobile access to every primary route and closes after navigation', async () => {
    const user = userEvent.setup();

    render(<Navbar authStatus={authStatus} onAuthUpdate={vi.fn()} />);

    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));

    const mobileNavigation = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(within(mobileNavigation).getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/');
    expect(within(mobileNavigation).getByRole('link', { name: 'Sell' })).toHaveAttribute('href', '/sell');
    expect(within(mobileNavigation).getByRole('link', { name: 'Verify' })).toHaveAttribute('href', '/seller-verification');
    expect(within(mobileNavigation).getByRole('link', { name: 'Messages' })).toHaveAttribute('href', '/messages');

    await user.click(within(mobileNavigation).getByRole('link', { name: 'Sell' }));

    expect(window.location.pathname).toBe('/sell');
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
  });
});
