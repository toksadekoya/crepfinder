import { describe, expect, it } from 'vitest';
import {
  formatPrice,
  formatUkSize,
  getListingSocialData,
  getListingSellerBadges,
  getSellerOAuthLabel,
} from './listingPresentation.js';

describe('listing presentation helpers', () => {
  it('formats marketplace price and UK size copy consistently', () => {
    expect(formatPrice(180)).toBe('£180');
    expect(formatUkSize('9.5')).toBe('UK 9.5');
  });

  it('describes Google and LinkedIn account anchoring without overstating trust', () => {
    expect(getSellerOAuthLabel({
      seller_auth_provider: 'google',
      seller_oauth_email_verified: true,
    })).toBe('Google OAuth anchored');

    expect(getSellerOAuthLabel({
      seller_auth_provider: 'linkedin',
      seller_oauth_email_verified: true,
    })).toBe('LinkedIn OAuth anchored');

    expect(getSellerOAuthLabel({ seller_auth_provider: 'password' })).toBe('Password account');
  });

  it('prefers database-backed mutual connection rows over fallback social data', () => {
    const social = getListingSocialData({
      seller_id: 1,
      seller_mutual_connection_count: 2,
      seller_mutual_connections: [
        { connection_label: 'Aisha', connection_handle: 'aisha_kicks' },
        { connection_label: 'Sam', connection_handle: 'sole_sam' },
      ],
    });

    expect(social.mutualConnections).toBe(2);
    expect(social.recentBuyers).toEqual(['aisha_kicks', 'sole_sam']);
    expect(social.mutualConnectionRecords).toHaveLength(2);
  });

  it('derives seller badges from platform evidence when the API has not supplied labels', () => {
    const badges = getListingSellerBadges({
      seller_avg_rating: '4.50',
      seller_review_count: 3,
      seller_completed_purchase_count: 3,
      seller_fast_shipping_review_count: 1,
      seller_mutual_connection_count: 2,
      seller_social_verification: { status: 'verified' },
    });

    expect(badges).toEqual([
      'Top Seller',
      'Community Trusted',
      'Fast Shipper',
    ]);
  });
});
