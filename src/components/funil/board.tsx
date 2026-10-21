"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { moveDeal } from "@/lib/actions/deals";
import { formatBRL, pluralize } from "@/lib/format";
import type { BoardDeal, BoardStage, ContactOption } from "@/lib/types";
import { Button } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { DealCardView, SortableDealCard } from "./deal-card";
import { DealDialog } from "./deal-dialog";

type Columns = Record<number, number[]>;

const columnId = (stageId: number) => `stage-${stageId}`;

function buildColumns(stages: BoardStage[], deals: BoardDeal[]): Columns {
  const columns: Columns = Object.fromEntries(stages.map((s) => [s.id, [] as number[]]));
  for (const deal of deals) columns[deal.stageId]?.push(deal.id);
  return columns;
}

// Ponteiro primeiro (preciso entre colunas); no teclado, o canto mais próximo.
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : closestCorners(args);
};

export function Board({
  stages,
  deals,
  contacts,
}: {
  stages: BoardStage[];
  deals: BoardDeal[];
  contacts: ContactOption[];
}) {
  const dndId = useId();
  const dealsById = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);
  const stagesById = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);

  const [columns, setColumns] = useState(() => buildColumns(stages, deals));
  const [activeId, setActiveId] = useState<number | null>(null);
  const dragStart = useRef<{ columns: Columns; stageId: number } | null>(null);

  // Sincroniza com o servidor quando os dados mudam (fora de um arraste).
  const [syncedDeals, setSyncedDeals] = useState(deals);
  if (deals !== syncedDeals && activeId === null) {
    setSyncedDeals(deals);
    setColumns(buildColumns(stages, deals));
  }

  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const [dialog, setDialog] = useState<{ deal?: BoardDeal; stageId?: number } | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  function findStage(id: UniqueIdentifier, cols = columns): number | null {
    if (typeof id === "string" && id.startsWith("stage-")) return Number(id.slice(6));
    for (const [stageId, ids] of Object.entries(cols)) {
      if (ids.includes(id as number)) return Number(stageId);
    }
    return null;
  }

  function onDragStart({ active }: DragStartEvent) {
    const stageId = findStage(active.id);
    if (stageId === null) return;
    setActiveId(active.id as number);
    dragStart.current = { columns, stageId };
  }

  // Ao passar sobre outra coluna, o card já "muda de coluna" para abrir espaço.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = findStage(active.id);
    const to = findStage(over.id);
    if (from === null || to === null || from === to) return;

    setColumns((cols) => {
      const target = [...cols[to]];
      const overIndex = target.indexOf(over.id as number);
      let index = target.length;
      if (overIndex >= 0) {
        const activeRect = active.rect.current.translated;
        const below = activeRect && activeRect.top > over.rect.top + over.rect.height / 2;
        index = overIndex + (below ? 1 : 0);
      }
      target.splice(index, 0, active.id as number);
      return { ...cols, [from]: cols[from].filter((id) => id !== active.id), [to]: target };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const start = dragStart.current;
    dragStart.current = null;
    setActiveId(null);
    if (!start) return;

    const dealId = active.id as number;
    const stageId = findStage(active.id);
    if (stageId === null) return;

    let next = columns;
    if (over) {
      const overStage = findStage(over.id);
      if (overStage === stageId) {
        const ids = columns[stageId];
        const oldIndex = ids.indexOf(dealId);
        const newIndex = typeof over.id === "number" ? ids.indexOf(over.id) : ids.length - 1;
        if (oldIndex !== newIndex && newIndex >= 0) {
          next = { ...columns, [stageId]: arrayMove(ids, oldIndex, newIndex) };
          setColumns(next);
        }
      }
    }

    const before = start.columns[start.stageId];
    const after = next[stageId];
    const unchanged = stageId === start.stageId && before.join() === after.join();
    if (unchanged) return;

    startTransition(async () => {
      const result = await moveDeal({ dealId, stageId, orderedIds: after });
      if (!result.ok) {
        setColumns(buildColumns(stages, deals));
        setToast(result.error ?? "Não foi possível mover o negócio.");
      }
    });
  }

  function onDragCancel() {
    if (dragStart.current) setColumns(dragStart.current.columns);
    dragStart.current = null;
    setActiveId(null);
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Pegou o negócio ${dealsById.get(active.id as number)?.title ?? ""}.`,
    onDragOver: ({ over }) => {
      const stage = over ? stagesById.get(findStage(over.id) ?? -1) : null;
      return stage ? `Sobre a etapa ${stage.name}.` : "Fora de uma etapa.";
    },
    onDragEnd: ({ over }) => {
      const stage = over ? stagesById.get(findStage(over.id) ?? -1) : null;
      return stage ? `Negócio movido para ${stage.name}.` : "Negócio solto fora de uma etapa.";
    },
    onDragCancel: () => "Movimento cancelado. O negócio voltou para a posição original.",
  };

  // Métricas do cabeçalho
  const openStageIds = stages.filter((s) => s.kind === "open").map((s) => s.id);
  const wonStageIds = stages.filter((s) => s.kind === "won").map((s) => s.id);
  const sumOf = (stageIds: number[]) =>
    stageIds.flatMap((id) => columns[id] ?? []).reduce((sum, id) => sum + (dealsById.get(id)?.valueCents ?? 0), 0);
  const openCount = openStageIds.reduce((n, id) => n + (columns[id]?.length ?? 0), 0);

  const openStages = stages.filter((s) => s.kind === "open");
  const activeDeal = activeId !== null ? dealsById.get(activeId) : undefined;
  const activeStage = activeId !== null ? stagesById.get(findStage(activeId) ?? -1) : undefined;

  return (
    <div className="flex h-dvh flex-col">
      <div className="px-8 pt-8 pb-6">
        <PageHeader
          title="Funil"
          subtitle={
            <>
              {pluralize(openCount, "negócio em aberto", "negócios em aberto")}
              <span aria-hidden> · </span>
              <span className="font-medium text-ink">{formatBRL(sumOf(openStageIds), { compact: true })}</span> no
              pipeline
              <span aria-hidden> · </span>
              <span className="font-medium text-success">{formatBRL(sumOf(wonStageIds), { compact: true })}</span>{" "}
              ganhos
            </>
          }
          actions={
            <Button onClick={() => setDialog({ stageId: stages[0]?.id })}>
              <Plus size={18} aria-hidden /> Novo negócio
            </Button>
          }
        />
      </div>

      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "Para mover um negócio, pressione Espaço. Use as setas para escolher a posição e a etapa, Espaço para soltar ou Esc para cancelar. Enter abre o negócio.",
          },
        }}
      >
        <div className="flex min-h-0 flex-1 gap-6 overflow-x-auto px-8 pb-6">
          {stages.map((stage) => {
            const ids = columns[stage.id] ?? [];
            const progress = openStages.indexOf(stage);
            return (
              <Column
                key={stage.id}
                stage={stage}
                accent={
                  stage.kind === "won"
                    ? "var(--success)"
                    : stage.kind === "lost"
                      ? "var(--danger)"
                      : `color-mix(in srgb, var(--brand) ${Math.round(30 + (70 * (progress + 1)) / openStages.length)}%, transparent)`
                }
                count={ids.length}
                total={ids.reduce((sum, id) => sum + (dealsById.get(id)?.valueCents ?? 0), 0)}
                onAdd={() => setDialog({ stageId: stage.id })}
              >
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  {ids.map((id) => {
                    const deal = dealsById.get(id);
                    return deal ? (
                      <SortableDealCard
                        key={id}
                        deal={deal}
                        stageKind={stage.kind}
                        onOpen={(d) => setDialog({ deal: d })}
                      />
                    ) : null;
                  })}
                </SortableContext>
              </Column>
            );
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {activeDeal && activeStage ? <DealCardView deal={activeDeal} stageKind={activeStage.kind} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <DealDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        stages={stages}
        contacts={contacts}
        deal={dialog?.deal}
        defaultStageId={dialog?.stageId}
      />

      {toast && (
        <div
          role="status"
          className="fixed right-6 bottom-6 z-50 max-w-sm rounded-md bg-abyss px-4 py-3 text-label text-mint shadow-pop"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Column({
  stage,
  accent,
  count,
  total,
  onAdd,
  children,
}: {
  stage: BoardStage;
  accent: string;
  count: number;
  total: number;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId(stage.id), data: { type: "column" } });

  return (
    <section
      aria-label={`Etapa ${stage.name}`}
      className="flex w-[296px] shrink-0 flex-col rounded-lg border border-border bg-surface-raised shadow-card"
    >
      <header className="flex flex-col gap-2 px-4 pt-4 pb-3" title={stage.description ?? undefined}>
        <span aria-hidden className="h-1.5 rounded-full" style={{ background: accent }} />
        <div className="flex items-center gap-2">
          <h2 className="truncate font-medium">{stage.name}</h2>
          <span className="rounded-full bg-surface-sunken px-2 text-caption leading-5 font-medium text-ink-muted">
            {count}
          </span>
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Novo negócio em ${stage.name}`}
            className="ml-auto inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            <Plus size={16} aria-hidden />
          </button>
        </div>
        <p className="text-label text-ink-muted">{total > 0 ? formatBRL(total) : "—"}</p>
      </header>

      <div
        ref={setNodeRef}
        className={`mx-2 mb-2 flex min-h-24 flex-1 flex-col gap-3 overflow-y-auto rounded-md p-2 transition-colors ${
          isOver ? "bg-surface-sunken/60" : ""
        }`}
      >
        {children}
        {count === 0 && (
          <p className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border px-4 py-8 text-center text-label text-ink-muted">
            Arraste um negócio para cá
          </p>
        )}
      </div>
    </section>
  );
}
