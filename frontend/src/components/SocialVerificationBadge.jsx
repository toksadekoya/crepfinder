import {
  formatVerifiedDate,
  getSocialVerificationLabel,
} from '../lib/listingPresentation.js';

export default function SocialVerificationBadge({ verification, compact = false }) {
  const state = getSocialVerificationLabel(verification);
  const verifiedDate = verification?.status === 'verified'
    ? formatVerifiedDate(verification.verified_at)
    : null;

  const labelClass = state.tone === 'strong'
    ? 'border-border-strong text-primary'
    : 'border-border-subtle text-secondary';

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium ${labelClass}`}>
        <span aria-hidden="true">{state.tone === 'strong' ? '✦' : '○'}</span>
        {state.label}
      </span>
    );
  }

  return (
    <div className="rounded-[10px] border border-border-subtle bg-subtle p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1 rounded-full border bg-surface px-2.5 py-1 text-[11px] font-medium ${labelClass}`}>
          <span aria-hidden="true">{state.tone === 'strong' ? '✦' : '○'}</span>
          {state.label}
        </span>
        {verification?.platform && (
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">
            {verification.platform}
          </span>
        )}
      </div>
      <p className="mt-3 text-[14px] leading-[1.55] text-secondary">{state.description}</p>
      {verifiedDate && (
        <p className="mt-2 text-[11px] text-muted">Verified {verifiedDate}</p>
      )}
    </div>
  );
}
