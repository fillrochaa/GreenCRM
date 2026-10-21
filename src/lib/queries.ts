import "server-only";

import { asc, count, eq, sql } from "drizzle-orm";
import { contacts, db, deals, stages } from "@/db";
import type { BoardDeal, BoardStage, ContactOption, ContactRow } from "./types";

export function getStages(): BoardStage[] {
  return db
    .select({ id: stages.id, name: stages.name, description: stages.description, kind: stages.kind })
    .from(stages)
    .orderBy(asc(stages.position))
    .all();
}

export function getBoardDeals(): BoardDeal[] {
  return db
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
    .orderBy(asc(deals.stageId), asc(deals.position), asc(deals.id))
    .all()
    .map((d) => ({ ...d, stageChangedAt: d.stageChangedAt.getTime(), createdAt: d.createdAt.getTime() }));
}

export function getContactOptions(): ContactOption[] {
  return db
    .select({ id: contacts.id, name: contacts.name, company: contacts.company })
    .from(contacts)
    .orderBy(sql`${contacts.name} collate nocase`)
    .all();
}

export function getContactRows(): ContactRow[] {
  const dealCounts = db
    .select({ contactId: deals.contactId, total: count().as("total") })
    .from(deals)
    .groupBy(deals.contactId)
    .as("deal_counts");

  return db
    .select({
      id: contacts.id,
      name: contacts.name,
      company: contacts.company,
      email: contacts.email,
      phone: contacts.phone,
      notes: contacts.notes,
      createdAt: contacts.createdAt,
      dealCount: sql<number>`coalesce(${dealCounts.total}, 0)`,
    })
    .from(contacts)
    .leftJoin(dealCounts, eq(dealCounts.contactId, contacts.id))
    .orderBy(sql`${contacts.name} collate nocase`)
    .all()
    .map((c) => ({ ...c, createdAt: c.createdAt.getTime() }));
}

/** Negócios de um contato, para exibir no detalhe do contato. */
export function getDealsByContact() {
  const rows = db
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
    .orderBy(asc(stages.position), asc(deals.position))
    .all();

  const byContact: Record<number, typeof rows> = {};
  for (const row of rows) (byContact[row.contactId] ??= []).push(row);
  return byContact;
}
