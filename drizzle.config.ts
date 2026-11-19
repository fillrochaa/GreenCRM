import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Segredos locais ficam no .dev.vars (o `drizzle-kit studio` precisa do DATABASE_URL).
if (existsSync(".dev.vars")) process.loadEnvFile(".dev.vars");

/**
 * As migrações são geradas a partir de src/db/schema.ts direto na pasta do Supabase
 * (com o prefixo de data que o Supabase espera) e aplicadas com `npm run db:push`.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  migrations: { prefix: "supabase" },
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
