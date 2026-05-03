import { Link } from 'react-router-dom';
import {
  formatPrice,
  formatRating,
  formatUkSize,
  getListingAverageRating,
  getListingImage,
  getListingReviewCount,
  getListingSocialData,
  getListingSocialVerification,
  getSocialVerificationLabel,
  getSellerAccountAge,
} from '../lib/listingPresentation.js';

function TrustSlot({ condition, listing }) {
  const social = getListingSocialData(listing);
  const verification = getListingSocialVerification(listing);
  const verificationLabel = getSocialVerificationLabel(verification);
  const accountAge = getSellerAccountAge(listing);
  const reviewCount = getListingReviewCount(listing);
  const rating = getListingAverageRating(listing);

  if (condition === 'A') {
    return (
      <div className="flex min-h-[42px] flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <SellerHandle handle={listing.seller_username} />
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
            <span aria-hidden="true">{verificationLabel.tone === 'strong' ? '✦' : '○'}</span>
            {verificationLabel.label}
          </span>
        </div>
        <p className="text-[10px] text-secondary">
          {social.mutualConnections} mutual · {reviewCount} locked reviews · {accountAge.label}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[42px] flex-col justify-center gap-1">
      <div className="flex items-center justify-between gap-3">
        <SellerHandle handle={listing.seller_username} />
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-primary">
          <span className="text-amber-500" aria-hidden="true">★</span>
          {formatRating(rating)} ({reviewCount})
        </span>
      </div>
      <div aria-hidden="true" className="h-[14px]" />
    </div>
  );
}

function SellerHandle({ handle }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-secondary">
      <span className="h-2.5 w-2.5 rounded-full border border-muted" aria-hidden="true" />
      <span>@{handle}</span>
    </div>
  );
}

export default function ListingCard({ listing, condition }) {
  const {
    id,
    brand,
    model,
    size,
    condition: listingCondition,
    price,
    seller_username,
  } = listing;

  return (
    <Link
      to={`/listing/${id}`}
      className="group flex flex-col overflow-hidden rounded-[10px] border border-border-subtle bg-surface transition-shadow hover:shadow-card"
    >
      <div className="relative aspect-square overflow-hidden border-b border-border-subtle bg-subtle">
        <img
          src={getListingImage(listing)}
          alt={`${brand} ${model}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
        />
        <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-secondary backdrop-blur">
          {listingCondition}
        </span>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="border-b border-border-subtle p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-tertiary">{brand}</p>
          <h2 className="mt-1 min-h-[2.4rem] text-[14px] font-medium leading-[1.35] text-primary">
            {model}
          </h2>
          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="text-[16px] font-medium text-primary [font-feature-settings:'tnum']">
              {formatPrice(price)}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
              {formatUkSize(size)}
            </span>
          </div>
        </div>
        <div className="p-3">
          <TrustSlot
            condition={condition}
            listing={{ ...listing, seller_username }}
          />
        </div>
      </div>
    </Link>
  );
}
