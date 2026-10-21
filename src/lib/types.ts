import type { StageKind } from "@/db/schema";

export type BoardStage = {
  id: number;
  name: string;
  description: string | null;
  kind: StageKind;
};

export type BoardDeal = {
  id: number;
  title: string;
  stageId: number;
  valueCents: number | null;
  expectedCloseDate: string | null;
  notes: string | null;
  stageChangedAt: number;
  createdAt: number;
  contact: { id: number; name: string; company: string | null };
};

export type ContactOption = { id: number; name: string; company: string | null };

export type ContactRow = ContactOption & {
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: number;
  dealCount: number;
};

export type ContactDeal = {
  id: number;
  title: string;
  valueCents: number | null;
  stageName: string;
  stageKind: StageKind;
};
