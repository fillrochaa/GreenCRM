"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Modal baseado no <dialog> nativo: foco preso, Esc fecha e o fundo fica inerte.
 * Renderizado em portal para permitir modais empilhados sem aninhar <form>s.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressedOnBackdrop = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // O autoFocus do React roda antes do showModal; por isso marcamos o campo com data-autofocus.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, mounted]);

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={ref}
      // No React, o "close" de um modal empilhado sobe pela árvore até este; só reage ao próprio.
      onClose={(e) => {
        if (e.target === ref.current) onClose();
      }}
      onMouseDown={(e) => (pressedOnBackdrop.current = e.target === ref.current)}
      onClick={(e) => {
        if (pressedOnBackdrop.current && e.target === ref.current) onClose();
      }}
      style={{ width: `min(${width}px, calc(100vw - 32px))` }}
      className="m-auto max-h-[calc(100dvh-32px)] rounded-lg border border-border bg-surface-raised p-0 text-ink shadow-pop"
    >
      {open && (
        <div className="flex flex-col">
          <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
            <div>
              <h2 className="font-display text-h2 font-medium">{title}</h2>
              {description && <p className="mt-1 text-label text-ink-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="-mt-1 -mr-2 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink"
            >
              <X size={18} aria-hidden />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>,
    document.body,
  );
}

export function DialogBody({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4 px-6 pb-2">{children}</div>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <footer className="mt-4 flex items-center gap-2 border-t border-border px-6 py-4">{children}</footer>
  );
}
