import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Lê o .env.local como o Next faz, para o `drizzle-kit studio` achar o DATABASE_URL.
loadEnvConfig(process.cwd());

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
