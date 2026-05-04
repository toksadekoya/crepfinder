import { describe, expect, it } from 'vitest';
import {
  formatPrice,
  formatUkSize,
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
});
