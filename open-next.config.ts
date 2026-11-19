import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Todas as páginas do CRM são dinâmicas (dados por usuário, sempre atuais),
// então não há cache incremental (ISR) para guardar: nada de R2/KV aqui.
export default defineCloudflareConfig({});
