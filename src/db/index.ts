import "server-only";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não definida. Copie .env.example para .env.local e preencha.");
  }
  // O pooler do Supabase na porta 6543 (modo transação) não aceita prepared statements.
  const client = postgres(url, { prepare: false, max: 5 });
  return drizzle(client, { schema });
}

// Reaproveita a conexão entre recargas do servidor de desenvolvimento.
const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createDb> };
export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export * from "./schema";
