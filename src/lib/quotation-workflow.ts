import type { Quotation, QuotationEvent, QuotationItem, QuotationStatus } from "@/data/types";

export const QUOTATION_STAGES: QuotationStatus[] = [
  "New",
  "Under Review",
  "Sourcing",
  "Quoted",
  "Negotiating",
  "Accepted",
];

export const ALL_QUOTATION_STATUSES: QuotationStatus[] = [
  "New",
  "Under Review",
  "Sourcing",
  "Quoted",
  "Negotiating",
  "Accepted",
  "Rejected",
  "Expired",
  "Converted",
];

export interface QStageInfo {
  key: QuotationStatus;
  label: string;
  description: string;
}

export const QSTAGE_INFO: QStageInfo[] = [
  { key: "New", label: "New", description: "RFQ received, awaiting triage" },
  { key: "Under Review", label: "Under Review", description: "Sales team reviewing feasibility" },
  { key: "Sourcing", label: "Sourcing", description: "Fetching prices from suppliers" },
  { key: "Quoted", label: "Quoted", description: "Quotation sent to customer" },
  { key: "Negotiating", label: "Negotiating", description: "Customer discussing terms" },
  { key: "Accepted", label: "Accepted", description: "Customer accepted the quote" },
];

export const QUOTATION_STATUS_COLOR: Record<QuotationStatus, string> = {
  New: "bg-muted text-muted-foreground",
  "Under Review": "bg-blue-100 text-blue-800",
  Sourcing: "bg-amber-100 text-amber-800",
  Quoted: "bg-accent/20 text-accent-foreground",
  Negotiating: "bg-purple-100 text-purple-800",
  Accepted: "bg-success/20 text-success",
  Rejected: "bg-destructive/10 text-destructive",
  Expired: "bg-muted text-muted-foreground",
  Converted: "bg-primary text-primary-foreground",
};

export function quotationStageIndex(status: QuotationStatus): number {
  const idx = QUOTATION_STAGES.indexOf(status);
  return idx < 0 ? -1 : idx;
}

export function nextQuotationAction(status: QuotationStatus): { next: QuotationStatus; label: string } | null {
  switch (status) {
    case "New":
      return { next: "Under Review", label: "Start Review" };
    case "Under Review":
      return { next: "Sourcing", label: "Begin Sourcing" };
    case "Sourcing":
      return { next: "Quoted", label: "Send Quotation" };
    case "Quoted":
      return { next: "Negotiating", label: "Mark Negotiating" };
    case "Negotiating":
      return { next: "Accepted", label: "Mark Accepted" };
    default:
      return null;
  }
}

export function computeQuotedTotal(items: QuotationItem[]): number {
  return items.reduce((s, i) => s + (i.quotedPrice ?? 0) * i.quantity, 0);
}

export function appendQuotationEvent(q: Quotation, event: QuotationEvent): QuotationEvent[] {
  return [...(q.timeline ?? []), event];
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function isTerminalQuotation(status: QuotationStatus): boolean {
  return status === "Rejected" || status === "Expired" || status === "Converted";
}
