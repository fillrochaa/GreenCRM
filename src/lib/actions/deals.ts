"use server";

import { and, eq, inArray, min } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { contacts, db, deals, stages } from "@/db";
import { emptyToNull, fail, invalid, ok, type ActionResult } from "@/lib/action-result";

const dealSchema = z.object({
  title: z.string().trim().min(1, "Dê um título ao negócio.").max(160),
  contactId: z.number({ error: "Escolha um contato." }).int().positive("Escolha um contato."),
  stageId: z.number().int().positive("Escolha uma etapa."),
  valueCents: z.number().int().nonnegative("O valor não pode ser negativo.").max(1e14).nullable(),
  expectedCloseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .nullable(),
  notes: z.string().max(4000).nullable(),
});

export type DealInput = z.input<typeof dealSchema>;

function revalidate() {
  revalidatePath("/funil");
  revalidatePath("/contatos");
}

function checkReferences(contactId: number, stageId: number): string | null {
  if (!db.select({ id: contacts.id }).from(contacts).where(eq(contacts.id, contactId)).get()) {
    return "Contato não encontrado.";
  }
  if (!db.select({ id: stages.id }).from(stages).where(eq(stages.id, stageId)).get()) {
    return "Etapa não encontrada.";
  }
  return null;
}

/** Posição para entrar no topo da coluna. */
function topPosition(stageId: number) {
  const row = db.select({ value: min(deals.position) }).from(deals).where(eq(deals.stageId, stageId)).get();
  return row?.value == null ? 0 : row.value - 1;
}

export async function createDeal(input: DealInput): Promise<ActionResult<{ id: number }>> {
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const refError = checkReferences(data.contactId, data.stageId);
  if (refError) return fail(refError);

  const [deal] = db
    .insert(deals)
    .values({ ...data, notes: emptyToNull(data.notes), position: topPosition(data.stageId) })
    .returning({ id: deals.id })
    .all();
  revalidate();
  return ok(deal);
}

export async function updateDeal(id: number, input: DealInput): Promise<ActionResult> {
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const current = db.select().from(deals).where(eq(deals.id, id)).get();
  if (!current) return fail("Negócio não encontrado.");
  const refError = checkReferences(data.contactId, data.stageId);
  if (refError) return fail(refError);

  const stageChanged = current.stageId !== data.stageId;
  db.update(deals)
    .set({
      ...data,
      notes: emptyToNull(data.notes),
      ...(stageChanged && { stageChangedAt: new Date(), position: topPosition(data.stageId) }),
    })
    .where(eq(deals.id, id))
    .run();
  revalidate();
  return ok(null);
}

export async function deleteDeal(id: number): Promise<ActionResult> {
  db.delete(deals).where(eq(deals.id, id)).run();
  revalidate();
  return ok(null);
}

const moveSchema = z.object({
  dealId: z.number().int().positive(),
  stageId: z.number().int().positive(),
  /** Ordem final dos negócios na coluna de destino, já incluindo o negócio movido. */
  orderedIds: z.array(z.number().int().positive()).max(5000),
});

/** Chamado pelo arrastar-e-soltar do Kanban. */
export async function moveDeal(input: z.input<typeof moveSchema>): Promise<ActionResult> {
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return fail("Movimento inválido.");
  const { dealId, stageId, orderedIds } = parsed.data;
  if (!orderedIds.includes(dealId)) return fail("Movimento inválido.");

  const result = db.transaction((tx) => {
    const deal = tx.select().from(deals).where(eq(deals.id, dealId)).get();
    if (!deal) return fail("Negócio não encontrado.");
    if (!tx.select({ id: stages.id }).from(stages).where(eq(stages.id, stageId)).get()) {
      return fail("Etapa não encontrada.");
    }

    if (deal.stageId !== stageId) {
      tx.update(deals).set({ stageId, stageChangedAt: new Date() }).where(eq(deals.id, dealId)).run();
    }

    // Só reordena negócios que de fato estão na coluna de destino.
    const inStage = new Set(
      tx
        .select({ id: deals.id })
        .from(deals)
        .where(and(eq(deals.stageId, stageId), inArray(deals.id, orderedIds)))
        .all()
        .map((r) => r.id),
    );
    orderedIds
      .filter((id) => inStage.has(id))
      .forEach((id, index) => {
        tx.update(deals).set({ position: index }).where(eq(deals.id, id)).run();
      });
    return ok(null);
  });

  if (result.ok) revalidate();
  return result;
}
