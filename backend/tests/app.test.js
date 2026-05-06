import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPool = {
  query: vi.fn(),
  connect: vi.fn(),
};

vi.mock('../database/db.js', () => ({
  default: mockPool,
}));

const { default: app } = await import('../app.js');

describe('CrepFinder API contract', () => {
  beforeEach(() => {
    mockPool.query.mockReset();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.LINKEDIN_CLIENT_ID;
    delete process.env.LINKEDIN_CLIENT_SECRET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes a health endpoint for local and container checks', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('reports available OAuth providers without starting a login flow', async () => {
    process.env.GOOGLE_CLIENT_ID = 'google-client';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
    process.env.LINKEDIN_CLIENT_ID = 'linkedin-client';
    process.env.LINKEDIN_CLIENT_SECRET = 'linkedin-secret';

    const response = await request(app).get('/api/auth/status');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      authenticated: false,
      googleOAuthEnabled: true,
      linkedinOAuthEnabled: true,
      oauthProviders: {
        google: true,
        linkedin: true,
      },
      user: null,
    });
  });

  it('rejects incomplete trust measurement submissions', async () => {
    const response = await request(app)
      .post('/api/trust')
      .send({ listing_id: 1, condition_name: 'A' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required fields');
  });

  it('validates social verification start requests before touching the database', async () => {
    const response = await request(app)
      .post('/api/social-verification/start')
      .send({ user_id: 1, platform: 'Instagram' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('profile_url or username');
    expect(mockPool.connect).not.toHaveBeenCalled();
  });

  it('passes participant codes into listing queries for mutual connection lookup', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/api/listings?participant_code=P123');

    expect(response.status).toBe(200);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('mutual_connections'),
      ['P123']
    );
  });
});
