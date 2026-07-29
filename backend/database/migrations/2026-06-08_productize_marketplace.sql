ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_status_check,
  ADD CONSTRAINT listings_status_check
    CHECK (status IN ('active', 'sold', 'hidden', 'removed'));

CREATE INDEX IF NOT EXISTS idx_listings_status
  ON listings(status);

ALTER TABLE purchase_requests
  ADD COLUMN IF NOT EXISTS buyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(160),
  ADD COLUMN IF NOT EXISTS buyer_note TEXT,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE purchase_requests
  DROP CONSTRAINT IF EXISTS purchase_requests_status_check,
  ADD CONSTRAINT purchase_requests_status_check
    CHECK (status IN ('requested', 'accepted', 'awaiting_payment', 'paid', 'shipped', 'completed', 'cancelled', 'disputed'));

ALTER TABLE purchase_requests
  DROP CONSTRAINT IF EXISTS purchase_requests_payment_status_check,
  ADD CONSTRAINT purchase_requests_payment_status_check
    CHECK (payment_status IN ('not_started', 'requires_payment_method', 'requires_confirmation', 'processing', 'paid', 'refunded', 'failed'));

CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer_id
  ON purchase_requests(buyer_id);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_status
  ON purchase_requests(status);

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS buyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(160);

CREATE INDEX IF NOT EXISTS idx_messages_buyer_id
  ON messages(buyer_id);
