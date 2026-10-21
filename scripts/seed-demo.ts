/**
 * Popula o banco com contatos e negócios fictícios para experimentar o Funil.
 * Uso: npm run db:seed-demo   (só roda se ainda não houver contatos)
 */
import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { asc } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { DEFAULT_STAGES } from "../src/db/default-stages";

const dbPath = path.join(process.cwd(), "data", "greencrm.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

if (db.select().from(schema.contacts).limit(1).all().length > 0) {
  console.log("O banco já tem contatos — nada foi alterado.");
  process.exit(0);
}

if (db.select().from(schema.stages).limit(1).all().length === 0) {
  db.insert(schema.stages)
    .values(DEFAULT_STAGES.map((s, i) => ({ ...s, position: i })))
    .run();
}
const stages = db.select().from(schema.stages).orderBy(asc(schema.stages.position)).all();

const contactsData = [
  { name: "Mariana Costa", company: "Clínica Bem-Estar", phone: "(11) 98765-4321", email: "mariana@bemestar.com.br" },
  { name: "Rafael Almeida", company: "Almeida Arquitetura", phone: "(21) 99812-3344", email: "rafael@almeida.arq.br" },
  { name: "Juliana Pereira", company: "Padaria Pão Quente", phone: "(31) 98401-2299", email: null },
  { name: "Carlos Mendes", company: "Mendes Contabilidade", phone: "(41) 99655-1020", email: "carlos@mendescontabil.com.br" },
  { name: "Fernanda Lima", company: null, phone: "(11) 97321-8800", email: "fernanda.lima@gmail.com" },
  { name: "Bruno Oliveira", company: "Oliveira Transportes", phone: "(19) 99123-4567", email: "bruno@oliveiratransp.com.br" },
  { name: "Patrícia Souza", company: "Studio Pilates Equilíbrio", phone: "(48) 98822-1133", email: "contato@pilatesequilibrio.com.br" },
  { name: "Thiago Ribeiro", company: "TR Engenharia", phone: "(62) 99900-1212", email: "thiago@trengenharia.com.br" },
];

const contacts = db.insert(schema.contacts).values(contactsData).returning().all();
const byName = (name: string) => contacts.find((c) => c.name === name)!.id;

const day = 86_400_000;
const dateIn = (days: number) => new Date(Date.now() + days * day).toISOString().slice(0, 10);

const dealsData: [stageIndex: number, title: string, contact: string, value: number | null, close: number | null, idleDays: number][] = [
  [0, "Site institucional", "Fernanda Lima", 4_800, null, 1],
  [0, "Gestão de redes sociais", "Patrícia Souza", 2_400, 20, 3],
  [0, "Sistema de agendamento", "Thiago Ribeiro", null, null, 0],
  [1, "Plano anual de manutenção", "Carlos Mendes", 9_600, 15, 4],
  [1, "Cardápio digital", "Juliana Pereira", 1_500, 7, 6],
  [2, "Renovação do contrato", "Rafael Almeida", 18_000, 25, 2],
  [3, "Implantação do CRM", "Mariana Costa", 12_400, 10, 5],
  [3, "Rastreamento de frota", "Bruno Oliveira", 32_000, -3, 12],
  [4, "Consultoria de processos", "Thiago Ribeiro", 15_750, 5, 3],
  [5, "Identidade visual", "Patrícia Souza", 6_200, null, 9],
  [6, "Loja virtual", "Juliana Pereira", 8_900, null, 15],
];

dealsData.forEach(([stageIndex, title, contact, value, close, idleDays], i) => {
  db.insert(schema.deals)
    .values({
      title,
      contactId: byName(contact),
      stageId: stages[stageIndex].id,
      position: i,
      valueCents: value === null ? null : value * 100,
      expectedCloseDate: close === null ? null : dateIn(close),
      stageChangedAt: new Date(Date.now() - idleDays * day),
    })
    .run();
});

console.log(`Pronto: ${contacts.length} contatos e ${dealsData.length} negócios de demonstração.`);
