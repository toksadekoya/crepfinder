-- CrepFinder Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255),
  linkedin_id VARCHAR(255),
  display_name VARCHAR(100),
  avatar_url TEXT,
  oauth_email_verified BOOLEAN DEFAULT FALSE,
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'password'
    CHECK (auth_provider IN ('password', 'google', 'linkedin')),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS linkedin_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS oauth_email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'password',
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id
  ON users(google_id)
  WHERE google_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_linkedin_id
  ON users(linkedin_id)
  WHERE linkedin_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(150) NOT NULL,
  size DECIMAL(4,1) NOT NULL,
  condition VARCHAR(50) NOT NULL CHECK (condition IN ('New', 'Like New', 'Good', 'Fair', 'Poor')),
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (listing_id, reviewer_id)
);

-- Moderated social profile verification for seller trust cues
CREATE TABLE IF NOT EXISTS social_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  profile_url TEXT,
  username VARCHAR(100),
  challenge_code VARCHAR(32) UNIQUE NOT NULL,
  evidence_url TEXT,
  evidence_text TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'verified', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_verifications_user_id
  ON social_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_social_verifications_status
  ON social_verifications(status);

-- McKnight trust scale measurements
CREATE TABLE IF NOT EXISTS trust_measurements (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  condition_name VARCHAR(10) NOT NULL CHECK (condition_name IN ('A', 'B')),
  participant_id VARCHAR(100),
  is_pilot BOOLEAN NOT NULL DEFAULT FALSE,
  -- Competence subscale
  q1_competence_knowledgeable INTEGER NOT NULL CHECK (q1_competence_knowledgeable BETWEEN 1 AND 7),
  q2_competence_capable INTEGER NOT NULL CHECK (q2_competence_capable BETWEEN 1 AND 7),
  -- Benevolence subscale
  q3_benevolence_best_interest INTEGER NOT NULL CHECK (q3_benevolence_best_interest BETWEEN 1 AND 7),
  q4_benevolence_cares INTEGER NOT NULL CHECK (q4_benevolence_cares BETWEEN 1 AND 7),
  -- Integrity subscale
  q5_integrity_honest INTEGER NOT NULL CHECK (q5_integrity_honest BETWEEN 1 AND 7),
  -- Trusting intentions
  q6_intention_comfortable INTEGER NOT NULL CHECK (q6_intention_comfortable BETWEEN 1 AND 7),
  q7_intention_proceed INTEGER NOT NULL CHECK (q7_intention_proceed BETWEEN 1 AND 7),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Participant study sessions
CREATE TABLE IF NOT EXISTS participant_codes (
  id SERIAL PRIMARY KEY,
  participant_code VARCHAR(16) UNIQUE NOT NULL CHECK (participant_code ~ '^(P[0-9]{3}|PILOT_[0-9]{3})$'),
  is_pilot BOOLEAN NOT NULL DEFAULT FALSE,
  user_agent TEXT,
  consented_at TIMESTAMP DEFAULT NOW()
);

-- Controlled mutual-connection cues used in Condition A. Rows with a NULL
-- participant_code are default prototype stimuli; participant-specific rows
-- can be added later without changing the buyer-facing interface.
CREATE TABLE IF NOT EXISTS mutual_connections (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  participant_code VARCHAR(16) REFERENCES participant_codes(participant_code) ON DELETE CASCADE,
  connection_label VARCHAR(100) NOT NULL,
  connection_handle VARCHAR(100),
  relationship_context VARCHAR(120) NOT NULL DEFAULT 'previous_buyer',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mutual_connections_seller_id
  ON mutual_connections(seller_id);

CREATE INDEX IF NOT EXISTS idx_mutual_connections_participant_code
  ON mutual_connections(participant_code);

CREATE TABLE IF NOT EXISTS condition_assignments (
  id SERIAL PRIMARY KEY,
  participant_code VARCHAR(16) REFERENCES participant_codes(participant_code) ON DELETE CASCADE UNIQUE,
  condition_name VARCHAR(10) NOT NULL CHECK (condition_name IN ('A', 'B')),
  assigned_at TIMESTAMP DEFAULT NOW()
);

-- Prototype purchase requests. These are not payments; they record that a
-- participant reached the purchase-intent step before trust measurement.
CREATE TABLE IF NOT EXISTS purchase_requests (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  participant_code VARCHAR(16) REFERENCES participant_codes(participant_code) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  UNIQUE (listing_id, participant_code)
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_participant_code
  ON purchase_requests(participant_code);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_listing_id
  ON purchase_requests(listing_id);

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS purchase_request_id INTEGER REFERENCES purchase_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_transaction_locked BOOLEAN NOT NULL DEFAULT TRUE;

-- Lightweight non-real-time messaging for the prototype.
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  participant_code VARCHAR(16) REFERENCES participant_codes(participant_code) ON DELETE SET NULL,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('participant', 'seller', 'system')),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_participant_code
  ON messages(participant_code);

CREATE INDEX IF NOT EXISTS idx_messages_listing_id
  ON messages(listing_id);

DO $$
BEGIN
  ALTER TABLE mutual_connections
    DROP CONSTRAINT IF EXISTS mutual_connections_participant_code_fkey;
  ALTER TABLE condition_assignments
    DROP CONSTRAINT IF EXISTS condition_assignments_participant_code_fkey;
  ALTER TABLE purchase_requests
    DROP CONSTRAINT IF EXISTS purchase_requests_participant_code_fkey;
  ALTER TABLE messages
    DROP CONSTRAINT IF EXISTS messages_participant_code_fkey;
  ALTER TABLE participant_codes
    DROP CONSTRAINT IF EXISTS participant_codes_participant_code_check;

  ALTER TABLE participant_codes
    ALTER COLUMN participant_code TYPE VARCHAR(16);
  ALTER TABLE mutual_connections
    ALTER COLUMN participant_code TYPE VARCHAR(16);
  ALTER TABLE condition_assignments
    ALTER COLUMN participant_code TYPE VARCHAR(16);
  ALTER TABLE purchase_requests
    ALTER COLUMN participant_code TYPE VARCHAR(16);
  ALTER TABLE messages
    ALTER COLUMN participant_code TYPE VARCHAR(16);

  ALTER TABLE participant_codes
    ADD COLUMN IF NOT EXISTS is_pilot BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE trust_measurements
    ADD COLUMN IF NOT EXISTS is_pilot BOOLEAN NOT NULL DEFAULT FALSE;

  UPDATE participant_codes
  SET is_pilot = TRUE
  WHERE participant_code ~ '^PILOT_[0-9]{3}$';

  UPDATE participant_codes
  SET is_pilot = FALSE
  WHERE is_pilot IS NULL;

  UPDATE trust_measurements
  SET is_pilot = TRUE
  WHERE participant_id ~ '^PILOT_[0-9]{3}$';

  UPDATE trust_measurements
  SET is_pilot = FALSE
  WHERE is_pilot IS NULL;

  ALTER TABLE participant_codes
    ALTER COLUMN is_pilot SET DEFAULT FALSE,
    ALTER COLUMN is_pilot SET NOT NULL;
  ALTER TABLE trust_measurements
    ALTER COLUMN is_pilot SET DEFAULT FALSE,
    ALTER COLUMN is_pilot SET NOT NULL;

  ALTER TABLE participant_codes
    ADD CONSTRAINT participant_codes_participant_code_check
    CHECK (participant_code ~ '^(P[0-9]{3}|PILOT_[0-9]{3})$');

  ALTER TABLE mutual_connections
    ADD CONSTRAINT mutual_connections_participant_code_fkey
    FOREIGN KEY (participant_code)
    REFERENCES participant_codes(participant_code)
    ON DELETE CASCADE;
  ALTER TABLE condition_assignments
    ADD CONSTRAINT condition_assignments_participant_code_fkey
    FOREIGN KEY (participant_code)
    REFERENCES participant_codes(participant_code)
    ON DELETE CASCADE;
  ALTER TABLE purchase_requests
    ADD CONSTRAINT purchase_requests_participant_code_fkey
    FOREIGN KEY (participant_code)
    REFERENCES participant_codes(participant_code)
    ON DELETE CASCADE;
  ALTER TABLE messages
    ADD CONSTRAINT messages_participant_code_fkey
    FOREIGN KEY (participant_code)
    REFERENCES participant_codes(participant_code)
    ON DELETE SET NULL;
END $$;

-- A/B testing: track which UI condition each user sees
CREATE TABLE IF NOT EXISTS ab_conditions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  condition_name VARCHAR(50) NOT NULL CHECK (condition_name IN ('A', 'B')),
  assigned_at TIMESTAMP DEFAULT NOW()
);
