import pg from "pg";

const { Pool } = pg;

const generateConnectionString = () => {
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
  console.log(
    "Connecting to DB with config:",
    `postgresql://${DB_USER}:${DB_PASSWORD ? "*****" : undefined}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
  );
  return `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable`;
};

const pool = new Pool({
  connectionString: generateConnectionString(),
  ssl: { rejectUnauthorized: false }, // required for Supabase
  family: 4, // 👈 force IPv4
});

export async function initDB() {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected at:", res.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err.message);
    process.exit(1);
  }
}

export const db = {
  // regular queries — pool manages connection automatically
  query: (text, params) => pool.query(text, params),

  // transactions — need dedicated client
  transaction: async (fn) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};
