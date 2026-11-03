import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { products as seedProducts } from "@/data/products";
import { useStore } from "@/lib/store";
import type { Order } from "@/data/types";

export type StockBucket = "good" | "returned" | "damaged" | "incoming";

/** Closed vocabulary of states a unit of stock can be in. */
export type StockState = "Incoming" | "Good" | "Reserved" | "Sold" | "Returned" | "Damaged" | "WrittenOff";

export type MovementType =
  | "Restock" // Incoming -> Good      (PO received / manual add-stock)
  | "Reserve" // Good -> Reserved      (order placed)
  | "Release" // Reserved -> Good      (order cancelled)
  | "Fulfill" // Reserved -> Sold      (order delivered)
  | "ReturnReceived" // Sold -> Returned      (physical return logged)
  | "ReturnRestock" // Returned -> Good      (resolved: resellable)
  | "ReturnDamage" // Returned -> Damaged   (resolved: damaged)
  | "ReturnScrap" // Returned -> WrittenOff (resolved: unsellable)
  | "DamageLogged" // Good -> Damaged       (standalone damage report)
  | "WriteOff" // Damaged -> WrittenOff
  | "Adjustment"; // Good -> Good (± correction; qty can be negative — the one exception)

export interface InventoryRecord {
  productId: string;
  good: number; // physical on-hand; reservations are an overlay, not a subtraction
  reserved: number; // stored (not derived) — committed to open (non-terminal) orders
  sold: number; // lifetime units delivered, net of any that came back as a return
  returned: number; // physically back, pending inspection
  damaged: number; // identified unsellable, pending write-off
  incoming: number; // on order from supplier
  writtenOff: number; // lifetime scrapped count
  reorderLevel: number;
}

export interface Movement {
  id: string;
  date: string; // ISO
  productId: string;
  type: MovementType;
  fromState: StockState;
  toState: StockState;
  quantity: number; // unsigned, except Adjustment
  reference?: string; // order id / return request id / PO reference
  note?: string;
  user: string;
}

