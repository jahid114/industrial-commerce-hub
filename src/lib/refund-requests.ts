import { useSyncExternalStore } from "react";

export type RefundStatus = "Pending" | "Processing" | "Complete" | "Rejected";
export type RefundMethod = "Bank" | "bKash" | "Nagad";

export interface RefundAccount {
  method: RefundMethod;
  /** bKash / Nagad */
  phone?: string;
  /** Bank */
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  accountNumber?: string;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  customerEmail: string;
  /** Fallback display name when the order is no longer in the store. */
  customerName?: string;
  amount: number;
  account: RefundAccount;
  status: RefundStatus;
  createdAt: string;
  rejectionReason?: string;
}

export const REFUND_STATUS_COLOR: Record<RefundStatus, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Processing: "bg-blue-100 text-blue-800",
  Complete: "bg-success/20 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

/** Pending → Processing | Rejected; Processing → Complete. */
export const REFUND_NEXT: Partial<Record<RefundStatus, RefundStatus>> = {
  Pending: "Processing",
  Processing: "Complete",
};

const KEY = "megahaus-refund-requests-v1";
const EMPTY: RefundRequest[] = [];
let cache: RefundRequest[] | null = null;
const listeners = new Set<() => void>();

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
/** Demo data, seeded once when nothing is stored yet. */
const MOCK: RefundRequest[] = [
  { id: "REF-10231", orderId: "MH-2026-1032", customerEmail: "purchase@hossaingroup.bd", amount: 2950000, status: "Pending", createdAt: d(1),
    account: { method: "Bank", bankName: "Dutch-Bangla Bank", branchName: "Motijheel", routingNumber: "090261726", accountNumber: "1011234567890" } },
  { id: "REF-10198", orderId: "MH-2026-1030", customerEmail: "accounts@deltaplastics.bd", amount: 47400, status: "Pending", createdAt: d(2),
    account: { method: "bKash", phone: "01911223344" } },
  { id: "REF-10177", orderId: "MH-2026-1029", customerEmail: "store@padmapharma.com.bd", amount: 157000, status: "Processing", createdAt: d(4),
    account: { method: "Bank", bankName: "BRAC Bank", branchName: "Gulshan", routingNumber: "060261726", accountNumber: "1501987654321" } },
  { id: "REF-10142", orderId: "MH-2026-1027", customerEmail: "info@jamunaelectricals.bd", amount: 285000, status: "Complete", createdAt: d(9),
    account: { method: "Bank", bankName: "City Bank", branchName: "Bogura", routingNumber: "225261726", accountNumber: "3201445566778" } },
  { id: "REF-10110", orderId: "MH-2026-1028", customerEmail: "purchase@meghnaceramics.bd", amount: 57000, status: "Rejected", createdAt: d(14),
    rejectionReason: "Return was rejected at inspection; item was used", account: { method: "Nagad", phone: "01822334455" } },
  { id: "REF-10244", orderId: "MH-2026-1024", customerEmail: "accounts@bashundharapaints.bd", customerName: "Bashundhara Paints", amount: 128000, status: "Pending", createdAt: d(0),
    account: { method: "bKash", phone: "01715667788" } },
  { id: "REF-10240", orderId: "MH-2026-1023", customerEmail: "store@rupshafoods.com.bd", customerName: "Rupsha Foods Ltd.", amount: 94500, status: "Pending", createdAt: d(1),
    account: { method: "Bank", bankName: "Islami Bank", branchName: "Khulna Main", routingNumber: "125261726", accountNumber: "20501770100123456" } },
  { id: "REF-10236", orderId: "MH-2026-1022", customerEmail: "info@sylhetsteel.bd", customerName: "Sylhet Steel Works", amount: 312000, status: "Pending", createdAt: d(3),
    account: { method: "Nagad", phone: "01633445566" } },
];

function read(): RefundRequest[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const stored = localStorage.getItem(KEY);
    const raw = stored === null ? [] : JSON.parse(stored);
    const list: RefundRequest[] = Array.isArray(raw) ? raw : [];
    // Demo data: add any mock request not already stored, so older browsers get new mocks too.
    cache = [...list, ...MOCK.filter((m) => !list.some((r) => r.id === m.id))];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: RefundRequest[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function addRefundRequest(req: Omit<RefundRequest, "id" | "createdAt" | "status">) {
  const entry: RefundRequest = {
    ...req,
    id: `REF-${Math.floor(10000 + Math.random() * 89999)}`,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
  write([entry, ...read()]);
  return entry;
}

export function patchRefundRequest(id: string, patch: Partial<RefundRequest>) {
  write(read().map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

export function useRefundRequests(customerEmail?: string) {
  const all = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
  return customerEmail ? all.filter((r) => r.customerEmail === customerEmail) : all;
}

/** Returns an error message, or null when the account details are valid. */
export function validateRefundAccount(a: RefundAccount): string | null {
  if (a.method === "Bank") {
    if (![a.bankName, a.branchName, a.routingNumber, a.accountNumber].every((v) => v?.trim()))
      return "Bank name, branch name, routing number and account number are all required.";
    return null;
  }
  return /^(\+?88)?01\d{9}$/.test((a.phone ?? "").trim()) ? null : "Enter a valid Bangladeshi mobile number (e.g. 01XXXXXXXXX).";
}
