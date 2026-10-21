import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
};

export const contacts = sqliteTable(
  "contacts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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

export const stages = sqliteTable("stages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  position: integer("position").notNull(),
  kind: text("kind", { enum: stageKinds }).notNull().default("open"),
});

export const deals = sqliteTable(
  "deals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "restrict" }),
    stageId: integer("stage_id")
      .notNull()
      .references(() => stages.id, { onDelete: "restrict" }),
    position: integer("position").notNull().default(0),
    /** Valor em centavos, para evitar erros de arredondamento. */
    valueCents: integer("value_cents"),
    expectedCloseDate: text("expected_close_date"), // AAAA-MM-DD
    notes: text("notes"),
    stageChangedAt: integer("stage_changed_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    ...timestamps,
  },
  (t) => [
    index("deals_stage_idx").on(t.stageId, t.position),
    index("deals_contact_idx").on(t.contactId),
  ],
);

export type Contact = typeof contacts.$inferSelect;
export type Stage = typeof stages.$inferSelect;
export type Deal = typeof deals.$inferSelect;
