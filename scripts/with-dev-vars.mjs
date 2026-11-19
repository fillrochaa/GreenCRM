// Roda um comando com os segredos locais do .dev.vars no ambiente.
// Uso: node scripts/with-dev-vars.mjs <comando> [args...]
// (Os segredos não ficam em .env*: o OpenNext embutiria esses arquivos no Worker publicado.)
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

if (existsSync(".dev.vars")) process.loadEnvFile(".dev.vars");

// Como no `npm run`: os binários do projeto (next, opennextjs-cloudflare…) ficam no PATH.
const binDir = path.resolve("node_modules", ".bin");
const env = { ...process.env, PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}` };

const [command, ...args] = process.argv.slice(2);
const child = spawn(command, args, { stdio: "inherit", env, shell: process.platform === "win32" });

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code, signal) => (signal ? process.kill(process.pid, signal) : process.exit(code ?? 1)));
