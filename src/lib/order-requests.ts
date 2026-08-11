import { useSyncExternalStore } from "react";

export type OrderRequestType = "cancellation" | "return";
export type OrderRequestStatus = "Requested" | "Approved" | "Rejected" | "Completed";

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
}

const KEY = "megahaus-order-requests-v1";

let cache: OrderRequest[] | null = null;
const listeners = new Set<() => void>();

function read(): OrderRequest[] {
  if (typeof window === "undefined") return [];
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as OrderRequest[]) : [];
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

export function addOrderRequest(req: Omit<OrderRequest, "id" | "createdAt" | "status"> & { status?: OrderRequestStatus }) {
  const entry: OrderRequest = {
    ...req,
    status: req.status ?? "Requested",
    id: `${req.type === "return" ? "RET" : "CAN"}-${Math.floor(10000 + Math.random() * 89999)}`,
    createdAt: new Date().toISOString(),
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

export const ORDER_REQUEST_STATUS_COLOR: Record<OrderRequestStatus, string> = {
  Requested: "bg-amber-100 text-amber-800",
  Approved: "bg-blue-100 text-blue-800",
  Rejected: "bg-destructive/10 text-destructive",
  Completed: "bg-success/20 text-success",
};
