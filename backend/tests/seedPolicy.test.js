import { describe, expect, it } from 'vitest';
import { getSeedPolicy } from '../database/seedPolicy.js';

describe('production seed policy', () => {
  it('allows repeatable local resets with demo passwords', () => {
    expect(getSeedPolicy({ NODE_ENV: 'development' })).toEqual({
      isProduction: false,
      isAllowed: true,
      shouldResetData: true,
      shouldCreatePassword: true,
    });
  });

  it('blocks production seeding by default', () => {
    expect(getSeedPolicy({ NODE_ENV: 'production' })).toEqual({
      isProduction: true,
      isAllowed: false,
      shouldResetData: false,
      shouldCreatePassword: false,
    });
  });

  it('only enables a non-destructive production seed with the explicit flag', () => {
    expect(
      getSeedPolicy({
        NODE_ENV: 'production',
        ALLOW_PRODUCTION_SEED: 'true',
      })
    ).toEqual({
      isProduction: true,
      isAllowed: true,
      shouldResetData: false,
      shouldCreatePassword: false,
    });
  });
});
