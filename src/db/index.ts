import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import { DEFAULT_STAGES } from "./default-stages";

const DB_PATH = path.join(process.cwd(), "data", "greencrm.db");

function createDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  if (db.select().from(schema.stages).limit(1).all().length === 0) {
    db.insert(schema.stages)
      .values(DEFAULT_STAGES.map((s, i) => ({ ...s, position: i })))
      .run();
  }
  return db;
}

// Reaproveita a conexão entre recargas do servidor de desenvolvimento.
const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createDb> };
export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export * from "./schema";
