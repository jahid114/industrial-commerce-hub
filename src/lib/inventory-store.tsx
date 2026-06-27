import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { products as seedProducts } from "@/data/products";
import { orders as seedOrders } from "@/data/orders";

export type StockBucket = "good" | "returned" | "damaged" | "incoming";

export type MovementType =
  | "Adjustment"
  | "Return"
  | "Damage"
  | "Restock"
  | "Write-off"
  | "Incoming"
  | "Sale";

export interface InventoryRecord {
  productId: string;
  good: number;
  returned: number;
  damaged: number;
  incoming: number;
  reorderLevel: number;
}

export interface Movement {
  id: string;
  date: string; // ISO
  productId: string;
  type: MovementType;
  deltaGood: number;
  deltaReturned: number;
  deltaDamaged: number;
  deltaIncoming: number;
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

// Reserved derived from open orders
function reservedFromOrders(productId: string): number {
  let qty = 0;
  for (const o of seedOrders) {
    if (o.status === "Delivered" || o.status === "Cancelled") continue;
    for (const it of o.items) if (it.productId === productId) qty += it.quantity;
  }
  return qty;
}

function suggestReorderLevel(stock: number): number {
  return Math.max(2, Math.round(stock * 0.2));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
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
  logReturn: (input: {
    productId: string;
    quantity: number;
    reason: ReturnReason;
    condition: ReturnCondition;
    orderId?: string;
    note?: string;
    user?: string;
  }) => void;
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

function buildInitial(): InventoryState {
  const records: Record<string, InventoryRecord> = {};
  for (const p of seedProducts) {
    records[p.id] = {
      productId: p.id,
      good: p.stock,
      returned: 0,
      damaged: 0,
      incoming: 0,
      reorderLevel: suggestReorderLevel(p.stock),
    };
  }
  return { records, movements: [], returns: [], damaged: [] };
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(() => buildInitial());

  const ensureRecord = useCallback((productId: string) => {
    setState((s) => {
      if (s.records[productId]) return s;
      return {
        ...s,
        records: {
          ...s.records,
          [productId]: { productId, good: 0, returned: 0, damaged: 0, incoming: 0, reorderLevel: 2 },
        },
      };
    });
  }, []);

  const applyDelta = useCallback(
    (
      productId: string,
      patch: Partial<Pick<InventoryRecord, "good" | "returned" | "damaged" | "incoming">>,
      mv: Omit<Movement, "id" | "date" | "productId">,
    ) => {
      setState((s) => {
        const existing =
          s.records[productId] ??
          { productId, good: 0, returned: 0, damaged: 0, incoming: 0, reorderLevel: 2 };
        const next: InventoryRecord = {
          ...existing,
          good: Math.max(0, existing.good + (patch.good ?? 0)),
          returned: Math.max(0, existing.returned + (patch.returned ?? 0)),
          damaged: Math.max(0, existing.damaged + (patch.damaged ?? 0)),
          incoming: Math.max(0, existing.incoming + (patch.incoming ?? 0)),
        };
        const movement: Movement = {
          id: uid("mv"),
          date: new Date().toISOString(),
          productId,
          ...mv,
        };
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
      const patch: Partial<InventoryRecord> = { [bucket]: delta } as Partial<InventoryRecord>;
      applyDelta(productId, patch, {
        type: "Adjustment",
        deltaGood: bucket === "good" ? delta : 0,
        deltaReturned: bucket === "returned" ? delta : 0,
        deltaDamaged: bucket === "damaged" ? delta : 0,
        deltaIncoming: bucket === "incoming" ? delta : 0,
        note,
        user,
      });
    },
    [applyDelta],
  );

  const logReturn: InventoryContextValue["logReturn"] = useCallback(
    ({ productId, quantity, reason, condition, orderId, note, user = "Admin" }) => {
      if (quantity <= 0) return;
      const entry: ReturnEntry = {
        id: uid("ret"),
        date: new Date().toISOString(),
        productId,
        quantity,
        reason,
        condition,
        orderId,
        note,
        status: "Pending",
      };
      setState((s) => ({ ...s, returns: [entry, ...s.returns] }));
      applyDelta(productId, { returned: quantity }, {
        type: "Return",
        deltaGood: 0,
        deltaReturned: quantity,
        deltaDamaged: 0,
        deltaIncoming: 0,
        note: `Return: ${reason}${orderId ? ` (order ${orderId})` : ""}`,
        user,
      });
    },
    [applyDelta],
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
        const existing =
          prev.records[entry.productId] ??
          { productId: entry.productId, good: 0, returned: 0, damaged: 0, incoming: 0, reorderLevel: 2 };
        const q = entry.quantity;
        const nextRec: InventoryRecord = {
          ...existing,
          returned: Math.max(0, existing.returned - q),
          good: action === "restock" ? existing.good + q : existing.good,
          damaged: action === "damage" ? existing.damaged + q : existing.damaged,
        };
        const movement: Movement = {
          id: uid("mv"),
          date: new Date().toISOString(),
          productId: entry.productId,
          type:
            action === "restock" ? "Restock" : action === "damage" ? "Damage" : "Write-off",
          deltaGood: action === "restock" ? q : 0,
          deltaReturned: -q,
          deltaDamaged: action === "damage" ? q : 0,
          deltaIncoming: 0,
          note:
            action === "restock"
              ? "Restocked from return"
              : action === "damage"
                ? "Return marked damaged"
                : "Return scrapped",
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
      setState((s) => ({ ...s, damaged: [entry, ...s.damaged] }));
      applyDelta(productId, { good: -quantity, damaged: quantity }, {
        type: "Damage",
        deltaGood: -quantity,
        deltaReturned: 0,
        deltaDamaged: quantity,
        deltaIncoming: 0,
        note: `Damaged: ${reason}`,
        user,
      });
    },
    [applyDelta],
  );

  const writeOffDamaged: InventoryContextValue["writeOffDamaged"] = useCallback(
    (id, user = "Admin") => {
      setState((prev) => {
        const entry = prev.damaged.find((d) => d.id === id);
        if (!entry || entry.status !== "Open") return prev;
        const damaged = prev.damaged.map((d) =>
          d.id === id ? { ...d, status: "Written off" as const } : d,
        );
        const existing = prev.records[entry.productId];
        const nextRec = existing
          ? { ...existing, damaged: Math.max(0, existing.damaged - entry.quantity) }
          : existing;
        const movement: Movement = {
          id: uid("mv"),
          date: new Date().toISOString(),
          productId: entry.productId,
          type: "Write-off",
          deltaGood: 0,
          deltaReturned: 0,
          deltaDamaged: -entry.quantity,
          deltaIncoming: 0,
          note: `Wrote off damaged stock (${entry.reason})`,
          user,
        };
        return {
          ...prev,
          damaged,
          records: nextRec ? { ...prev.records, [entry.productId]: nextRec } : prev.records,
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

  const registerProduct: InventoryContextValue["registerProduct"] = useCallback(
    (productId, initialGood) => {
      setState((s) => {
        if (s.records[productId]) return s;
        return {
          ...s,
          records: {
            ...s.records,
            [productId]: {
              productId,
              good: initialGood,
              returned: 0,
              damaged: 0,
              incoming: 0,
              reorderLevel: suggestReorderLevel(initialGood),
            },
          },
        };
      });
    },
    [],
  );

  const value = useMemo<InventoryContextValue>(() => {
    const reserved = (id: string) => reservedFromOrders(id);
    const goodStock = (id: string) => state.records[id]?.good ?? 0;
    const available = (id: string) => Math.max(0, goodStock(id) - reserved(id));
    return {
      ...state,
      reserved,
      available,
      goodStock,
      adjust,
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
    logReturn,
    resolveReturn,
    logDamaged,
    writeOffDamaged,
    setReorderLevel,
    registerProduct,
  ]);

  // touch ensureRecord to keep referenced (used in future imports)
  void ensureRecord;

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within <InventoryProvider>");
  return ctx;
}
