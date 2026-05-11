import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import DebriefScreen, { buildSurveyUrl } from './DebriefScreen.jsx';

const session = {
  participantCode: 'P123',
};

describe('DebriefScreen', () => {
  it('directs participants to the post-task survey with their participant code', () => {
    render(<DebriefScreen session={session} />);

    expect(screen.getByRole('heading', { name: /complete the post-task survey/i })).toBeInTheDocument();
    expect(screen.getByText(/your participant code is:/i)).toBeInTheDocument();
    expect(screen.getAllByText('P123')).toHaveLength(2);
    expect(screen.getByText(/please complete the survey to finalise your participation/i)).toBeInTheDocument();

    const postTaskSurvey = screen.getByRole('link', { name: /complete the post-task survey/i });

    expect(postTaskSurvey.getAttribute('href')).toContain('P123');
    expect(postTaskSurvey).toHaveAttribute('target', '_blank');
    expect(postTaskSurvey).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('URL-encodes participant codes before inserting them into survey links', () => {
    expect(buildSurveyUrl('https://example.test/form?entry.123=PARTICIPANT_CODE_PLACEHOLDER', 'P 123')).toBe(
      'https://example.test/form?entry.123=P%20123'
    );
  });

  it('has no obvious automated accessibility violations', async () => {
    const { container } = render(<DebriefScreen session={session} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