export type ReturnStatus = "Pending" | "Restocked" | "Damaged" | "Scrapped";
export type ReturnCondition = "Resellable" | "Inspect" | "Damaged";
export const RETURN_REASONS = [
  "Wrong item",
  "Defective",
  "Customer change of mind",
  "Warranty",
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export interface ReturnEntry {
  id: string;
  date: string;
  productId: string;
  quantity: number;
  reason: ReturnReason;
  condition: ReturnCondition;
  orderId?: string;
  status: ReturnStatus;
  note?: string;
}

export const DAMAGE_REASONS = [
  "Defective",
  "Transit damage",
  "Expired",
  "Other",
] as const;
export type DamageReason = (typeof DAMAGE_REASONS)[number];

export type DamagedStatus = "Open" | "Written off";

export interface DamagedEntry {
  id: string;
  date: string;
  productId: string;
  quantity: number;
  reason: DamageReason;
  note?: string;
  loggedBy: string;
  status: DamagedStatus;
}

const BUCKET_STATE: Record<StockBucket, StockState> = {
  good: "Good",
  returned: "Returned",
  damaged: "Damaged",
  incoming: "Incoming",
};

function suggestReorderLevel(stock: number): number {
  return Math.max(2, Math.round(stock * 0.2));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyRecord(productId: string): InventoryRecord {
  return {
    productId,
    good: 0,
    reserved: 0,
    sold: 0,
    returned: 0,
    damaged: 0,
    incoming: 0,
    writtenOff: 0,
    reorderLevel: 2,
  };
}

interface InventoryState {
  records: Record<string, InventoryRecord>;
  movements: Movement[];
  returns: ReturnEntry[];
  damaged: DamagedEntry[];
}

interface InventoryContextValue extends InventoryState {
  reserved: (productId: string) => number;
  available: (productId: string) => number;
  goodStock: (productId: string) => number;
  adjust: (input: {
    productId: string;
    bucket: StockBucket;
    delta: number;
    note?: string;
    user?: string;
  }) => void;
  /** Order placed -> reserve stock for each line item. Safe to call once per order. */
  reserveForOrder: (order: Order, user?: string) => void;
  /** Order cancelled -> release the reservation back to available stock. Safe to call once per order. */
  releaseReservation: (order: Order, user?: string) => void;
  /** Order delivered -> convert the reservation into a sold unit (physically leaves the warehouse). */
  fulfillOrder: (order: Order, user?: string) => void;
  /** Physical return received back at the warehouse. Returns the created ReturnEntry id. */
  logReturn: (input: {
    productId: string;
    quantity: number;
    reason: ReturnReason;
    condition: ReturnCondition;
    orderId?: string;
    note?: string;
    user?: string;
  }) => string;
  resolveReturn: (id: string, action: "restock" | "damage" | "scrap", user?: string) => void;
  logDamaged: (input: {
    productId: string;
    quantity: number;
    reason: DamageReason;
    note?: string;
    user?: string;
  }) => void;
  writeOffDamaged: (id: string, user?: string) => void;
  setReorderLevel: (productId: string, level: number) => void;
  registerProduct: (productId: string, initialGood: number) => void;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

const STORAGE_KEY = "megahaus-inventory-v1";

function buildInitial(): InventoryState {
  const records: Record<string, InventoryRecord> = {};
  for (const p of seedProducts) {
    records[p.id] = {
      ...emptyRecord(p.id),
      good: p.stock,
      reorderLevel: suggestReorderLevel(p.stock),
    };
  }
  return { records, movements: [], returns: [], damaged: [] };
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(() => buildInitial());
  const { orders, hydrated: storeHydrated } = useStore();
  const bootstrapped = useRef(false);

  const applyDelta = useCallback(
    (
      productId: string,
      patch: Partial<Pick<InventoryRecord, "good" | "returned" | "damaged" | "incoming">>,
      mv: Omit<Movement, "id" | "date" | "productId">,
    ) => {
      setState((s) => {
        const existing = s.records[productId] ?? emptyRecord(productId);
        const next: InventoryRecord = {
          ...existing,
          good: Math.max(0, existing.good + (patch.good ?? 0)),
          returned: Math.max(0, existing.returned + (patch.returned ?? 0)),
          damaged: Math.max(0, existing.damaged + (patch.damaged ?? 0)),
          incoming: Math.max(0, existing.incoming + (patch.incoming ?? 0)),
        };
        const movement: Movement = { id: uid("mv"), date: new Date().toISOString(), productId, ...mv };
        return {
          ...s,
          records: { ...s.records, [productId]: next },
          movements: [movement, ...s.movements],
        };
      });
    },
    [],
  );

  const adjust: InventoryContextValue["adjust"] = useCallback(
    ({ productId, bucket, delta, note, user = "Admin" }) => {
      if (!delta) return;
      applyDelta(productId, { [bucket]: delta } as Partial<InventoryRecord>, {
        type: "Adjustment",
        fromState: BUCKET_STATE[bucket],
        toState: BUCKET_STATE[bucket],
        quantity: delta,
        note,
        user,
      });
    },
    [applyDelta],
  );

  const hasMovement = useCallback(
    (s: InventoryState, reference: string, type: MovementType) =>
      s.movements.some((m) => m.reference === reference && m.type === type),
    [],
  );

  const reserveForOrder: InventoryContextValue["reserveForOrder"] = useCallback((order, user = "System") => {
    setState((s) => {
      if (hasMovement(s, order.id, "Reserve")) return s;
      let records = s.records;
      const newMovements: Movement[] = [];
      for (const item of order.items) {
        const existing = records[item.productId] ?? emptyRecord(item.productId);
        records = { ...records, [item.productId]: { ...existing, reserved: existing.reserved + item.quantity } };
        newMovements.push({
          id: uid("mv"),
          date: new Date().toISOString(),
          productId: item.productId,
          type: "Reserve",
          fromState: "Good",
          toState: "Reserved",
          quantity: item.quantity,
          reference: order.id,
          note: `Reserved for order ${order.id}`,
          user,
        });
      }
      return { ...s, records, movements: [...newMovements, ...s.movements] };
    });
  }, [hasMovement]);

  const releaseReservation: InventoryContextValue["releaseReservation"] = useCallback((order, user = "System") => {
    setState((s) => {
      if (hasMovement(s, order.id, "Release")) return s;
      let records = s.records;
      const newMovements: Movement[] = [];
      for (const item of order.items) {
        const existing = records[item.productId] ?? emptyRecord(item.productId);
        records = { ...records, [item.productId]: { ...existing, reserved: Math.max(0, existing.reserved - item.quantity) } };
        newMovements.push({
          id: uid("mv"),
          date: new Date().toISOString(),
          productId: item.productId,
          type: "Release",
          fromState: "Reserved",
          toState: "Good",
          quantity: item.quantity,
          reference: order.id,
          note: `Reservation released (order ${order.id} cancelled)`,
          user,
        });
      }
      return { ...s, records, movements: [...newMovements, ...s.movements] };
    });
  }, [hasMovement]);

  const fulfillOrder: InventoryContextValue["fulfillOrder"] = useCallback((order, user = "System") => {
    setState((s) => {
      if (hasMovement(s, order.id, "Fulfill")) return s;
      let records = s.records;
      const newMovements: Movement[] = [];
      for (const item of order.items) {
        const existing = records[item.productId] ?? emptyRecord(item.productId);
        records = {
          ...records,
          [item.productId]: {
            ...existing,
            good: Math.max(0, existing.good - item.quantity),
            reserved: Math.max(0, existing.reserved - item.quantity),
            sold: existing.sold + item.quantity,
          },
        };
        newMovements.push({
          id: uid("mv"),
          date: new Date().toISOString(),
          productId: item.productId,
          type: "Fulfill",
          fromState: "Good",
          toState: "Sold",
          quantity: item.quantity,
          reference: order.id,
          note: `Delivered (order ${order.id})`,
          user,
        });
      }
      return { ...s, records, movements: [...newMovements, ...s.movements] };
    });
  }, [hasMovement]);

  const logReturn: InventoryContextValue["logReturn"] = useCallback(
    ({ productId, quantity, reason, condition, orderId, note, user = "Admin" }) => {
      if (quantity <= 0) return "";
      const id = uid("ret");
      setState((s) => {
        const entry: ReturnEntry = {
          id,
          date: new Date().toISOString(),
          productId,
          quantity,
          reason,
          condition,
          orderId,
          note,
          status: "Pending",
        };
        const existing = s.records[productId] ?? emptyRecord(productId);
        const nextRec: InventoryRecord = {
          ...existing,
          sold: Math.max(0, existing.sold - quantity),
          returned: existing.returned + quantity,
        };
        const movement: Movement = {
          id: uid("mv"),
          date: new Date().toISOString(),
          productId,
          type: "ReturnReceived",
          fromState: "Sold",
          toState: "Returned",
          quantity,
          reference: orderId,
          note: `Return received: ${reason}${orderId ? ` (order ${orderId})` : ""}${note ? ` — ${note}` : ""}`,
          user,
        };
        return {
          ...s,
          returns: [entry, ...s.returns],
          records: { ...s.records, [productId]: nextRec },
          movements: [movement, ...s.movements],
        };
      });
      return id;
    },
    [],
  );

  const resolveReturn: InventoryContextValue["resolveReturn"] = useCallback(
    (id, action, user = "Admin") => {
      setState((prev) => {
        const entry = prev.returns.find((r) => r.id === id);
        if (!entry || entry.status !== "Pending") return prev;
        let nextStatus: ReturnStatus = "Scrapped";
        if (action === "restock") nextStatus = "Restocked";
        if (action === "damage") nextStatus = "Damaged";
        const returns = prev.returns.map((r) => (r.id === id ? { ...r, status: nextStatus } : r));
        const existing = prev.records[entry.productId] ?? emptyRecord(entry.productId);
        const q = entry.quantity;
        const nextRec: InventoryRecord = {
          ...existing,
          returned: Math.max(0, existing.returned - q),
          good: action === "restock" ? existing.good + q : existing.good,
          damaged: action === "damage" ? existing.damaged + q : existing.damaged,
          writtenOff: action === "scrap" ? existing.writtenOff + q : existing.writtenOff,
        };
        const movement: Movement = {
          id: uid("mv"),
          date: new Date().toISOString(),
          productId: entry.productId,
          type: action === "restock" ? "ReturnRestock" : action === "damage" ? "ReturnDamage" : "ReturnScrap",
          fromState: "Returned",
          toState: action === "restock" ? "Good" : action === "damage" ? "Damaged" : "WrittenOff",
          quantity: q,
          reference: entry.orderId,
          note:
            action === "restock"
              ? "Restocked from return"
              : action === "damage"
                ? "Return marked damaged"
                : "Return scrapped (written off)",
          user,
        };
        if (action === "damage") {
          const damagedEntry: DamagedEntry = {
            id: uid("dmg"),
            date: new Date().toISOString(),
            productId: entry.productId,
            quantity: q,
            reason: "Defective",
            note: `From return ${entry.id}`,
            loggedBy: user,
            status: "Open",
          };
          return {
            ...prev,
            returns,
            records: { ...prev.records, [entry.productId]: nextRec },
            movements: [movement, ...prev.movements],
            damaged: [damagedEntry, ...prev.damaged],
          };
        }
        return {
          ...prev,
          returns,
          records: { ...prev.records, [entry.productId]: nextRec },
          movements: [movement, ...prev.movements],
        };
      });
    },
    [],
  );

  const logDamaged: InventoryContextValue["logDamaged"] = useCallback(
    ({ productId, quantity, reason, note, user = "Admin" }) => {
      if (quantity <= 0) return;
      setState((s) => {
        const entry: DamagedEntry = {
          id: uid("dmg"),
          date: new Date().toISOString(),
          productId,
          quantity,
          reason,
          note,
          loggedBy: user,
          status: "Open",
        };
        const existing = s.records[productId] ?? emptyRecord(productId);
        const nextRec: InventoryRecord = {
          ...existing,
          good: Math.max(0, existing.good - quantity),
          damaged: existing.damaged + quantity,
        };
        const movement: Movement = {
          id: uid("mv"),
          date: new Date().toISOString(),
          productId,
          type: "DamageLogged",
          fromState: "Good",
          toState: "Damaged",
          quantity,
          note: `Damaged: ${reason}`,
          user,
        };
        return {
          ...s,
          damaged: [entry, ...s.damaged],
          records: { ...s.records, [productId]: nextRec },
          movements: [movement, ...s.movements],
        };
      });
    },
    [],
  );

  const writeOffDamaged: InventoryContextValue["writeOffDamaged"] = useCallback(
    (id, user = "Admin") => {
      setState((prev) => {
        const entry = prev.damaged.find((d) => d.id === id);
        if (!entry || entry.status !== "Open") return prev;
        const damaged = prev.damaged.map((d) => (d.id === id ? { ...d, status: "Written off" as const } : d));
        const existing = prev.records[entry.productId] ?? emptyRecord(entry.productId);
        const nextRec: InventoryRecord = {
          ...existing,
          damaged: Math.max(0, existing.damaged - entry.quantity),
          writtenOff: existing.writtenOff + entry.quantity,
        };
        const movement: Movement = {
          id: uid("mv"),
          date: new Date().toISOString(),
          productId: entry.productId,
          type: "WriteOff",
          fromState: "Damaged",
          toState: "WrittenOff",
          quantity: entry.quantity,
          note: `Wrote off damaged stock (${entry.reason})`,
          user,
        };
        return {
          ...prev,
          damaged,
          records: { ...prev.records, [entry.productId]: nextRec },
          movements: [movement, ...prev.movements],
        };
      });
    },
    [],
  );

  const setReorderLevel = useCallback((productId: string, level: number) => {
    setState((s) => {
      const existing = s.records[productId];
      if (!existing) return s;
      return {
        ...s,
        records: { ...s.records, [productId]: { ...existing, reorderLevel: Math.max(0, level) } },
      };
    });
  }, []);

  const registerProduct: InventoryContextValue["registerProduct"] = useCallback((productId, initialGood) => {
    setState((s) => {
      if (s.records[productId]) return s;
      return {
        ...s,
        records: {
          ...s.records,
          [productId]: {
            ...emptyRecord(productId),
            good: initialGood,
            reorderLevel: suggestReorderLevel(initialGood),
          },
        },
      };
    });
  }, []);

  // Hydrate from localStorage; if nothing is persisted yet, reconcile reserved/sold from the
  // real (already-hydrated) order history instead of the frozen seed orders array.
  useEffect(() => {
    if (typeof window === "undefined" || bootstrapped.current) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState(JSON.parse(raw) as InventoryState);
        bootstrapped.current = true;
        return;
      }
    } catch {
      /* ignore */
    }
    if (!storeHydrated) return; // wait for StoreProvider to finish its own hydration first
    bootstrapped.current = true;
    for (const order of orders) {
      if (order.status === "Delivered") {
        fulfillOrder(order, "System (migration)");
      } else if (order.status !== "Cancelled") {
        reserveForOrder(order, "System (migration)");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeHydrated, orders]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const value = useMemo<InventoryContextValue>(() => {
    const reserved = (id: string) => state.records[id]?.reserved ?? 0;
    const goodStock = (id: string) => state.records[id]?.good ?? 0;
    const available = (id: string) => Math.max(0, goodStock(id) - reserved(id));
    return {
      ...state,
      reserved,
      available,
      goodStock,
      adjust,
      reserveForOrder,
      releaseReservation,
      fulfillOrder,
      logReturn,
      resolveReturn,
      logDamaged,
      writeOffDamaged,
      setReorderLevel,
      registerProduct,
    };
  }, [
    state,
    adjust,
    reserveForOrder,
    releaseReservation,
    fulfillOrder,
    logReturn,
    resolveReturn,
    logDamaged,
    writeOffDamaged,
    setReorderLevel,
    registerProduct,
  ]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within <InventoryProvider>");
  return ctx;
}
