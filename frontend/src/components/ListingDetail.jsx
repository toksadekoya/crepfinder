import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { mockListings, mockReviews } from '../mockData.js';
import TrustModal from './TrustModal.jsx';
import SocialVerificationBadge from './SocialVerificationBadge.jsx';
import {
  formatPrice,
  formatRating,
  formatUkSize,
  getListingAverageRating,
  getListingImage,
  getListingReviewCount,
  getListingSocialData,
  getListingSocialVerification,
  getSellerAccountAge,
  getSellerOAuthLabel,
} from '../lib/listingPresentation.js';

function StarRating({ value }) {
  const rating = Number(value) || 0;
  const stars = Math.round(rating);
  const label = rating ? `${formatRating(rating)} out of 5 stars` : 'No star rating available';

  return (
    <span className="flex gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} aria-hidden="true" className={i <= stars ? 'text-amber-400' : 'text-stone-300'}>★</span>
      ))}
    </span>
  );
}

function MessageComposer({ listing, participant }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const body = message.trim();
    if (!body) {
      setStatus('Write a short message before sending.');
      return;
    }

    setSending(true);
    setStatus('');

    const payload = {
      listing_id: listing.id,
      participant_code: participant?.participantCode,
      body,
    };

    try {
      await api.post('/api/messages', payload);
      setMessage('');
      setStatus('Message saved for the seller.');
    } catch {
      const saved = JSON.parse(localStorage.getItem('crepfinder_messages') ?? '[]');
      saved.push({ ...payload, created_at: new Date().toISOString(), sender_role: 'participant' });
      localStorage.setItem('crepfinder_messages', JSON.stringify(saved));
      setMessage('');
      setStatus('Message saved locally for this prototype session.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-border-subtle bg-surface p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Message seller</p>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={3}
        maxLength={500}
        aria-label={`Message @${listing.seller_username}`}
        placeholder={`Ask @${listing.seller_username} a question about this pair`}
        className="mt-3 w-full resize-none rounded-[10px] border border-border-subtle bg-page px-3 py-2 text-[13px] leading-[1.55] text-primary outline-none transition-colors placeholder:text-muted focus:border-border-strong"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p role="status" className="text-[11px] text-muted">{status || 'Prototype messaging is stored as a non-real-time thread.'}</p>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="shrink-0 rounded-full border border-border-strong px-4 py-2 text-[12px] font-medium text-primary transition-colors hover:bg-primary hover:text-surface disabled:cursor-not-allowed disabled:border-border-subtle disabled:text-muted"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function SocialSellerPanel({ listing, onBuy }) {
  const social = getListingSocialData(listing);
  const verification = getListingSocialVerification(listing);
  const reviewCount = getListingReviewCount(listing);
  const accountAge = getSellerAccountAge(listing);
  const oauthLabel = getSellerOAuthLabel(listing);

  return (
    <div className="space-y-4 rounded-[10px] border border-border-subtle bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-lg font-medium text-primary">
          {listing.seller_username?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-[14px] font-medium text-primary">@{listing.seller_username}</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">
            {social.communityRank} Seller · {listing.seller_total_listings} listings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[10px] bg-subtle px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">OAuth</p>
          <p className="mt-1 text-[12px] font-medium leading-tight text-primary">{oauthLabel}</p>
        </div>
        <div className="rounded-[10px] bg-subtle px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Account</p>
          <p className={`mt-1 text-[12px] font-medium leading-tight ${accountAge.isNew ? 'text-secondary' : 'text-primary'}`}>
            {accountAge.label}
          </p>
        </div>
        <div className="rounded-[10px] bg-subtle px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Locked</p>
          <p className="mt-1 text-[16px] font-medium text-primary">{reviewCount}</p>
        </div>
      </div>

      {social.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {social.badges.map((badge) => (
            <span key={badge} className="rounded-full border border-border-subtle bg-page px-2.5 py-1 text-[11px] font-medium text-secondary">
              {badge}
            </span>
          ))}
        </div>
      )}

      <SocialVerificationBadge verification={verification} />

      <div className="rounded-[10px] bg-subtle p-4 text-[14px] leading-[1.55] text-secondary">
        <div className="flex items-center justify-between gap-3">
          <span>Social trust signal</span>
          <span className="text-[12px] font-medium text-primary">{social.mutualConnections} mutual</span>
        </div>
        <p className="mt-2">
          {social.mutualConnections > 0
            ? `${social.mutualConnections} mutual connection${social.mutualConnections === 1 ? '' : 's'} have previously purchased from this seller.`
            : 'No mutual purchases are visible for this seller yet.'}
        </p>
      </div>

      {social.recentBuyers.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Recent buyers</p>
          <div className="flex gap-2 flex-wrap">
            {social.recentBuyers.map(buyer => (
              <span key={buyer} className="rounded-full border border-border-subtle bg-surface px-3 py-1 text-[11px] font-medium text-secondary">
                @{buyer}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBuy}
        className="w-full rounded-full bg-primary py-3 text-[14px] font-medium text-surface transition-colors hover:bg-secondary"
      >
        Request Purchase
      </button>
    </div>
  );
}

function RatingsSellerPanel({ listing, reviews, onBuy }) {
  const avgRating = getListingAverageRating(listing);
  const reviewCount = getListingReviewCount(listing);
  const accountAge = getSellerAccountAge(listing);

  return (
    <div className="space-y-4 rounded-[10px] border border-border-subtle bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-lg font-medium text-primary">
          {listing.seller_username?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-[14px] font-medium text-primary">@{listing.seller_username}</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">
            {listing.seller_total_listings} listings · {accountAge.label}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-[10px] bg-subtle p-4">
        <div className="text-center">
          <p className="text-[32px] font-medium text-primary">{avgRating ? formatRating(avgRating) : '—'}</p>
          <StarRating value={avgRating} />
          <p className="mt-1 text-[11px] text-secondary">{reviewCount} ratings</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-[11px] text-secondary">
                <span className="w-3 text-right">{star}</span>
                <span className="text-amber-400">★</span>
                <div className="flex-1 rounded-full bg-stone-200 h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-label={`${star} star reviews`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                  />
                </div>
                <span className="w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Recent feedback</p>
          {reviews.map(review => (
            <div key={review.id} className="space-y-1 rounded-[10px] border border-border-subtle p-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-primary">@{review.reviewer_username}</span>
                <StarRating value={review.rating} />
              </div>
              {review.comment && <p className="text-[14px] leading-[1.55] text-secondary">{review.comment}</p>}
              <p className="text-[11px] text-muted">
                {new Date(review.created_at).toLocaleDateString('en-GB')}
                {review.is_transaction_locked && ' · Transaction-locked review'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[14px] italic text-muted">No reviews are available for this seller yet.</p>
      )}

      <button
        type="button"
        onClick={onBuy}
        className="w-full rounded-full bg-primary py-3 text-[14px] font-medium text-surface transition-colors hover:bg-secondary"
      >
        Request Purchase
      </button>
    </div>
  );
}

export default function ListingDetail({ condition, participant, onStudyComplete }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingRes, reviewsRes] = await Promise.all([
          api.get(`/api/listings/${id}`),
          api.get(`/api/reviews/${id}`),
        ]);
        setListing(listingRes.data);
        setReviews(reviewsRes.data);
      } catch {
        const found = mockListings.find(l => l.id === Number(id));
        setListing(found ?? null);
        setReviews(mockReviews[Number(id)] ?? []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20 text-muted">Loading…</div>;
  if (!listing) return (
    <div className="rounded-[10px] border border-border-subtle bg-surface px-6 py-16 text-center">
      <p className="text-[14px] text-secondary">Listing not found.</p>
      <Link to="/" className="mt-4 inline-flex text-[14px] font-medium text-secondary hover:text-primary">Back to browse</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex text-[13px] font-medium text-secondary transition-colors hover:text-primary"
      >
        Back to browse
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[10px] border border-border-subtle bg-subtle">
            <img
              src={getListingImage(listing)}
              alt={`${listing.brand} ${listing.model}`}
              className="aspect-square w-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">{listing.brand}</p>
            <h1 className="text-[26px] font-medium text-primary">{listing.model}</h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[24px] font-medium text-primary [font-feature-settings:'tnum']">
              {formatPrice(listing.price)}
            </span>
            <span className="rounded-full border border-border-subtle bg-surface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-secondary">
              {listing.condition}
            </span>
            <span className="text-[12px] font-medium text-secondary">{formatUkSize(listing.size)}</span>
          </div>

          {listing.description && (
            <p className="max-w-prose text-[14px] leading-[1.55] text-secondary">{listing.description}</p>
          )}
        </div>

        <div className="space-y-4">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">Seller</p>
          {condition === 'A' ? (
            <SocialSellerPanel listing={listing} onBuy={() => setShowModal(true)} />
          ) : (
            <RatingsSellerPanel listing={listing} reviews={reviews} onBuy={() => setShowModal(true)} />
          )}
          <MessageComposer listing={listing} participant={participant} />
        </div>
      </div>

      {showModal && (
        <TrustModal
          listing={listing}
          condition={condition}
          participant={participant}
          onComplete={() => {
            setShowModal(false);
            onStudyComplete(listing);
            navigate('/debrief', { replace: true });
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
