import { useState } from 'react';

export const SUS_FORM_URL_TEMPLATE = 'https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.ENTRY_ID={participantCode}';
export const DEBRIEF_FORM_URL_TEMPLATE = 'https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.ENTRY_ID={participantCode}';

export function buildSurveyUrl(template, participantCode) {
  return template.replace('{participantCode}', encodeURIComponent(participantCode ?? ''));
}

export default function DebriefScreen({ session }) {
  const [copied, setCopied] = useState(false);
  const participantCode = session.participantCode;
  const usabilitySurveyUrl = buildSurveyUrl(SUS_FORM_URL_TEMPLATE, participantCode);
  const debriefSurveyUrl = buildSurveyUrl(DEBRIEF_FORM_URL_TEMPLATE, participantCode);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(participantCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto max-w-[760px] space-y-8 py-4 md:py-10">
      <div className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Debrief</p>
        <h1 className="text-[26px] font-medium tracking-[-0.03em] text-primary">Thank you for taking part</h1>
        <p className="text-[14px] leading-[1.55] text-secondary">
          Your trust questionnaire has been recorded. Please keep your participant code in case you need to
          reference or withdraw your response later.
        </p>
      </div>

      <div className="rounded-[10px] border border-border-subtle bg-surface p-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Participant code</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <code className="rounded-[10px] bg-subtle px-4 py-3 text-[26px] font-medium tracking-[0.08em] text-primary">
            {participantCode}
          </code>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-full border border-border-strong px-4 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-subtle"
          >
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>
      </div>

      <section className="space-y-4 rounded-[10px] border border-border-subtle bg-surface p-5">
        <div className="space-y-3 text-[14px] leading-[1.55] text-secondary">
          <h2 className="text-[18px] font-medium tracking-[-0.02em] text-primary">Complete the final surveys</h2>
          <p>
            Thank you for completing the CrepFinder evaluation. Your participant code is:{' '}
            <span className="font-medium text-primary">{participantCode}</span>
          </p>
          <p>
            To complete your participation, please use this code to fill in the two short surveys below
            (approximately six minutes in total). Your responses will form part of the project's final evaluation
            and analysis.
          </p>
          <p className="font-medium text-primary">
            Please complete the surveys in order. Both are required to finalise your participation.
          </p>
        </div>

        <div className="grid gap-3">
          <a
            href={usabilitySurveyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-center text-[14px] font-medium text-surface transition-colors hover:bg-secondary"
          >
            Step 1: Complete the usability survey
          </a>
          <a
            href={debriefSurveyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-border-strong px-5 py-3 text-center text-[14px] font-medium text-primary transition-colors hover:bg-subtle"
          >
            Step 2: Complete the short debrief survey
          </a>
        </div>

        <p className="text-[12px] leading-[1.55] text-tertiary">
          If a survey does not open automatically, copy your participant code above and paste it into the survey
          when prompted.
        </p>
      </section>

      <div className="space-y-4 rounded-[10px] border border-border-subtle bg-surface p-5 text-[14px] leading-[1.55] text-secondary">
        <h2 className="text-[18px] font-medium tracking-[-0.02em] text-primary">What the study tested</h2>
        <p>
          This research compares two ways of presenting seller trust information in a peer-to-peer sneaker marketplace.
          Participants are randomly assigned to one interface condition so the study can compare responses fairly.
        </p>
        <p>
          Some marketplace signals are simulated research data. In particular, social verification cues such as
          mutual connections, community buyers, review counts, and seller status labels are controlled stimuli rather
          than live third-party identity checks. OAuth sign-in, where configured, verifies control of a Google or
          LinkedIn account only; it does not prove marketplace trustworthiness. This keeps the listings identical across conditions
          except for the trust signal being studied.
        </p>
        <p>
          No payment has been processed and no real seller has been contacted.
        </p>
      </div>
    </div>
  );
}
