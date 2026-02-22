import { Pool } from "pg";

async function setup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required. Set it in your .env.local file.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  console.log("Setting up database...");

  console.log("Creating disputes table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'dispute',
      topic TEXT NOT NULL,
      person_a_name TEXT NOT NULL,
      person_a_argument TEXT NOT NULL,
      person_b_name TEXT,
      person_b_argument TEXT,
      jury_id TEXT NOT NULL DEFAULT 'axiom-9',
      verdict_text TEXT,
      verdict_winner TEXT,
      person_a_teaser TEXT,
      person_b_teaser TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      challenge_token TEXT NOT NULL,
      lock_holder TEXT,
      lock_expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE
    )
  `);

  console.log("Creating indexes...");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_disputes_challenge_token ON disputes(challenge_token)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC)");

  console.log("Creating votes table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      dispute_id TEXT NOT NULL REFERENCES disputes(id),
      choice TEXT NOT NULL,
      voter_ip TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query("CREATE INDEX IF NOT EXISTS idx_votes_dispute_id ON votes(dispute_id)");
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_ip_dispute ON votes(dispute_id, voter_ip)");

  console.log("Creating agents table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      api_key_hash TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  console.log("Creating comments table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      dispute_id TEXT NOT NULL REFERENCES disputes(id),
      agent_id TEXT NOT NULL REFERENCES agents(id),
      author_name TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  await pool.query("CREATE INDEX IF NOT EXISTS idx_comments_dispute_id ON comments(dispute_id)");

  console.log("Adding AI voting support...");
  await pool.query("ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_type TEXT NOT NULL DEFAULT 'human'");
  await pool.query("ALTER TABLE votes ADD COLUMN IF NOT EXISTS agent_id TEXT");
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_agent_dispute
    ON votes(dispute_id, agent_id) WHERE agent_id IS NOT NULL
  `);

  // --- Rate limiting ---
  console.log("Creating rate_limits table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_rate_limits_key_action ON rate_limits(key, action, created_at)"
  );

  // --- Voter fingerprint ---
  console.log("Adding voter fingerprint support...");
  await pool.query("ALTER TABLE votes ADD COLUMN IF NOT EXISTS voter_fingerprint TEXT");
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_fingerprint_dispute
    ON votes(dispute_id, voter_fingerprint) WHERE voter_fingerprint IS NOT NULL
  `);

  // --- One comment per agent per dispute ---
  console.log("Adding comment dedup constraint...");
  await pool.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_comments_agent_dispute ON comments(dispute_id, agent_id)"
  );

  console.log("Database setup complete!");
  await pool.end();
}

setup().catch(console.error);
