"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { contacts, db, deals, type Contact } from "@/db";
import { emptyToNull, fail, invalid, ok, type ActionResult } from "@/lib/action-result";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do contato.").max(120),
  company: z.string().max(120).optional(),
  email: z
    .string()
    .trim()
    .max(160)
    .refine((v) => v === "" || z.email().safeParse(v).success, "E-mail inválido.")
    .optional(),
  phone: z.string().max(40).optional(),
  notes: z.string().max(4000).optional(),
});

export type ContactInput = z.input<typeof contactSchema>;

function toRow(input: z.output<typeof contactSchema>) {
  return {
    name: input.name,
    company: emptyToNull(input.company),
    email: emptyToNull(input.email),
    phone: emptyToNull(input.phone),
    notes: emptyToNull(input.notes),
  };
}

function revalidate() {
  revalidatePath("/contatos");
  revalidatePath("/funil");
}

export async function createContact(input: ContactInput): Promise<ActionResult<Contact>> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const [contact] = db.insert(contacts).values(toRow(parsed.data)).returning().all();
  revalidate();
  return ok(contact);
}

export async function updateContact(id: number, input: ContactInput): Promise<ActionResult<Contact>> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const [contact] = db.update(contacts).set(toRow(parsed.data)).where(eq(contacts.id, id)).returning().all();
  if (!contact) return fail("Contato não encontrado.");
  revalidate();
  return ok(contact);
}

export async function deleteContact(id: number): Promise<ActionResult> {
  const [{ total }] = db.select({ total: count() }).from(deals).where(eq(deals.contactId, id)).all();
  if (total > 0) {
    return fail(
      `Este contato tem ${total} ${total === 1 ? "negócio" : "negócios"} no funil. Exclua ou transfira os negócios antes.`,
    );
  }
  db.delete(contacts).where(eq(contacts.id, id)).run();
  revalidate();
  return ok(null);
}
