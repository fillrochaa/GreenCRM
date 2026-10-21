import type { StageKind } from "@/db/schema";

const kindColor: Record<StageKind, string> = {
  open: "text-brand",
  won: "text-success",
  lost: "text-danger",
};

/** Cápsula de etapa — o elemento-assinatura do guia de identidade. */
export function StagePill({ name, kind }: { name: string; kind: StageKind }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border border-current px-2.5 py-0.5 text-caption font-medium ${kindColor[kind]}`}
    >
      {name}
    </span>
  );
}
