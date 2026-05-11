import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import DebriefScreen, { buildSurveyUrl } from './DebriefScreen.jsx';

const session = {
  participantCode: 'P123',
};

describe('DebriefScreen', () => {
  it('directs participants to both post-task surveys with their participant code', () => {
    render(<DebriefScreen session={session} />);

    expect(screen.getByRole('heading', { name: /complete the final surveys/i })).toBeInTheDocument();
    expect(screen.getByText(/your participant code is:/i)).toBeInTheDocument();
    expect(screen.getAllByText('P123')).toHaveLength(2);
    expect(screen.getByText(/please complete the surveys in order/i)).toBeInTheDocument();

    const usabilitySurvey = screen.getByRole('link', { name: /step 1: complete the usability survey/i });
    const debriefSurvey = screen.getByRole('link', { name: /step 2: complete the short debrief survey/i });

    expect(usabilitySurvey.getAttribute('href')).toContain('P123');
    expect(debriefSurvey.getAttribute('href')).toContain('P123');
    expect(usabilitySurvey).toHaveAttribute('target', '_blank');
    expect(debriefSurvey).toHaveAttribute('target', '_blank');
    expect(usabilitySurvey).toHaveAttribute('rel', 'noopener noreferrer');
    expect(debriefSurvey).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('URL-encodes participant codes before inserting them into survey links', () => {
    expect(buildSurveyUrl('https://example.test/form?entry.123={participantCode}', 'P 123')).toBe(
      'https://example.test/form?entry.123=P%20123'
    );
  });

  it('has no obvious automated accessibility violations', async () => {
    const { container } = render(<DebriefScreen session={session} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
