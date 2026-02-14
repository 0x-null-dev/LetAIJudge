CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'dispute', -- 'dispute' or 'solo'
  topic TEXT NOT NULL,
  person_a_name TEXT NOT NULL,
  person_a_argument TEXT NOT NULL,
  person_b_name TEXT,
  person_b_argument TEXT,
  jury_id TEXT NOT NULL DEFAULT 'judge-diana',
  verdict_text TEXT,
  verdict_winner TEXT, -- 'person_a', 'person_b', or 'neutral'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'complete', 'incomplete', 'reported'
  challenge_token TEXT NOT NULL,
  lock_holder TEXT,
  lock_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_challenge_token ON disputes(challenge_token);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);
