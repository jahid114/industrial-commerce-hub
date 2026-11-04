import { useSyncExternalStore } from "react";
import type { Order, OrderEvent } from "@/data/types";
import { STAGE_INFO, ORDER_STATUS_COLOR, currentStageIndex } from "@/lib/order-workflow";

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
/** In-flight return on an already-delivered order, for testing status reflection. */
const mockReturn = (
  id: string, orderId: string, customerEmail: string, reason: string, orderTotal: number, status: OrderRequestStatus, days: number, rejectionReason?: string,
): OrderRequest => {
  const events: [OrderRequestStatus, string, string][] = [
    ["Requested", "Customer", `Return requested: ${reason}`],
    ["Approved", "Admin", "Approve Return"],
    ...(status === "Rejected" ? [["Rejected", "Admin", `Rejected: ${rejectionReason}`] as [OrderRequestStatus, string, string]] : []),
  ];
  const last = events.findIndex(([s]) => s === status);
  return {
    id, orderId, customerEmail, type: "return", reason, orderTotal, status, createdAt: daysAgo(days), rejectionReason,
    timeline: events.slice(0, last + 1).map(([, by, message], i) => ({ at: daysAgo(days - i * 0.5), by, type: "status", message })),
  };
};
/** Demo data, seeded once when nothing is stored yet. Pairs with the refund demo orders in data/orders.ts. */
const MOCK: OrderRequest[] = [
  mockReturn("RET-30041", "MH-2026-1041", "rashed@apexgarments.com", "Item damaged on arrival", 329000, "Requested", 1),
  mockReturn("RET-30031", "MH-2026-1031", "rashed@apexgarments.com", "Faulty unit", 190000, "Requested", 0),
  mockReturn("RET-30023", "MH-2026-1023", "store@rupshafoods.com.bd", "Not as described", 78500, "Requested", 3),
  mockReturn("RET-30034","MH-2026-1034", "purchase@concorde-auto.bd", "Wrong item delivered", 90000, "Requested", 2),
  mockReturn("RET-30037", "MH-2026-1037", "mahbub@me-workshop.bd", "Faulty unit", 364000, "Approved", 4),
  mockReturn("RET-30033", "MH-2026-1033", "info@modernbuilders.bd", "Not as described", 130000, "Approved", 5),
  mockReturn("RET-30035", "MH-2026-1035", "ops@sumaiyatextile.bd", "Changed my mind", 314800, "Rejected", 6, "Outside the return window / not a defect"),
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
    const stored = raw ? migrate(JSON.parse(raw)) : [];
    // Top up demo data that older stored copies don't have yet (matched by id, so edits to existing ones are kept).
    cache = [...stored, ...MOCK.filter((m) => !stored.some((s) => s.id === m.id))];
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

/** Return-request status changes as order events, so they show in the order's activity timeline. (Cancellations already write to the order timeline themselves.) */
export function returnEventsForOrder(list: OrderRequest[], orderId: string): OrderEvent[] {
  return list
    .filter((r) => r.orderId === orderId && r.type === "return")
    .flatMap((r) => r.timeline.map((e): OrderEvent => ({ ...e, type: "status", message: `${r.id}: ${e.message}` })));
}

const RETURN_STEPS = {
  Requested: { label: "Return Requested", description: "Customer asked to return the order" },
  Approved: { label: "Return Approved", description: "Return accepted, awaiting goods" },
  Completed: { label: "Returned", description: "Goods received back at warehouse" },
  Rejected: { label: "Return Rejected", description: "Return request declined" },
} as const;

/**
 * One workflow for the order, including its latest return. A return only applies once the order is Delivered;
 * it appends steps to the same stepper and swaps the status badge, instead of living in a separate flow.
 */
export function orderFlow(order: Order, requests: OrderRequest[]) {
  const ret = order.status === "Delivered"
    ? requests.filter((r) => r.orderId === order.id && r.type === "return").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    : undefined;
  const base = { stages: STAGE_INFO as { key: string; label: string; description: string }[], idx: currentStageIndex(order.status), label: order.status as string, color: ORDER_STATUS_COLOR[order.status], rejected: undefined as OrderRequest | undefined };
  if (!ret) return base;
  const s = ret.status === "Received" ? "Completed" : ret.status; // "Received" is never a resting state in the return flow
  const path = s === "Rejected" ? (["Requested", "Rejected"] as const) : (["Requested", "Approved", "Completed"] as const);
  const stages = [...STAGE_INFO, ...path.map((k) => ({ key: `return-${k}`, ...RETURN_STEPS[k] }))];
  const idx = STAGE_INFO.length + path.indexOf(s as never);
  if (s === "Rejected") return { ...base, stages, idx, rejected: ret }; // order itself stays Delivered
  return { ...base, stages, idx, label: RETURN_STEPS[s].label, color: ORDER_REQUEST_STATUS_COLOR[ret.status] };
}

/** Merge return events into an order timeline, oldest first. */
export function mergeTimeline(a: OrderEvent[], b: OrderEvent[]): OrderEvent[] {
  return [...a, ...b].sort((x, y) => x.at.localeCompare(y.at));
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
