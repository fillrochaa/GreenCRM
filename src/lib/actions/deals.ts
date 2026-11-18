"use server";

import { eq, min, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { contacts, db, deals, stages } from "@/db";
import { requireUser } from "@/lib/auth";
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

async function checkReferences(contactId: number, stageId: number): Promise<string | null> {
  const [[contact], [stage]] = await Promise.all([
    db.select({ id: contacts.id }).from(contacts).where(eq(contacts.id, contactId)).limit(1),
    db.select({ id: stages.id }).from(stages).where(eq(stages.id, stageId)).limit(1),
  ]);
  if (!contact) return "Contato não encontrado.";
  if (!stage) return "Etapa não encontrada.";
  return null;
}

/** Posição para entrar no topo da coluna. */
async function topPosition(stageId: number) {
  const [row] = await db.select({ value: min(deals.position) }).from(deals).where(eq(deals.stageId, stageId));
  return row?.value == null ? 0 : row.value - 1;
}

export async function createDeal(input: DealInput): Promise<ActionResult<{ id: number }>> {
  await requireUser();
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const refError = await checkReferences(data.contactId, data.stageId);
  if (refError) return fail(refError);

  const [deal] = await db
    .insert(deals)
    .values({ ...data, notes: emptyToNull(data.notes), position: await topPosition(data.stageId) })
    .returning({ id: deals.id });
  revalidate();
  return ok(deal);
}

export async function updateDeal(id: number, input: DealInput): Promise<ActionResult> {
  await requireUser();
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const [current] = await db.select({ stageId: deals.stageId }).from(deals).where(eq(deals.id, id)).limit(1);
  if (!current) return fail("Negócio não encontrado.");
  const refError = await checkReferences(data.contactId, data.stageId);
  if (refError) return fail(refError);

  const stageChanged = current.stageId !== data.stageId;
  await db
    .update(deals)
    .set({
      ...data,
      notes: emptyToNull(data.notes),
      ...(stageChanged && { stageChangedAt: new Date(), position: await topPosition(data.stageId) }),
    })
    .where(eq(deals.id, id));
  revalidate();
  return ok(null);
}

export async function deleteDeal(id: number): Promise<ActionResult> {
  await requireUser();
  await db.delete(deals).where(eq(deals.id, id));
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
  await requireUser();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return fail("Movimento inválido.");
  const { dealId, stageId, orderedIds } = parsed.data;
  if (!orderedIds.includes(dealId)) return fail("Movimento inválido.");

  const result = await db.transaction(async (tx) => {
    // Sequencial de propósito: numa transação tudo corre na mesma conexão.
    const [deal] = await tx.select({ stageId: deals.stageId }).from(deals).where(eq(deals.id, dealId)).limit(1);
    if (!deal) return fail("Negócio não encontrado.");
    const [stage] = await tx.select({ id: stages.id }).from(stages).where(eq(stages.id, stageId)).limit(1);
    if (!stage) return fail("Etapa não encontrada.");

    if (deal.stageId !== stageId) {
      await tx.update(deals).set({ stageId, stageChangedAt: new Date() }).where(eq(deals.id, dealId));
    }

    // Reordena a coluna inteira num só comando (o banco fica longe; evita uma ida por card).
    // O filtro por etapa garante que só negócios que de fato estão na coluna mudem de posição.
    const order = sql.join(
      orderedIds.map((id, index) => sql`(${id}::integer, ${index}::integer)`),
      sql`, `,
    );
    await tx.execute(sql`
      update ${deals} set position = v.position, updated_at = now()
      from (values ${order}) as v(id, position)
      where ${deals.id} = v.id and ${deals.stageId} = ${stageId}
    `);
    return ok(null);
  });

  if (result.ok) revalidate();
  return result;
}
