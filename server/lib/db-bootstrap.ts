import { db } from "../db";
import { sql } from "drizzle-orm";
import { logInfo, logError } from "./logger";

const BASELINE_MIGRATION_HASH = "94749bf6c3b1bd413183d9e9227ad94c";
const BASELINE_TIMESTAMP = 1767742408340;

export async function bootstrapMigrationTracking() {
  try {
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      )
    `);
    
    const existing = await db.execute(sql`
      SELECT hash FROM drizzle.__drizzle_migrations WHERE hash = ${BASELINE_MIGRATION_HASH}
    `);
    
    if (existing.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${BASELINE_MIGRATION_HASH}, ${BASELINE_TIMESTAMP})
      `);
      logInfo("db.bootstrap", "Migration tracking initialized with baseline");
    }
  } catch (error) {
    logError("db.bootstrap", "Failed to bootstrap migration tracking", { error });
  }
}
