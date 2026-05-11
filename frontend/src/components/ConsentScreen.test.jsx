import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import ConsentScreen from './ConsentScreen.jsx';

vi.mock('../lib/api.js', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('ConsentScreen', () => {
  it('explains optional OAuth without blocking the study', () => {
    render(
      <ConsentScreen
        onConsent={vi.fn()}
        onAuthUpdate={vi.fn()}
        authStatus={{
          authenticated: false,
          googleOAuthEnabled: true,
          linkedinOAuthEnabled: true,
          user: null,
        }}
      />
    );

    expect(screen.getByRole('heading', { name: /participant consent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /continue with linkedin/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /begin study/i })).toBeInTheDocument();
    expect(screen.getByText(/participant code rather than your name/i)).toBeInTheDocument();
    expect(screen.getByText(/does not process payments, contact real sellers, or require account login/i)).toBeInTheDocument();
  });

  it('has no obvious automated accessibility violations', async () => {
    const { container } = render(
      <ConsentScreen
        onConsent={vi.fn()}
        onAuthUpdate={vi.fn()}
        authStatus={{
          authenticated: false,
          googleOAuthEnabled: true,
          linkedinOAuthEnabled: true,
          user: null,
        }}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
