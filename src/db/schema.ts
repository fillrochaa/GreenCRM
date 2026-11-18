import { sql } from "drizzle-orm";
import { bigint, check, date, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const contacts = pgTable(
  "contacts",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: text("name").notNull(),
    company: text("company"),
    email: text("email"),
    phone: text("phone"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("contacts_name_idx").on(t.name)],
);

/** "open" = etapa em andamento; "won"/"lost" = etapas de fechamento. */
export const stageKinds = ["open", "won", "lost"] as const;
export type StageKind = (typeof stageKinds)[number];

export const stages = pgTable(
  "stages",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: text("name").notNull(),
    description: text("description"),
    position: integer("position").notNull(),
    kind: text("kind", { enum: stageKinds }).notNull().default("open"),
  },
  (t) => [check("stages_kind_check", sql`${t.kind} in ('open', 'won', 'lost')`)],
);

export const deals = pgTable(
  "deals",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    title: text("title").notNull(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "restrict" }),
    stageId: integer("stage_id")
      .notNull()
      .references(() => stages.id, { onDelete: "restrict" }),
    position: integer("position").notNull().default(0),
    /** Valor em centavos, para evitar erros de arredondamento. */
    valueCents: bigint("value_cents", { mode: "number" }),
    expectedCloseDate: date("expected_close_date", { mode: "string" }), // AAAA-MM-DD
    notes: text("notes"),
    stageChangedAt: timestamp("stage_changed_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    index("deals_stage_idx").on(t.stageId, t.position),
    index("deals_contact_idx").on(t.contactId),
    check("deals_value_cents_check", sql`${t.valueCents} >= 0`),
  ],
);

export type Contact = typeof contacts.$inferSelect;
export type Stage = typeof stages.$inferSelect;
export type Deal = typeof deals.$inferSelect;
