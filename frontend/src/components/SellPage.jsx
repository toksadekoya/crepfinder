import { useState } from 'react';
import api from '../lib/api.js';
import { beginGoogleOAuth, beginLinkedInOAuth } from '../lib/auth.js';

const conditionOptions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const initialForm = {
  brand: '',
  model: '',
  size: '',
  condition: 'Like New',
  price: '',
  description: '',
  image_url: '',
};

export default function SellPage({ authStatus }) {
  const [form, setForm] = useState(initialForm);
  const [createdListing, setCreatedListing] = useState(null);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitListing = async (event) => {
    event.preventDefault();
    setStatus('');
    setCreatedListing(null);
    setSubmitting(true);

    try {
      const { data } = await api.post('/api/listings', {
        ...form,
        size: Number(form.size),
        price: Number(form.price),
      });

      setCreatedListing(data);
      setForm(initialForm);
      setStatus('Listing created.');
    } catch (err) {
      setStatus(err.response?.data?.error ?? 'Could not create listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authStatus?.authenticated) {
    return (
      <div className="mx-auto max-w-[720px] space-y-6 py-8">
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Sell</p>
          <h1 className="text-[28px] font-medium tracking-[-0.03em] text-primary">Create seller listings</h1>
          <p className="max-w-[620px] text-[14px] leading-[1.55] text-secondary">
            Seller tools require a linked account so listings, verification status, messages and purchase requests stay attached to the right seller.
          </p>
        </div>

        <div className="rounded-[10px] border border-border-subtle bg-surface p-5">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={beginGoogleOAuth}
              disabled={!authStatus?.googleOAuthEnabled}
              className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-medium text-surface transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={beginLinkedInOAuth}
              disabled={!authStatus?.linkedinOAuthEnabled}
              className="rounded-full border border-border-strong px-5 py-2.5 text-[14px] font-medium text-primary transition-colors hover:bg-subtle disabled:cursor-not-allowed disabled:border-border-subtle disabled:text-muted"
            >
              Continue with LinkedIn
            </button>
          </div>
          {!authStatus?.googleOAuthEnabled && !authStatus?.linkedinOAuthEnabled && (
            <p className="mt-4 text-[13px] text-muted">
              OAuth environment variables are not configured for this deployment yet.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-8 py-4 md:py-8">
      <div className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Sell</p>
        <h1 className="text-[28px] font-medium tracking-[-0.03em] text-primary">Create a listing</h1>
        <p className="max-w-[660px] text-[14px] leading-[1.55] text-secondary">
          New listings appear in browse with the seller trust panel connected to your account and verification status.
        </p>
      </div>

      <form onSubmit={submitListing} className="grid gap-4 rounded-[10px] border border-border-subtle bg-surface p-5 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Brand</span>
          <input
            value={form.brand}
            onChange={(event) => updateField('brand', event.target.value)}
            required
            maxLength={100}
            className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary outline-none transition-colors placeholder:text-muted focus:border-border-strong"
            placeholder="Nike"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Model</span>
          <input
            value={form.model}
            onChange={(event) => updateField('model', event.target.value)}
            required
            maxLength={150}
            className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary outline-none transition-colors placeholder:text-muted focus:border-border-strong"
            placeholder="Air Max 90"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">UK size</span>
          <input
            value={form.size}
            onChange={(event) => updateField('size', event.target.value)}
            type="number"
            min="1"
            max="16"
            step="0.5"
            required
            className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary outline-none transition-colors placeholder:text-muted focus:border-border-strong"
            placeholder="10"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Price</span>
          <input
            value={form.price}
            onChange={(event) => updateField('price', event.target.value)}
            type="number"
            min="1"
            max="10000"
            step="0.01"
            required
            className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary outline-none transition-colors placeholder:text-muted focus:border-border-strong"
            placeholder="120"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Condition</span>
          <select
            value={form.condition}
            onChange={(event) => updateField('condition', event.target.value)}
            className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary outline-none transition-colors focus:border-border-strong"
          >
            {conditionOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Image URL</span>
          <input
            value={form.image_url}
            onChange={(event) => updateField('image_url', event.target.value)}
            maxLength={1000}
            className="w-full rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] text-primary outline-none transition-colors placeholder:text-muted focus:border-border-strong"
            placeholder="/listings/air-max-90.jpg"
          />
        </label>

        <label className="block space-y-2 md:col-span-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">Description</span>
          <textarea
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows={5}
            maxLength={2000}
            className="w-full resize-none rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[14px] leading-[1.55] text-primary outline-none transition-colors placeholder:text-muted focus:border-border-strong"
            placeholder="Describe condition, box, receipt, and delivery options."
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
          <p role={status.startsWith('Could') ? 'alert' : 'status'} className={`text-[13px] ${status.startsWith('Could') ? 'text-red-600' : 'text-secondary'}`}>
            {status || 'Signed in as seller.'}
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-medium text-surface transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {submitting ? 'Creating...' : 'Create listing'}
          </button>
        </div>
      </form>

      {createdListing && (
        <div className="rounded-[10px] border border-border-subtle bg-surface px-5 py-4 text-[14px] text-secondary">
          Listing #{createdListing.id} is live in browse.
        </div>
      )}
    </div>
  );
}
