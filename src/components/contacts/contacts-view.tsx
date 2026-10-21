"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Mail, Phone, Plus, Search, UserRound } from "lucide-react";
import { formatDate, pluralize } from "@/lib/format";
import type { ContactDeal, ContactRow } from "@/lib/types";
import { Avatar, Button, Input } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { ContactDialog } from "./contact-dialog";

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function ContactsView({
  contacts,
  dealsByContact,
}: {
  contacts: ContactRow[];
  dealsByContact: Record<number, ContactDeal[]>;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(deferredQuery.trim());
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.company, c.email, c.phone].some((v) => v && normalize(v).includes(q)),
    );
  }, [contacts, deferredQuery]);

  const editing = contacts.find((c) => c.id === editingId) ?? null;

  return (
    <div className="flex flex-col gap-6 px-8 py-8">
      <PageHeader
        title="Contatos"
        subtitle={pluralize(contacts.length, "contato cadastrado", "contatos cadastrados")}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} aria-hidden /> Novo contato
          </Button>
        }
      />

      {contacts.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search
              size={18}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, empresa, e-mail ou telefone"
              aria-label="Buscar contatos"
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised shadow-card">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-label text-ink-muted">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Contato</th>
                  <th className="px-4 py-3 font-medium">Negócios</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setEditingId(c.id)}
                    className="cursor-pointer border-b border-border last:border-b-0 hover:bg-surface-sunken/60"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(c.id);
                        }}
                        className="flex cursor-pointer items-center gap-3 text-left"
                      >
                        <Avatar name={c.name} size={36} />
                        <span className="flex flex-col">
                          <span className="font-medium">{c.name}</span>
                          {c.company && <span className="text-label text-ink-muted">{c.company}</span>}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-label text-ink-muted">
                      <div className="flex flex-col gap-0.5">
                        {c.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone size={14} aria-hidden /> {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail size={14} aria-hidden /> {c.email}
                          </span>
                        )}
                        {!c.phone && !c.email && <span>—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-label">
                      {c.dealCount > 0 ? pluralize(c.dealCount, "negócio", "negócios") : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-label text-ink-muted">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-ink-muted">
                      Nenhum contato encontrado para “{deferredQuery}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ContactDialog open={creating} onClose={() => setCreating(false)} />
      <ContactDialog
        open={editing !== null}
        onClose={() => setEditingId(null)}
        contact={editing}
        deals={editing ? dealsByContact[editing.id] : []}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong/50 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken text-brand">
        <UserRound size={22} aria-hidden />
      </span>
      <h2 className="text-title font-medium">Nenhum contato ainda</h2>
      <p className="max-w-sm text-ink-muted">
        Cadastre seus clientes e leads aqui. Depois, é só vincular cada um a um negócio no Funil.
      </p>
      <Button onClick={onCreate} className="mt-2">
        <Plus size={18} aria-hidden /> Cadastrar primeiro contato
      </Button>
    </div>
  );
}
