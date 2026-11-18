import type { Metadata } from "next";
import { getBoardDeals, getContactOptions, getStages } from "@/lib/queries";
import { Board } from "@/components/funil/board";

export const metadata: Metadata = { title: "Funil" };
export const dynamic = "force-dynamic";

export default async function FunilPage() {
  const [stages, deals, contacts] = await Promise.all([getStages(), getBoardDeals(), getContactOptions()]);
  return <Board stages={stages} deals={deals} contacts={contacts} />;
}
