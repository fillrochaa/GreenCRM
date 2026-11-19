// Trava de segurança antes do build do Cloudflare: o OpenNext embute no Worker publicado
// o conteúdo de todos os arquivos .env* do projeto. Segredos locais ficam no .dev.vars.
import { readdirSync } from "node:fs";

const offending = readdirSync(".").filter((name) => /^\.env(\..+)?$/.test(name) && name !== ".env.example");

if (offending.length > 0) {
  console.error(
    `\n✖ Encontrei ${offending.join(", ")}.\n` +
      "  O OpenNext copiaria esse conteúdo para dentro do Worker publicado.\n" +
      "  Mova os valores para o .dev.vars (local) ou para `wrangler secret put` (produção).\n",
  );
  process.exit(1);
}
