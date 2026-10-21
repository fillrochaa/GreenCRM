import type { StageKind } from "./schema";

/** Etapas iniciais do funil de atendimento e vendas, da oportunidade ao fechamento. */
export const DEFAULT_STAGES: { name: string; description: string; kind: StageKind }[] = [
  { name: "Oportunidade", description: "Lead identificado, ainda sem contato.", kind: "open" },
  { name: "Em atendimento", description: "Primeiro contato feito, entendendo a necessidade.", kind: "open" },
  { name: "Qualificado", description: "Necessidade, orçamento e decisor confirmados.", kind: "open" },
  { name: "Proposta enviada", description: "Proposta comercial nas mãos do cliente.", kind: "open" },
  { name: "Negociação", description: "Ajustando condições, prazos e valores.", kind: "open" },
  { name: "Ganho", description: "Venda fechada.", kind: "won" },
  { name: "Perdido", description: "O cliente não seguiu com a compra.", kind: "lost" },
];
