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
    mockPool.connect.mockReset();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.LINKEDIN_CLIENT_ID;
    delete process.env.LINKEDIN_CLIENT_SECRET;
    delete process.env.RESEARCH_EXPORT_TOKEN;
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

  it('accepts explicit PILOT participant codes at consent and flags them', async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            participant_code: 'PILOT_007',
            is_pilot: true,
            consented_at: '2026-05-12T00:00:00.000Z',
          }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            condition_name: 'A',
            assigned_at: '2026-05-12T00:01:00.000Z',
          }],
        })
        .mockResolvedValueOnce({ rows: [] }),
      release: vi.fn(),
    };
    mockPool.connect.mockResolvedValueOnce(client);

    const response = await request(app)
      .post('/api/study/consent')
      .send({ consented: true, participant_code: 'PILOT_007' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      participant_code: 'PILOT_007',
      is_pilot: true,
      condition_name: 'A',
    });
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO participant_codes'),
      ['PILOT_007', null, true]
    );
    expect(client.release).toHaveBeenCalled();
  });

  it('stores pilot status directly on trust measurements', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ is_pilot: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 42, is_pilot: true }] });

    const response = await request(app)
      .post('/api/trust')
      .send({
        listing_id: 1,
        condition_name: 'A',
        participant_id: 'PILOT_007',
        q1: 4,
        q2: 4,
        q3: 4,
        q4: 4,
        q5: 4,
        q6: 4,
        q7: 4,
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 42, is_pilot: true });
    expect(mockPool.query).toHaveBeenLastCalledWith(
      expect.stringContaining('is_pilot'),
      [1, 'A', 'PILOT_007', 4, 4, 4, 4, 4, 4, 4, true]
    );
  });

  it('excludes pilot rows from research export unless include_pilot is true', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const defaultResponse = await request(app).get('/api/research/export.csv');
    const includeResponse = await request(app).get('/api/research/export.csv?include_pilot=true');

    expect(defaultResponse.status).toBe(200);
    expect(includeResponse.status).toBe(200);
    expect(mockPool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('COALESCE(pc.is_pilot, tm.is_pilot, FALSE) = FALSE'),
      [false]
    );
    expect(mockPool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('COALESCE(pc.is_pilot, tm.is_pilot, FALSE) = FALSE'),
      [true]
    );
  });

  it('rejects review creation without a completed purchase request', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/reviews')
      .send({
        listing_id: 1,
        reviewer_id: 2,
        participant_code: 'P123',
        rating: 5,
        comment: 'Looks reliable',
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Reviews are locked until a completed purchase request exists');
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM purchase_requests'),
      [1, 'P123']
    );
    expect(
      mockPool.query.mock.calls.some(([query]) => String(query).includes('INSERT INTO reviews'))
    ).toBe(false);
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
