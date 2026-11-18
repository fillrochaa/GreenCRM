/**
 * O Supabase Auth só é usado no servidor (Server Actions, páginas e proxy),
 * por isso as variáveis não levam o prefixo NEXT_PUBLIC_ e nunca vão para o navegador.
 */
export function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY precisam estar no .env.local (veja .env.example).");
  }
  return { url, key };
}
