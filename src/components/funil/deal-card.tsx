"use client";

import { forwardRef } from "react";
import { CalendarClock, Hourglass } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { daysSince, formatBRL, formatShortDate, todayISO } from "@/lib/format";
import type { BoardDeal, BoardStage } from "@/lib/types";
import { Avatar } from "@/components/ui";

type CardProps = {
  deal: BoardDeal;
  stageKind: BoardStage["kind"];
  /** Cópia que acompanha o cursor durante o arraste. */
  overlay?: boolean;
  /** Espaço reservado onde o card vai cair. */
  placeholder?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const DealCardView = forwardRef<HTMLDivElement, CardProps>(function DealCardView(
  { deal, stageKind, overlay, placeholder, className = "", style, ...rest },
  ref,
) {
  const isOpen = stageKind === "open";
  const overdue = isOpen && deal.expectedCloseDate !== null && deal.expectedCloseDate < todayISO();
  const idleDays = daysSince(deal.stageChangedAt);

  return (
    <div
      ref={ref}
      style={style}
      {...rest}
      className={`group/card flex touch-manipulation flex-col gap-2 rounded-md border bg-surface p-4 text-left transition-shadow select-none ${
        placeholder
          ? "border-dashed border-border-strong/60 opacity-40"
          : overlay
            ? "rotate-2 cursor-grabbing border-border-strong shadow-pop"
            : "cursor-grab border-border hover:border-border-strong hover:shadow-card"
      } ${className}`}
    >
      <p className="line-clamp-2 font-medium">{deal.title}</p>

      <div className="flex min-w-0 items-center gap-2 text-label text-ink-muted">
        <Avatar name={deal.contact.name} size={22} />
        <span className="truncate">
          {deal.contact.name}
          {deal.contact.company && ` · ${deal.contact.company}`}
        </span>
      </div>

      {deal.valueCents != null && (
        <p
          className={`font-display text-title font-semibold ${
            stageKind === "won" ? "text-success" : stageKind === "lost" ? "text-ink-muted line-through" : "text-brand"
          }`}
        >
          {formatBRL(deal.valueCents)}
        </p>
      )}

      {(deal.expectedCloseDate || isOpen) && (
        <div className="flex items-center justify-between gap-2 text-caption text-ink-muted">
          {deal.expectedCloseDate ? (
            <span
              className={`flex items-center gap-1 ${overdue ? "font-medium text-warning" : ""}`}
              title={overdue ? "Previsão de fechamento já passou" : "Previsão de fechamento"}
            >
              <CalendarClock size={14} aria-hidden />
              {overdue && <span className="sr-only">Atrasado:</span>}
              {formatShortDate(deal.expectedCloseDate)}
            </span>
          ) : (
            <span />
          )}
          {isOpen && (
            <span className="flex items-center gap-1" title="Tempo nesta etapa">
              <Hourglass size={13} aria-hidden />
              {idleDays === 0 ? "hoje" : `${idleDays}d na etapa`}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export function SortableDealCard({
  deal,
  stageKind,
  onOpen,
}: {
  deal: BoardDeal;
  stageKind: BoardStage["kind"];
  onOpen: (deal: BoardDeal) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: "deal" },
  });

  return (
    <DealCardView
      ref={setNodeRef}
      deal={deal}
      stageKind={stageKind}
      placeholder={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-roledescription="Card arrastável"
      aria-label={`${deal.title}, ${deal.contact.name}`}
      onClick={() => onOpen(deal)}
      onKeyDown={(e) => {
        // Enter abre o negócio; Espaço inicia o arraste pelo teclado.
        if (e.key === "Enter" && !isDragging) {
          e.preventDefault();
          onOpen(deal);
          return;
        }
        listeners?.onKeyDown?.(e);
      }}
    />
  );
}
