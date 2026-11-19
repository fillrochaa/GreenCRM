import "server-only";

import { cache } from "react";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

function connect(url: string, options: postgres.Options<{}>) {
  return drizzle(postgres(url, options), { schema });
}

type Db = ReturnType<typeof connect>;

// No Cloudflare Workers, conexões abertas numa requisição não podem ser usadas em outra.
const onWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

const globalForDb = globalThis as unknown as { db?: Db };

/**
 * Banco da requisição atual.
 * - Cloudflare Workers: uma conexão por requisição pelo Hyperdrive, que mantém o pool
 *   perto do Supabase (barato de abrir, ao contrário de ir direto ao Postgres).
 * - Node (next dev / next start): um pool por processo, direto no pooler do Supabase
 *   em modo transação (que não aceita prepared statements).
 */
export const getDb = cache((): Db => {
  if (onWorkers) {
    const { env } = getCloudflareContext();
    return connect(env.HYPERDRIVE.connectionString, { max: 5, fetch_types: false });
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não definida. Copie .env.example para .dev.vars e preencha.");
  }
  return (globalForDb.db ??= connect(url, { prepare: false, max: 5 }));
});

export * from "./schema";
