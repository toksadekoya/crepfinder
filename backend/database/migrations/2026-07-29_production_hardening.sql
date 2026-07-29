CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_requests_open_buyer_listing
  ON purchase_requests(listing_id, buyer_id)
  WHERE buyer_id IS NOT NULL
    AND status NOT IN ('completed', 'cancelled');

CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expire
  ON user_sessions(expire);
