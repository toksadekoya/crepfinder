BEGIN;

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
  ADD COLUMN IF NOT EXISTS is_pilot BOOLEAN DEFAULT FALSE;
ALTER TABLE trust_measurements
  ADD COLUMN IF NOT EXISTS is_pilot BOOLEAN DEFAULT FALSE;

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

COMMIT;
