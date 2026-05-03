import { useState } from 'react';

export default function DebriefScreen({ session }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(session.participantCode);
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
            {session.participantCode}
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

      <div className="space-y-4 rounded-[10px] border border-border-subtle bg-surface p-5 text-[14px] leading-[1.55] text-secondary">
        <h2 className="text-[18px] font-medium tracking-[-0.02em] text-primary">What the study tested</h2>
        <p>
          This research compares two ways of presenting seller trust information in a peer-to-peer sneaker marketplace.
          Participants are randomly assigned to one interface condition so the study can compare responses fairly.
        </p>
        <p>
          Some marketplace signals are simulated research data. In particular, social verification cues such as
          mutual connections, community buyers, review counts, and seller status labels are controlled stimuli rather
          than live third-party identity checks. OAuth sign-in, where configured, verifies control of a Google account
          only; it does not prove marketplace trustworthiness. This keeps the listings identical across conditions
          except for the trust signal being studied.
        </p>
        <p>
          No payment has been processed and no real seller has been contacted.
        </p>
      </div>
    </div>
  );
}
