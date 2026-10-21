const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatBRL(cents: number | null | undefined, { compact = false } = {}) {
  if (cents == null) return "";
  return (compact ? brlCompact : brl).format(cents / 100);
}

/** Converte "12.400,50", "R$ 12400" ou "12400.5" em centavos. Retorna null se vazio/inválido. */
export function parseBRL(input: string): number | null {
  let s = input.replace(/[^\d,.-]/g, "").trim();
  if (!s) return null;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ""); // "12.400" = doze mil e quatrocentos
  }
  const value = Number(s);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

/** Formata centavos para edição: 1240050 → "12.400,50". */
export function centsToInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "2026-11-12" → "12 nov" (ou "12 nov 2027" se for de outro ano). */
export function formatShortDate(isoDate: string, today = new Date()) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (y !== today.getFullYear()) opts.year = "numeric";
  return date.toLocaleDateString("pt-BR", opts).replace(".", "");
}

export function formatDate(value: Date | number) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
}

export function todayISO(today = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

export function daysSince(value: Date | number, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(value).getTime()) / 86_400_000));
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Formata números brasileiros com DDD: "11987654321" → "(11) 98765-4321". Outros formatos ficam como estão. */
export function formatPhoneBR(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return input.trim();
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
