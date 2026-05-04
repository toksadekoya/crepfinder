import { mockListings, mockReviews, mockSocialData } from '../mockData.js';

const listingImages = {
  1: '/listings/air-max-90.svg',
  2: '/listings/air-jordan-1-retro-high-og.svg',
  3: '/listings/yeezy-boost-350-v2.svg',
  4: '/listings/new-balance-990v5.svg',
  5: '/listings/dunk-low-retro.svg',
};

const priceFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

const ratingFormatter = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const fallbackSocialData = {
  verifiedBy: 0,
  mutualConnections: 0,
  recentBuyers: [],
  badges: [],
  responseRate: 0,
  communityRank: 'Trusted',
};

export function formatPrice(value) {
  const amount = Number(value) || 0;
  return priceFormatter.format(amount);
}

export function formatUkSize(size) {
  const formatted = Number.isInteger(Number(size)) ? Number(size) : size;
  return `UK ${formatted}`;
}

export function formatRating(value) {
  const rating = Number(value) || 0;
  return rating ? ratingFormatter.format(rating) : '–';
}

export function getListingImage(listing) {
  if (listing?.image_url && !listing.image_url.includes('via.placeholder.com')) {
    return listing.image_url;
  }

  return listingImages[Number(listing?.id)] ?? '/listings/default.svg';
}

function getSellerReviews(listing) {
  const sellerId = Number(listing?.seller_id);

  if (!sellerId) {
    return mockReviews[Number(listing?.id)] ?? [];
  }

  return mockListings
    .filter((item) => Number(item.seller_id) === sellerId)
    .flatMap((item) => mockReviews[item.id] ?? []);
}

export function getListingReviewCount(listing) {
  const count = Number(listing?.seller_review_count);

  if (Number.isFinite(count) && count >= 0) {
    return count;
  }

  return getSellerReviews(listing).length;
}

export function getListingAverageRating(listing) {
  const rating = Number(listing?.seller_avg_rating);

  if (Number.isFinite(rating) && rating > 0) {
    return rating;
  }

  const reviews = getSellerReviews(listing);

  if (!reviews.length) {
    return 0;
  }

  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}

export function getListingSocialData(listing) {
  return mockSocialData[Number(listing?.seller_id)] ?? fallbackSocialData;
}

export function getListingSocialVerification(listing) {
  return listing?.seller_social_verification ?? null;
}

export function getSocialVerificationLabel(verification) {
  if (!verification) {
    return {
      label: 'Verification not submitted',
      description: 'No social profile challenge has been submitted for this seller.',
      tone: 'muted',
    };
  }

  if (verification.status === 'verified') {
    return {
      label: 'Socially verified',
      description: "This seller has linked a social profile and completed CrepFinder's verification challenge.",
      tone: 'strong',
    };
  }

  if (verification.status === 'submitted' || verification.status === 'pending') {
    return {
      label: 'Verification submitted',
      description: 'This seller has submitted social profile evidence for moderation.',
      tone: 'submitted',
    };
  }

  return {
    label: 'Verification rejected',
    description: "This seller's submitted social verification evidence was not approved.",
    tone: 'muted',
  };
}

export function getSellerAccountAge(listing) {
  const createdAt = listing?.seller_created_at ? new Date(listing.seller_created_at) : null;

  if (!createdAt || Number.isNaN(createdAt.getTime())) {
    return {
      label: 'Account age unavailable',
      isNew: false,
      months: null,
    };
  }

  const ageMs = Date.now() - createdAt.getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
  const months = Math.floor(ageDays / 30);

  if (ageDays < 30) {
    return {
      label: `New account · ${ageDays || 1}d`,
      isNew: true,
      months: 0,
    };
  }

  if (months < 12) {
    return {
      label: `Account age · ${months}mo`,
      isNew: false,
      months,
    };
  }

  const years = Math.floor(months / 12);
  return {
    label: `Account age · ${years}y`,
    isNew: false,
    months,
  };
}

export function getSellerOAuthLabel(listing) {
  if (listing?.seller_auth_provider === 'google' && listing?.seller_oauth_email_verified) {
    return 'Google OAuth anchored';
  }

  if (listing?.seller_auth_provider === 'google') {
    return 'Google account linked';
  }

  if (listing?.seller_auth_provider === 'linkedin') {
    return 'LinkedIn OAuth anchored';
  }

  return 'Password account';
}

export function formatVerifiedDate(value) {
  if (!value) return null;

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function getBrandFilters(listings) {
  const brands = [...new Set(listings.map((listing) => listing.brand).filter(Boolean))];
  return ['All', ...brands];
}

export function formatListingCount(count) {
  return `${count} ${count === 1 ? 'listing' : 'listings'}`;
}
