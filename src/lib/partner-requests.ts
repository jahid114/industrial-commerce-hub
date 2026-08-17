export type PartnerType =
  | "Partnership"
  | "Exclusive Partnership"
  | "Product Servicing Agent"
  | "Investor";

export type PartnerStatus =
  | "New"
  | "In Review"
  | "Meeting Scheduled"
  | "Approved"
  | "Rejected";

export const PARTNER_TYPES: PartnerType[] = [
  "Partnership",
  "Exclusive Partnership",
  "Product Servicing Agent",
  "Investor",
];

export const PARTNER_STATUSES: PartnerStatus[] = [
  "New",
  "In Review",
  "Meeting Scheduled",
  "Approved",
  "Rejected",
];

export type PartnerSource = "Public" | "Manual";

export interface PartnerRequest {
  id: string;
  source?: PartnerSource;
  name: string;
  company: string;
  email: string;
  phone: string;
  type: PartnerType;
  passportNumber?: string;
  address?: string;
  shopLocation?: string;
  website?: string;
  tradeLicense?: string;
  cityCorpCert?: string;
  chamberCert?: string;
  amount?: string;
  message?: string;
  files?: string[];
  status: PartnerStatus;
  internalNotes?: string;
  submittedAt: string;
}

const KEY = "partner-requests";

export function readPartnerRequests(): PartnerRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PartnerRequest[]) : [];
  } catch {
    return [];
  }
}

export function writePartnerRequests(items: PartnerRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function addPartnerRequest(
  input: Omit<PartnerRequest, "id" | "status" | "submittedAt"> & { status?: PartnerStatus },
): PartnerRequest {
  const item: PartnerRequest = {
    ...input,
    id: `PRT-${Date.now().toString(36).toUpperCase()}`,
    status: input.status ?? "New",
    submittedAt: new Date().toISOString(),
  };
  writePartnerRequests([...readPartnerRequests(), item]);
  return item;
}
