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
      jury_id TEXT NOT NULL DEFAULT 'judge-diana',
      verdict_text TEXT,
      verdict_winner TEXT,
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

  console.log("Database setup complete!");
  await pool.end();
}

setup().catch(console.error);
