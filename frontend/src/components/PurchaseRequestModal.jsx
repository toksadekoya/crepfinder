import { useState } from 'react';
import api from '../lib/api.js';
import { beginGoogleOAuth, beginLinkedInOAuth } from '../lib/auth.js';
import { formatPrice } from '../lib/listingPresentation.js';

export default function PurchaseRequestModal({ listing, authStatus, onClose, onComplete }) {
  const user = authStatus?.user;
  const [buyerName, setBuyerName] = useState(user?.display_name || user?.username || '');
  const buyerEmail = user?.email || '';
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitRequest = async (event) => {
    event.preventDefault();
    setStatus('');

    if (!buyerEmail.trim()) {
      setStatus('Add an email so the seller can reply.');
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post('/api/purchase-requests', {
        listing_id: listing.id,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_note: note,
      });

      onComplete?.(data);
    } catch (err) {
      setStatus(err.response?.data?.error ?? 'Could not send the purchase request.');
    } finally {
      setSubmitting(false);
    }
  };

  const signInAvailable = authStatus?.googleOAuthEnabled || authStatus?.linkedinOAuthEnabled;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4 py-6"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-request-title"
        className="w-full max-w-[520px] overflow-hidden rounded-[10px] border border-border-subtle bg-surface shadow-card"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div>
            <h2 id="purchase-request-title" className="text-[20px] font-medium tracking-[-0.02em] text-primary">
              Request purchase
            </h2>
            <p className="mt-1 text-[13px] text-secondary">
              {listing.brand} {listing.model} · {formatPrice(listing.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-[22px] leading-none text-muted transition-colors hover:text-primary"
            aria-label="Close purchase request"
          >
            x
          </button>
        </div>

        {!authStatus?.authenticated ? (
          <div className="space-y-4 px-5 py-5">
            <p className="text-[14px] leading-[1.55] text-secondary">
              Sign in to request this purchase. CrepFinder links the request to your account so order updates and reviews cannot be impersonated.
            </p>
            {signInAvailable ? (
              <div className="flex flex-col gap-2">
                {authStatus.googleOAuthEnabled && (
                  <button
                    type="button"
                    onClick={beginGoogleOAuth}
                    className="w-full rounded-full bg-primary px-5 py-3 text-[13px] font-medium text-surface"
                  >
                    Continue with Google
                  </button>
                )}
                {authStatus.linkedinOAuthEnabled && (
                  <button
                    type="button"
                    onClick={beginLinkedInOAuth}
                    className="w-full rounded-full border border-border-strong px-5 py-3 text-[13px] font-medium text-primary"
                  >
                    Continue with LinkedIn
                  </button>
                )}
              </div>
            ) : (
              <p role="alert" className="text-[13px] text-red-600">
                Sign-in is not configured on this deployment yet.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={submitRequest} className="space-y-4 px-5 py-5">
            <label className="block space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Name</span>
              <input
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
                maxLength={120}
                className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary outline-none transition-colors placeholder:text-muted focus:border-border-strong"
                placeholder="Your name"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Email</span>
              <input
                value={buyerEmail}
                type="email"
                readOnly
                required
                maxLength={160}
                className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary outline-none transition-colors placeholder:text-muted focus:border-border-strong"
                placeholder="you@example.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Message</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                maxLength={800}
                className="w-full resize-none rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] leading-[1.55] text-primary outline-none transition-colors placeholder:text-muted focus:border-border-strong"
                placeholder="Ask about availability, delivery, or collection."
              />
            </label>

            {status && <p role="alert" className="text-[13px] text-red-600">{status}</p>}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-primary px-5 py-2 text-[13px] font-medium text-surface transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {submitting ? 'Sending...' : 'Send request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
