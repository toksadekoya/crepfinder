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
  participant_code VARCHAR(4) UNIQUE NOT NULL CHECK (participant_code ~ '^P[0-9]{3}$'),
  user_agent TEXT,
  consented_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS condition_assignments (
  id SERIAL PRIMARY KEY,
  participant_code VARCHAR(4) REFERENCES participant_codes(participant_code) ON DELETE CASCADE UNIQUE,
  condition_name VARCHAR(10) NOT NULL CHECK (condition_name IN ('A', 'B')),
  assigned_at TIMESTAMP DEFAULT NOW()
);

-- Prototype purchase requests. These are not payments; they record that a
-- participant reached the purchase-intent step before trust measurement.
CREATE TABLE IF NOT EXISTS purchase_requests (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  participant_code VARCHAR(4) REFERENCES participant_codes(participant_code) ON DELETE CASCADE,
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
  participant_code VARCHAR(4) REFERENCES participant_codes(participant_code) ON DELETE SET NULL,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('participant', 'seller', 'system')),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_participant_code
  ON messages(participant_code);

CREATE INDEX IF NOT EXISTS idx_messages_listing_id
  ON messages(listing_id);

-- A/B testing: track which UI condition each user sees
CREATE TABLE IF NOT EXISTS ab_conditions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  condition_name VARCHAR(50) NOT NULL CHECK (condition_name IN ('A', 'B')),
  assigned_at TIMESTAMP DEFAULT NOW()
);
