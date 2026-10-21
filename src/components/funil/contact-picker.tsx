"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, UserPlus, X } from "lucide-react";
import type { ContactOption } from "@/lib/types";
import { Avatar } from "@/components/ui";

function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Combobox de contatos com busca. A última opção cadastra um contato novo
 * com o texto digitado, sem sair do formulário do negócio.
 */
export function ContactPicker({
  id,
  contacts,
  value,
  onChange,
  onCreateRequest,
  invalid,
}: {
  id: string;
  contacts: ContactOption[];
  value: number | null;
  onChange: (contactId: number | null) => void;
  onCreateRequest: (name: string) => void;
  invalid?: boolean;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = contacts.find((c) => c.id === value) ?? null;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    const list = q
      ? contacts.filter((c) => normalize(c.name).includes(q) || (c.company && normalize(c.company).includes(q)))
      : contacts;
    return list.slice(0, 50);
  }, [contacts, query]);

  // Opções = contatos encontrados + "cadastrar novo" no final.
  const optionCount = matches.length + 1;

  function choose(index: number) {
    if (index < matches.length) {
      onChange(matches[index].id);
      setQuery("");
      setOpen(false);
    } else {
      setOpen(false);
      onCreateRequest(query.trim());
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => (a + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + optionCount) % optionCount);
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" && open) {
      e.preventDefault(); // fecha só a lista, não o modal
      setOpen(false);
    }
  }

  if (selected && !open) {
    return (
      <div
        className={`flex h-12 items-center gap-3 rounded-sm border bg-surface-raised px-3 ${invalid ? "border-danger" : "border-border-strong"}`}
      >
        <Avatar name={selected.name} size={28} />
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate font-medium">{selected.name}</span>
          {selected.company && <span className="truncate text-caption text-ink-muted">{selected.company}</span>}
        </span>
        <button
          id={id}
          type="button"
          onClick={() => {
            setOpen(true);
            setActive(0);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="cursor-pointer rounded-sm px-2 py-1 text-label text-brand hover:bg-surface-sunken"
        >
          Trocar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <input
          ref={inputRef}
          id={selected ? undefined : id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? `${listId}-${active}` : undefined}
          aria-invalid={invalid}
          data-autofocus={selected ? undefined : true}
          autoComplete="off"
          value={query}
          placeholder="Buscar contato pelo nome ou empresa"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onClick={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="h-10 w-full rounded-sm border border-border-strong bg-surface-raised pr-9 pl-3 text-body text-ink placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-offset-0 aria-[invalid=true]:border-danger"
        />
        {selected ? (
          <button
            type="button"
            aria-label="Manter contato atual"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen(false)}
            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-ink-muted hover:text-ink"
          >
            <X size={16} aria-hidden />
          </button>
        ) : (
          <ChevronsUpDown
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted"
          />
        )}
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Contatos"
          // mousedown sem preventDefault tiraria o foco do input antes do clique
          onMouseDown={(e) => e.preventDefault()}
          className="max-h-56 overflow-y-auto rounded-sm border border-border bg-surface-raised py-1 shadow-card"
        >
          {matches.map((c, i) => (
            <li
              key={c.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${i === active ? "bg-surface-sunken" : ""}`}
            >
              <Avatar name={c.name} size={24} />
              <span className="min-w-0 truncate">{c.name}</span>
              {c.company && <span className="truncate text-label text-ink-muted">· {c.company}</span>}
            </li>
          ))}
          {matches.length === 0 && query && (
            <li className="px-3 py-2 text-label text-ink-muted" aria-hidden>
              Nenhum contato com “{query}”.
            </li>
          )}
          <li
            id={`${listId}-${matches.length}`}
            role="option"
            aria-selected={active === matches.length}
            onMouseEnter={() => setActive(matches.length)}
            onClick={() => choose(matches.length)}
            className={`flex cursor-pointer items-center gap-3 border-t border-border px-3 py-2 font-medium text-brand ${active === matches.length ? "bg-surface-sunken" : ""}`}
          >
            <UserPlus size={18} aria-hidden />
            {query.trim() ? `Cadastrar “${query.trim()}” como novo contato` : "Cadastrar novo contato"}
          </li>
        </ul>
      )}
    </div>
  );
}
