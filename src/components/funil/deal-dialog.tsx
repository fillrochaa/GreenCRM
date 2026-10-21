"use client";

import { useId, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { createDeal, deleteDeal, updateDeal } from "@/lib/actions/deals";
import { centsToInput, formatDate, parseBRL } from "@/lib/format";
import type { BoardDeal, BoardStage, ContactOption } from "@/lib/types";
import { Dialog, DialogBody, DialogFooter } from "@/components/dialog";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { ContactDialog } from "@/components/contacts/contact-dialog";
import { ContactPicker } from "./contact-picker";

type Props = {
  open: boolean;
  onClose: () => void;
  stages: BoardStage[];
  contacts: ContactOption[];
  /** Negócio em edição; ausente = novo negócio. */
  deal?: BoardDeal | null;
  /** Etapa sugerida para um negócio novo. */
  defaultStageId?: number;
};

export function DealDialog(props: Props) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={props.deal ? "Editar negócio" : "Novo negócio"}
      description={props.deal ? `Criado em ${formatDate(props.deal.createdAt)}` : undefined}
      width={560}
    >
      <DealForm key={`${props.deal?.id ?? "new"}-${props.defaultStageId ?? ""}`} {...props} />
    </Dialog>
  );
}

function DealForm({ onClose, stages, contacts, deal, defaultStageId }: Props) {
  const id = useId();
  const [title, setTitle] = useState(deal?.title ?? "");
  const [contactId, setContactId] = useState<number | null>(deal?.contact.id ?? null);
  const [stageId, setStageId] = useState(deal?.stageId ?? defaultStageId ?? stages[0]?.id);
  const [value, setValue] = useState(centsToInput(deal?.valueCents));
  const [closeDate, setCloseDate] = useState(deal?.expectedCloseDate ?? "");
  const [notes, setNotes] = useState(deal?.notes ?? "");

  // Contatos cadastrados por aqui ainda não chegaram via props do servidor.
  const [extraContacts, setExtraContacts] = useState<ContactOption[]>([]);
  const allContacts = [...contacts, ...extraContacts.filter((e) => !contacts.some((c) => c.id === e.id))];
  const [newContactName, setNewContactName] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  // Depois de escolher o cliente, o próximo passo natural é o título.
  const focusTitle = () => requestAnimationFrame(() => document.getElementById(`${id}-title`)?.focus());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const valueCents = parseBRL(value);
    if (value.trim() && valueCents === null) {
      setFieldErrors({ valueCents: "Valor inválido. Use, por exemplo, 12.400,00." });
      return;
    }
    if (contactId === null) {
      setFieldErrors({ contactId: "Escolha um contato." });
      return;
    }
    const input = {
      title,
      contactId,
      stageId,
      valueCents,
      expectedCloseDate: closeDate || null,
      notes: notes || null,
    };
    startTransition(async () => {
      const result = deal ? await updateDeal(deal.id, input) : await createDeal(input);
      if (result.ok) onClose();
      else {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.error ?? null);
      }
    });
  }

  function remove() {
    if (!deal) return;
    startTransition(async () => {
      const result = await deleteDeal(deal.id);
      if (result.ok) onClose();
      else setError(result.error ?? "Não foi possível excluir.");
    });
  }

  return (
    <>
      <form onSubmit={submit} noValidate>
        <DialogBody>
          <Field label="Cliente" htmlFor={`${id}-contact`} required error={fieldErrors.contactId}>
            <ContactPicker
              id={`${id}-contact`}
              contacts={allContacts}
              value={contactId}
              onChange={(cid) => {
                setContactId(cid);
                setFieldErrors(({ contactId: _, ...rest }) => rest);
                focusTitle();
              }}
              onCreateRequest={(name) => setNewContactName(name)}
              invalid={!!fieldErrors.contactId}
            />
          </Field>

          <Field label="Título do negócio" htmlFor={`${id}-title`} required error={fieldErrors.title}>
            <Input
              id={`${id}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!fieldErrors.title}
              autoComplete="off"
              placeholder="Ex.: Plano anual de manutenção"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor (R$)" htmlFor={`${id}-value`} error={fieldErrors.valueCents}>
              <Input
                id={`${id}-value`}
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => {
                  const cents = parseBRL(value);
                  if (cents !== null) setValue(centsToInput(cents));
                }}
                aria-invalid={!!fieldErrors.valueCents}
                autoComplete="off"
                placeholder="0,00"
              />
            </Field>
            <Field label="Previsão de fechamento" htmlFor={`${id}-date`} error={fieldErrors.expectedCloseDate}>
              <Input id={`${id}-date`} type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            </Field>
          </div>

          <Field label="Etapa" htmlFor={`${id}-stage`} error={fieldErrors.stageId}>
            <Select id={`${id}-stage`} value={stageId} onChange={(e) => setStageId(Number(e.target.value))}>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Observações" htmlFor={`${id}-notes`}>
            <Textarea
              id={`${id}-notes`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Próximos passos, contexto da conversa…"
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-sm bg-danger/10 px-3 py-2 text-label text-danger">
              {error}
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          {deal &&
            (confirmingDelete ? (
              <span className="flex items-center gap-2">
                <span className="text-label text-ink-muted">Excluir de vez?</span>
                <Button variant="danger" size="sm" onClick={remove} disabled={pending}>
                  Sim, excluir
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                  Não
                </Button>
              </span>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)} disabled={pending}>
                <Trash2 size={16} aria-hidden /> Excluir
              </Button>
            ))}
          <span className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : deal ? "Salvar" : "Criar negócio"}
            </Button>
          </span>
        </DialogFooter>
      </form>

      <ContactDialog
        open={newContactName !== null}
        onClose={() => setNewContactName(null)}
        initialName={newContactName ?? ""}
        onSaved={(c) => {
          setExtraContacts((list) => [...list, { id: c.id, name: c.name, company: c.company }]);
          setContactId(c.id);
          setFieldErrors(({ contactId: _, ...rest }) => rest);
          focusTitle();
        }}
      />
    </>
  );
}
