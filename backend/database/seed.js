import bcrypt from 'bcrypt';
import pool from './db.js';

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear existing data
    await client.query('DELETE FROM trust_measurements');
    await client.query('DELETE FROM messages');
    await client.query('DELETE FROM reviews');
    await client.query('DELETE FROM purchase_requests');
    await client.query('DELETE FROM condition_assignments');
    await client.query('DELETE FROM mutual_connections');
    await client.query('DELETE FROM participant_codes');
    await client.query('DELETE FROM social_verifications');
    await client.query('DELETE FROM ab_conditions');
    await client.query('DELETE FROM listings');
    await client.query('DELETE FROM users');

    // Seed users
    const passwordHash = await bcrypt.hash('password123', 10);
    const usersResult = await client.query(
      `INSERT INTO users (username, email, password_hash, created_at) VALUES
        ('sneakerhead1', 'user1@example.com', $1, NOW() - INTERVAL '18 months'),
        ('kickseller', 'user2@example.com', $1, NOW() - INTERVAL '19 days'),
        ('airmax_fan', 'user3@example.com', $1, NOW() - INTERVAL '7 months')
      RETURNING id`,
      [passwordHash]
    );
    const userIds = usersResult.rows.map((r) => r.id);

    // Seed listings
    const listingsResult = await client.query(
      `INSERT INTO listings (user_id, brand, model, size, condition, price, description, image_url) VALUES
        ($1, 'Nike', 'Air Max 90', 10.0, 'Like New', 120.00, 'Barely worn, clean pair', '/listings/air-max-90.svg'),
        ($1, 'Jordan', 'Air Jordan 1 Retro High OG', 9.5, 'Good', 180.00, 'Some creasing, still clean', '/listings/air-jordan-1-retro-high-og.svg'),
        ($2, 'Adidas', 'Yeezy Boost 350 V2', 11.0, 'New', 320.00, 'Brand new in box', '/listings/yeezy-boost-350-v2.svg'),
        ($2, 'New Balance', '990v5', 10.5, 'Fair', 75.00, 'Well worn but still solid', '/listings/new-balance-990v5.svg'),
        ($3, 'Nike', 'Dunk Low Retro', 9.0, 'Like New', 140.00, 'Worn twice only', '/listings/dunk-low-retro.svg')
      RETURNING id`,
      [userIds[0], userIds[1]]
    );
    const listingIds = listingsResult.rows.map((r) => r.id);

    await client.query(
      `INSERT INTO participant_codes (participant_code, user_agent) VALUES
        ('P900', 'seeded-review-participant'),
        ('P901', 'seeded-message-participant')`
    );

    await client.query(
      `INSERT INTO mutual_connections
        (seller_id, participant_code, connection_label, connection_handle, relationship_context)
       VALUES
        ($1, NULL, 'Jordan23', 'Jordan23', 'previous_buyer'),
        ($1, NULL, 'KickzKing', 'KickzKing', 'previous_buyer'),
        ($1, NULL, 'SoleSeeker', 'SoleSeeker', 'previous_buyer'),
        ($2, NULL, 'RetroRunner', 'RetroRunner', 'previous_buyer')`,
      [userIds[0], userIds[1]]
    );

    const purchaseResult = await client.query(
      `INSERT INTO purchase_requests (listing_id, participant_code, status, completed_at) VALUES
        ($1, 'P900', 'completed', NOW() - INTERVAL '4 months'),
        ($1, 'P901', 'completed', NOW() - INTERVAL '2 months'),
        ($2, 'P900', 'completed', NOW() - INTERVAL '1 month')
       RETURNING id`,
      [listingIds[0], listingIds[1]]
    );
    const purchaseIds = purchaseResult.rows.map((r) => r.id);

    // Seed transaction-locked reviews
    await client.query(
      `INSERT INTO reviews (listing_id, reviewer_id, purchase_request_id, rating, comment, is_transaction_locked) VALUES
        ($1, $2, $4, 5, 'Great condition, fast shipping!', TRUE),
        ($1, $3, $5, 4, 'Exactly as described.', TRUE),
        ($6, $3, $7, 3, 'Good but slight creasing not mentioned.', TRUE)`,
      [listingIds[0], userIds[1], userIds[2], purchaseIds[0], purchaseIds[1], listingIds[1], purchaseIds[2]]
    );

    await client.query(
      `INSERT INTO messages (listing_id, seller_id, participant_code, sender_role, body) VALUES
        ($1, $2, 'P901', 'participant', 'Hi, are these still available for collection this week?'),
        ($1, $2, 'P901', 'seller', 'Yes, still available. I can hold them until Friday.')`,
      [listingIds[0], userIds[0]]
    );

    await client.query(
      `INSERT INTO social_verifications
        (user_id, platform, profile_url, username, challenge_code, evidence_url, evidence_text, status, verified_at)
       VALUES
        ($1, 'Instagram', 'https://instagram.com/sneakerhead1', 'sneakerhead1', 'CREPFINDER-SEED01', 'https://instagram.com/sneakerhead1', 'Challenge code visible in profile bio during moderation.', 'verified', NOW()),
        ($2, 'TikTok', 'https://tiktok.com/@kickseller', 'kickseller', 'CREPFINDER-SEED02', 'https://tiktok.com/@kickseller', 'Seller submitted a profile screenshot showing the challenge code.', 'submitted', NULL)`,
      [userIds[0], userIds[1]]
    );

    // Seed A/B conditions
    await client.query(
      `INSERT INTO ab_conditions (user_id, condition_name) VALUES
        ($1, 'A'),
        ($2, 'B'),
        ($3, 'A')`,
      [userIds[0], userIds[1], userIds[2]]
    );

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
