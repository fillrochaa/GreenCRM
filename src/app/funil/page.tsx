import type { Metadata } from "next";
import { getBoardDeals, getContactOptions, getStages } from "@/lib/queries";
import { Board } from "@/components/funil/board";

export const metadata: Metadata = { title: "Funil" };
export const dynamic = "force-dynamic";

export default function FunilPage() {
  return <Board stages={getStages()} deals={getBoardDeals()} contacts={getContactOptions()} />;
}
