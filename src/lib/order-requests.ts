import { useSyncExternalStore } from "react";

export type OrderRequestType = "cancellation" | "return";
/** "Received" only applies to returns (physical goods back at the warehouse before grading). */
export type OrderRequestStatus = "Requested" | "Approved" | "Received" | "Rejected" | "Completed";

export interface OrderRequestEvent {
  at: string; // ISO timestamp
  by: string;
  type: "status" | "note";
  message: string;
}

export interface OrderRequest {
  id: string;
  orderId: string;
  customerEmail: string;
  type: OrderRequestType;
  reason: string;
  status: OrderRequestStatus;
  createdAt: string; // ISO
  orderTotal?: number;
  orderDate?: string;
  timeline: OrderRequestEvent[];
  /** How a Received return was graded. Set when the request reaches Completed. */
  resolution?: "restock" | "damage" | "scrap";
  /** Required reason captured when a request is rejected. */
  rejectionReason?: string;
  /** Links back to the inventory ReturnEntry created at the "Received" step. */
  inventoryReturnEntryId?: string;
}

const KEY = "megahaus-order-requests-v1";

let cache: OrderRequest[] | null = null;
const listeners = new Set<() => void>();

function migrate(raw: unknown): OrderRequest[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => ({
      ...r,
      timeline: Array.isArray(r.timeline) ? r.timeline : [],
    })) as OrderRequest[];
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const mockReq = (
  id: string, orderId: string, customerEmail: string, type: OrderRequestType, reason: string, orderTotal: number, days: number,
): OrderRequest => ({
  id, orderId, customerEmail, type, reason, orderTotal, status: "Completed", createdAt: daysAgo(days),
  resolution: type === "return" ? "restock" : undefined,
  timeline: [{ at: daysAgo(days), by: "Admin", type: "status", message: type === "return" ? "Return completed" : "Cancellation approved — order cancelled" }],
});
/** Demo data, seeded once when nothing is stored yet. Pairs with the refund demo orders in data/orders.ts. */
const MOCK: OrderRequest[] = [
  mockReq("CAN-20032", "MH-2026-1032", "purchase@hossaingroup.bd", "cancellation", "Project postponed", 2950000, 12),
  mockReq("CAN-20030", "MH-2026-1030", "accounts@deltaplastics.bd", "cancellation", "Ordered the wrong model", 47400, 10),
  mockReq("CAN-20029", "MH-2026-1029", "store@padmapharma.com.bd", "cancellation", "Found a better price elsewhere", 157000, 9),
  mockReq("CAN-20026", "MH-2026-1026", "ops@surmatea.com.bd", "cancellation", "No longer needed", 85000, 8),
  mockReq("RET-20028", "MH-2026-1028", "purchase@meghnaceramics.bd", "return", "Item damaged on arrival", 57000, 12),
  mockReq("RET-20027", "MH-2026-1027", "info@jamunaelectricals.bd", "return", "Wrong item delivered", 285000, 15),
  mockReq("RET-20025", "MH-2026-1025", "procurement@karnaphulishipyard.bd", "return", "Faulty unit", 62000, 6),
];

function read(): OrderRequest[] {
  if (typeof window === "undefined") return [];
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? migrate(JSON.parse(raw)) : MOCK;
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: OrderRequest[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const EMPTY: OrderRequest[] = [];

export function nowIso(): string {
  return new Date().toISOString();
}

export function appendRequestEvent(req: OrderRequest, event: OrderRequestEvent): OrderRequestEvent[] {
  return [...(req.timeline ?? []), event];
}

export function addOrderRequest(
  req: Omit<OrderRequest, "id" | "createdAt" | "status" | "timeline"> & {
    status?: OrderRequestStatus;
    timeline?: OrderRequestEvent[];
  },
) {
  const entry: OrderRequest = {
    ...req,
    status: req.status ?? "Requested",
    id: `${req.type === "return" ? "RET" : "CAN"}-${Math.floor(10000 + Math.random() * 89999)}`,
    createdAt: new Date().toISOString(),
    timeline: req.timeline ?? [],
  };
  write([entry, ...read()]);
  return entry;
}

export function useOrderRequests(customerEmail?: string) {
  const all = useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY,
  );
  return customerEmail ? all.filter((r) => r.customerEmail === customerEmail) : all;
}

export function hasRequest(list: OrderRequest[], orderId: string, type: OrderRequestType) {
  return list.some((r) => r.orderId === orderId && r.type === type);
}

export function requestsForOrder(list: OrderRequest[], orderId: string) {
  return list.filter((r) => r.orderId === orderId);
}

export const ORDER_REQUEST_STATUS_COLOR: Record<OrderRequestStatus, string> = {
  Requested: "bg-amber-100 text-amber-800",
  Approved: "bg-blue-100 text-blue-800",
  Received: "bg-purple-100 text-purple-800",
  Rejected: "bg-destructive/10 text-destructive",
  Completed: "bg-success/20 text-success",
};

/** Guarded setter — callers are expected to go through the transition tables in order-request-workflow.ts. */
export function patchOrderRequest(id: string, patch: Partial<OrderRequest>) {
  write(read().map((r) => (r.id === id ? { ...r, ...patch } : r)));
}
