"use client";

import { useId, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { Contact } from "@/db/schema";
import { createContact, deleteContact, updateContact } from "@/lib/actions/contacts";
import { formatBRL, formatDate, formatPhoneBR } from "@/lib/format";
import type { ContactDeal, ContactRow } from "@/lib/types";
import { Dialog, DialogBody, DialogFooter } from "@/components/dialog";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { StagePill } from "@/components/funil/stage-pill";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Contato em edição; ausente = cadastro novo. */
  contact?: ContactRow | null;
  /** Negócios do contato em edição. */
  deals?: ContactDeal[];
  /** Pré-preenche o nome ao cadastrar a partir de uma busca. */
  initialName?: string;
  onSaved?: (contact: Contact) => void;
};

export function ContactDialog(props: Props) {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={props.contact ? "Editar contato" : "Novo contato"}
      description={props.contact ? `Cadastrado em ${formatDate(props.contact.createdAt)}` : undefined}
    >
      {/* key: reinicia o formulário a cada abertura */}
      <ContactForm key={`${props.contact?.id ?? "new"}-${props.initialName ?? ""}`} {...props} />
    </Dialog>
  );
}

function ContactForm({ onClose, contact, deals = [], initialName = "", onSaved }: Props) {
  const id = useId();
  const [values, setValues] = useState({
    name: contact?.name ?? initialName,
    company: contact?.company ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    notes: contact?.notes ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation(); // não deixa o submit "vazar" para um formulário pai (modais empilhados)
    startTransition(async () => {
      const result = contact ? await updateContact(contact.id, values) : await createContact(values);
      if (result.ok) {
        onSaved?.(result.data);
        onClose();
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.error ?? null);
      }
    });
  }

  function remove() {
    if (!contact) return;
    startTransition(async () => {
      const result = await deleteContact(contact.id);
      if (result.ok) onClose();
      else {
        setError(result.error ?? "Não foi possível excluir.");
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate>
      <DialogBody>
        <Field label="Nome" htmlFor={`${id}-name`} required error={fieldErrors.name}>
          <Input
            id={`${id}-name`}
            value={values.name}
            onChange={set("name")}
            aria-invalid={!!fieldErrors.name}
            data-autofocus
            autoComplete="off"
            placeholder="Ex.: Mariana Costa"
          />
        </Field>
        <Field label="Empresa" htmlFor={`${id}-company`}>
          <Input
            id={`${id}-company`}
            value={values.company}
            onChange={set("company")}
            autoComplete="off"
            placeholder="Ex.: Clínica Bem-Estar"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone / WhatsApp" htmlFor={`${id}-phone`} error={fieldErrors.phone}>
            <Input
              id={`${id}-phone`}
              type="tel"
              inputMode="tel"
              value={values.phone}
              onChange={set("phone")}
              onBlur={() => setValues((v) => ({ ...v, phone: formatPhoneBR(v.phone) }))}
              autoComplete="off"
              placeholder="(11) 98765-4321"
            />
          </Field>
          <Field label="E-mail" htmlFor={`${id}-email`} error={fieldErrors.email}>
            <Input
              id={`${id}-email`}
              type="email"
              value={values.email}
              onChange={set("email")}
              aria-invalid={!!fieldErrors.email}
              autoComplete="off"
              placeholder="nome@empresa.com.br"
            />
          </Field>
        </div>
        <Field label="Observações" htmlFor={`${id}-notes`}>
          <Textarea id={`${id}-notes`} value={values.notes} onChange={set("notes")} rows={3} />
        </Field>

        {contact && (
          <section aria-labelledby={`${id}-deals`} className="flex flex-col gap-2">
            <h3 id={`${id}-deals`} className="text-label font-medium">
              Negócios no funil
            </h3>
            {deals.length === 0 ? (
              <p className="text-label text-ink-muted">Nenhum negócio com este contato ainda.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
                {deals.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="min-w-0 truncate text-label">{d.title}</span>
                    <span className="flex shrink-0 items-center gap-3">
                      {d.valueCents != null && (
                        <span className="text-label text-ink-muted">{formatBRL(d.valueCents, { compact: true })}</span>
                      )}
                      <StagePill name={d.stageName} kind={d.stageKind} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {error && (
          <p role="alert" className="rounded-sm bg-danger/10 px-3 py-2 text-label text-danger">
            {error}
          </p>
        )}
      </DialogBody>

      <DialogFooter>
        {contact &&
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
            {pending ? "Salvando…" : contact ? "Salvar" : "Cadastrar contato"}
          </Button>
        </span>
      </DialogFooter>
    </form>
  );
}
