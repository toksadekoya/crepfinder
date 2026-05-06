import { describe, expect, it } from 'vitest';
import {
  formatPrice,
  formatUkSize,
  getListingSocialData,
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
});
