import "server-only";

import { asc, count, eq, sql } from "drizzle-orm";
import { contacts, db, deals, stages } from "@/db";
import type { BoardDeal, BoardStage, ContactDeal, ContactOption, ContactRow } from "./types";

export async function getStages(): Promise<BoardStage[]> {
  return db
    .select({ id: stages.id, name: stages.name, description: stages.description, kind: stages.kind })
    .from(stages)
    .orderBy(asc(stages.position));
}

export async function getBoardDeals(): Promise<BoardDeal[]> {
  const rows = await db
    .select({
      id: deals.id,
      title: deals.title,
      stageId: deals.stageId,
      valueCents: deals.valueCents,
      expectedCloseDate: deals.expectedCloseDate,
      notes: deals.notes,
      stageChangedAt: deals.stageChangedAt,
      createdAt: deals.createdAt,
      contact: { id: contacts.id, name: contacts.name, company: contacts.company },
    })
    .from(deals)
    .innerJoin(contacts, eq(contacts.id, deals.contactId))
    .orderBy(asc(deals.stageId), asc(deals.position), asc(deals.id));

  return rows.map((d) => ({ ...d, stageChangedAt: d.stageChangedAt.getTime(), createdAt: d.createdAt.getTime() }));
}

export async function getContactOptions(): Promise<ContactOption[]> {
  return db
    .select({ id: contacts.id, name: contacts.name, company: contacts.company })
    .from(contacts)
    .orderBy(asc(contacts.name));
}

export async function getContactRows(): Promise<ContactRow[]> {
  const dealCounts = db
    .select({ contactId: deals.contactId, total: count().as("total") })
    .from(deals)
    .groupBy(deals.contactId)
    .as("deal_counts");

  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      company: contacts.company,
      email: contacts.email,
      phone: contacts.phone,
      notes: contacts.notes,
      createdAt: contacts.createdAt,
      // count() do Postgres é bigint e chega como texto; converte para número.
      dealCount: sql<number>`coalesce(${dealCounts.total}, 0)`.mapWith(Number),
    })
    .from(contacts)
    .leftJoin(dealCounts, eq(dealCounts.contactId, contacts.id))
    .orderBy(asc(contacts.name));

  return rows.map((c) => ({ ...c, createdAt: c.createdAt.getTime() }));
}

/** Negócios de cada contato, para exibir no detalhe do contato. */
export async function getDealsByContact(): Promise<Record<number, ContactDeal[]>> {
  const rows = await db
    .select({
      id: deals.id,
      title: deals.title,
      contactId: deals.contactId,
      valueCents: deals.valueCents,
      stageName: stages.name,
      stageKind: stages.kind,
    })
    .from(deals)
    .innerJoin(stages, eq(stages.id, deals.stageId))
    .orderBy(asc(stages.position), asc(deals.position));

  const byContact: Record<number, ContactDeal[]> = {};
  for (const { contactId, ...deal } of rows) (byContact[contactId] ??= []).push(deal);
  return byContact;
}
