# Inventory, Returns & Cancellation Redesign — Implementation Plan

> **Status: Proposed — not yet implemented.** This is a design document for a planned redesign, written so any engineer can pick it up and build it. See `INDUSTRY_STANDARD_RETURN_PROCESS.md` for the industry-standard reference this plan is checked against.

## Context

Today, three systems that should be one are completely disconnected:
1. **Orders** (`src/lib/store.tsx`) — placing, advancing, or cancelling an order never touches stock.
2. **Inventory** (`src/lib/inventory-store.tsx`) — "Reserved" is a number recomputed from a *frozen seed array* (`src/data/orders.ts`), not from real orders. It has no persistence (resets on every reload) and no concept of "sold" at all.
3. **Return/Cancellation requests** (`src/lib/order-requests.ts`) — a customer's "Cancel Order" click instantly cancels the order with no approval step; a "Request Return" click creates a request whose status can be flipped through any value via a free dropdown with zero side effects (approving a return never restocks anything, never touches the order, never leaves an audit trail).

The goal: a real reserved→sold mechanic driven by order lifecycle events, a streamlined per-product movement history (not a global tab), removal of the Returns/Damaged/Movements tabs from Admin → Inventory, a from→to movement log format, and a guarded, order-status-style approval workflow for both returns and cancellations. This plan redesigns all three systems as one coherent flow.

**Decisions already made:**
- Cancellations always require admin approval, **except** orders still `Pending` (no fulfillment started yet), which customers can still cancel instantly — logged as an auto-completed request so there's still one unified audit trail.
- Return requests stay **whole-order, reason-only** (no line-item/quantity picker) — same submission UX as today; the admin picks the specific product/quantity when logging the physical return at the "Received" step, same as today's manual entry, just now part of the guarded workflow instead of a disconnected dialog.

---

## 0. Architectural fix required first

`InventoryProvider` is currently mounted only inside `src/routes/admin.tsx`. Checkout (`checkout.tsx`, `portal-customer.checkout.tsx`) and the agent's `NewOrderDialog.tsx` all live outside `/admin` and have no way to call inventory functions. **Move `InventoryProvider` into `src/routes/__root.tsx`**, nested inside `StoreProvider` (it needs to read `orders` for the migration bootstrap in §4), and remove the now-redundant wrapper from `admin.tsx`. Leaving both in place would silently create two independent inventory states — this must not happen.

## 1. New `InventoryRecord` shape

Keep `good` as **true physical on-hand count** (matches a warehouse stock-take); `reserved` and `sold` are stored overlay counters, not physical relocations. This is the standard on-hand / committed / available-to-promise / sold split (see the industry-standard doc).

```ts
interface InventoryRecord {
  productId: string;
  good: number;        // physical on-hand; reservations are an overlay, not a subtraction
  reserved: number;    // NEW — stored (not derived), committed to open (non-terminal) orders
  sold: number;        // NEW — units delivered, net of any that came back as a return
  returned: number;    // physically back, pending inspection
  damaged: number;     // identified unsellable, pending write-off
  incoming: number;    // unchanged, on order from supplier
  writtenOff: number;  // NEW — lifetime scrapped count (replaces today's silent "vanish" on scrap)
  reorderLevel: number;
}
available(productId) = max(0, good - reserved)   // unchanged formula, now backed by real data
```

### Field deltas per lifecycle event

| Event | good | reserved | sold | returned | damaged | writtenOff |
|---|---|---|---|---|---|---|
| Order placed | — | **+qty** | — | — | — | — |
| Order cancelled (reservation released) | — | **−qty** | — | — | — | — |
| Order delivered | **−qty** | **−qty** | **+qty** | — | — | — |
| Return received (physical unit back) | — | — | **−qty** | **+qty** | — | — |
| Return resolved → restock | **+qty** | — | — | **−qty** | — | — |
| Return resolved → damage | — | — | — | **−qty** | **+qty** | — |
| Return resolved → scrap | — | — | — | **−qty** | — | **+qty** (new — today this quantity just vanished) |
| Standalone damage logged | **−qty** | — | — | — | **+qty** | — |
| Damaged write-off | — | — | — | — | **−qty** | **+qty** |
| Manual stock adjustment | **±qty** | — | — | — | — | — |

## 2. Movement ledger — from/to instead of delta columns

Replace the 4 delta fields (`deltaGood/deltaReturned/deltaDamaged/deltaIncoming`) with an explicit state transition, directly answering "from where to where, how many units, what note":

```ts
type StockState = "Incoming" | "Good" | "Reserved" | "Sold" | "Returned" | "Damaged" | "WrittenOff";

type MovementType =
  | "Restock"        // Incoming → Good     (PO received / manual add-stock)
  | "Reserve"        // Good → Reserved      (order placed)
  | "Release"        // Reserved → Good      (order cancelled)
  | "Fulfill"        // Reserved → Sold      (order delivered)
  | "ReturnReceived" // Sold → Returned      (physical return logged)
  | "ReturnRestock"  // Returned → Good      (resolved: resellable)
  | "ReturnDamage"   // Returned → Damaged   (resolved: damaged)
  | "ReturnScrap"    // Returned → WrittenOff (resolved: unsellable)
  | "DamageLogged"   // Good → Damaged       (standalone damage report)
  | "WriteOff"       // Damaged → WrittenOff
  | "Adjustment";    // Good → Good (± correction; the one type where qty can be negative)

interface Movement {
  id: string;
  date: string;
  productId: string;
  type: MovementType;
  fromState: StockState;
  toState: StockState;
  quantity: number;     // unsigned, except Adjustment
  reference?: string;   // order id / return request id / PO reference
  note?: string;
  user: string;
}
```

Every row in the table above maps to exactly one `MovementType` — this is what makes "from → to, units, notes" readable per-product, instead of today's mostly-empty 4-column delta grid.

## 3. New/changed store functions

| Function | Called from | Effect (per §1/§2) |
|---|---|---|
| `reserveForOrder(order)` | checkout.tsx, portal-customer.checkout.tsx, agent NewOrderDialog.tsx — right after `dispatch({type:"ADD_ORDER"})` | `Reserve` row per item, `reference = order.id` |
| `releaseReservation(order)` | shared `cancelOrder()` helper (§8) | `Release` row per item, `reference = order.id` |
| `fulfillOrder(order)` | `admin.orders.$orderId.tsx`'s `advanceStage()`, when next status is `Delivered` | `Fulfill` row per item, `reference = order.id` |
| `logReturn(...)` (changed) | Return Request's "Mark Received" action (§7) | now also does `sold -= qty`; `ReturnReceived` row |
| `resolveReturn(id, action)` (changed) | Return Request's Restock/Mark Damaged/Scrap actions (§7) | scrap branch now increments `writtenOff` instead of discarding the quantity; emits `ReturnRestock`/`ReturnDamage`/`ReturnScrap` |

Recommend a small shared helper, `src/lib/order-inventory-sync.ts`, exporting `placeOrderAndReserve(dispatch, inventory, order)` so the three order-creation call sites can't forget to call `reserveForOrder`.

**Idempotency**: guard `reserveForOrder`/`fulfillOrder`/`releaseReservation` against being called twice for the same order (check whether a movement with that `reference` already exists before writing another) — relevant once persistence makes replays possible.

## 4. Persistence + migration

Add localStorage persistence following `src/lib/store.tsx`'s existing pattern (`STORAGE_KEY = "megahaus-inventory-v1"`, hydrate on mount, persist on every change) — today's inventory store is plain `useState` with none at all, which is why Reserved/Sold would otherwise reset on every reload.

**First-run bootstrap** (replaces `reservedFromOrders` scanning the frozen seed array): when no persisted inventory state exists yet, after building the seed `InventoryRecord`s, reconcile against `useStore()`'s **real, already-hydrated** `orders` — not `src/data/orders.ts` — by replaying every non-terminal order as a synthetic `reserveForOrder` and every `Delivered` order as a synthetic `fulfillOrder`. This requires gating the bootstrap effect on the store having finished its own hydration first (expose a `hydrated` flag from `StoreProvider`) to avoid a race. On subsequent runs, skip reconciliation — the persisted `reserved`/`sold` are authoritative from then on.

## 5. `Product.stock` duplication

`Product.stock` (static seed field) and `InventoryRecord.good` are two sources of truth today; customer-facing "stock available" reads from the former, bypassing reservations entirely. **Fix now** (highest oversell risk): `src/routes/products.$productId.tsx`, `src/routes/portal-customer.catalog.$productId.tsx`, `src/components/product/ProductQuickView.tsx` should read `useInventory().available(productId)` instead of `product.stock`. **Defer, flag as follow-up**: `compare.tsx` pages and `admin.reports.tsx`'s CSV export — lower purchase-intent / internal surfaces, same fix pattern applies later.

## 6. Inventory pages

**`/admin/inventory` (Overview only — no tabs)**: delete the `Tabs`/Returns/Damaged/Movements content entirely. Table columns become: Product/SKU, Good, Reserved, Available, **Sold** (new), Returned (now read-only, no inline resolve buttons), Damaged (read-only), Status, Actions (**Add stock**, **History**). "History" now navigates to the new route instead of switching a local tab. Remove the "Log return" header dialog (return intake now happens via the Return Request workflow, §7); "Log damaged" moves to the per-product page below.

**New route `src/routes/admin.inventory.$productId.tsx`** (same convention as `admin.orders.$orderId.tsx`): product header, stat cards (Good/Reserved/Sold/Available/Returned/Damaged), the full from→to ledger **filtered to this product**, paginated with the existing `TablePagination`/`paginate()` helper from `src/components/admin/TableToolbar.tsx` (reuse, don't reinvent), filterable by type and date range. Also hosts this product's **open standalone damaged entries** with a "Write off" action (relocated from the removed Damaged tab) and a "Log damaged" dialog scoped to this product.

## 7. Return Request guarded workflow

New module `src/lib/order-request-workflow.ts`, following the same convention as `order-workflow.ts`/`quotation-workflow.ts` (stage array + full-status array + guarded next-action map + event-append helper):

`RETURN_REQUEST_STAGES`: `Requested → Approved → Received → Completed`, side state `Rejected`.

| From | Action | To | Side effect |
|---|---|---|---|
| Requested | Approve Return | Approved | none (RMA issued; goods not back yet) |
| Requested or Approved | Reject (reason required) | Rejected | none |
| Approved | Mark Received (admin picks product + quantity from the order's line items, reason, condition — same fields as today's "Log Return" dialog) | Received | `logReturn(...)` |
| Received | Restock / Mark Damaged / Scrap | Completed | `resolveReturn(id, action)` |

## 8. Cancellation Request guarded workflow

`CANCELLATION_REQUEST_STAGES`: `Requested → Completed`, side state `Rejected`.

| From | Action | To | Side effect |
|---|---|---|---|
| Requested | Approve Cancellation | Completed | shared `cancelOrder()` helper + `releaseReservation(order)` |
| Requested | Reject (reason required) | Rejected | none — order untouched |

**Pending-order instant path**: if the customer cancels while `order.status === "Pending"`, skip the approval wait — call the shared `cancelOrder()` helper immediately and create the `OrderRequest` already stamped `status: "Completed"` with an event noting it was self-cancelled pre-approval, so the audit trail/history view never has a gap.

**Shared helper — `src/lib/order-actions.ts`**: extract the existing `cancelOrder` logic out of `admin.orders.$orderId.tsx` (sets `status:"Cancelled"`, auto-refunds if `paymentStatus` was `Paid`, appends an event) into `cancelOrder(order, {actor, reason})`, called from both the admin's direct "Cancel Order" button and the Cancellation Request's "Approve" action — plus `releaseReservation(order)` alongside it. This avoids duplicating the refund-on-cancel rule in two places.

## 9. Audit trail

Add to `OrderRequest` (`src/lib/order-requests.ts`): `timeline: OrderRequestEvent[]` (mirrors `OrderEvent`: `{at, by, type, message}`), `resolution?: "restock"|"damage"|"scrap"`, `rejectionReason?`. Replace `updateOrderRequestStatus` with a generic `patchOrderRequest(id, patch)`; every guarded transition above calls it with the new status plus an appended event, closing today's "zero audit trail, anyone can set any status" gap.

## 10. UI changes

- **`OrderRequestsPanel.tsx`**: replace the free status `<Select>` with the one guarded primary action button per row (label from the stage table above) + a separate "Reject" action (`AlertDialog` + required reason, styled like the existing Cancel-Order confirmation), and — once a return is `Received` — the three resolution buttons relocated here from the removed Inventory Returns tab. Add a detail view (reuse `OrderDetailDialog`'s activity-log layout) to show the request's `timeline`.
- **`portal-customer.orders.$orderId.tsx`**: "Cancel Order" branches on `order.status` per §8. "Request Return" dialog is unchanged (reason textarea only, per the decision above).
- **`portal-customer.orders.index.tsx`**: request-status badges extended for the fuller stage list.
- **`components/agent/OrderDetailDialog.tsx`**: currently has zero return/cancel awareness — add a read-only "Request Status" section (e.g. "Return: Received") so an agent can see state without the admin console.
- **Shared color maps**: export `ORDER_STATUS_COLOR`/`PAYMENT_STATUS_COLOR` from `order-workflow.ts` (matches the existing `QUOTATION_STATUS_COLOR` precedent in `quotation-workflow.ts`) and replace the three copy-pasted local versions in `admin.orders.$orderId.tsx`, `portal-customer.orders.$orderId.tsx`, and `OrderDetailDialog.tsx`.
- **Resume-from-Hold bug fix** (found during research, directly adjacent to this work): `holdOrder()` should store `previousStatus` on the order so `resumeOrder()` restores it instead of hardcoding `"Confirmed"` regardless of prior stage. Fall back to `"Confirmed"` only when `previousStatus` is absent (pre-existing on-hold demo data).
- **"Manual Overrides" status dropdown** (`admin.orders.$orderId.tsx`): keep it for flexibility, but remove `"Cancelled"` from its option list — cancellation must always go through `cancelOrder()`/the request workflow now, so it releases inventory and (where required) goes through approval; a silent dropdown jump to Cancelled would bypass both.

## 11. File-by-file summary

| File | Change |
|---|---|
| `src/lib/inventory-store.tsx` | New record/movement schema (§1/§2), new functions (§3), persistence + migration (§4) |
| `src/routes/__root.tsx` | Mount `InventoryProvider` here (§0) |
| `src/routes/admin.tsx` | Remove redundant `InventoryProvider` wrapper |
| `src/routes/admin.inventory.tsx` | Remove tabs, add Sold column, History → route nav (§6) |
| `src/routes/admin.inventory.$productId.tsx` *(new)* | Per-product ledger + open damaged entries (§6) |
| `src/routes/checkout.tsx`, `portal-customer.checkout.tsx`, `components/agent/NewOrderDialog.tsx` | Call `reserveForOrder` after `ADD_ORDER` (§3) |
| `src/routes/admin.orders.$orderId.tsx` | `fulfillOrder` on deliver, shared `cancelOrder` + `releaseReservation` on cancel, Hold/Resume fix, Manual Overrides restriction |
| `src/lib/order-actions.ts` *(new)* | Shared `cancelOrder(order, {actor, reason})` (§8) |
| `src/lib/order-request-workflow.ts` *(new)* | Stage/transition tables for returns & cancellations (§7/§8) |
| `src/lib/order-requests.ts` | `timeline`, `resolution`, `rejectionReason` fields; `patchOrderRequest` replaces `updateOrderRequestStatus` (§9) |
| `src/components/admin/OrderRequestsPanel.tsx` | Guarded actions + resolution buttons + timeline view (§10) |
| `src/routes/portal-customer.orders.$orderId.tsx`, `portal-customer.orders.index.tsx` | Cancel branches by status, badge updates (§10) |
| `src/components/agent/OrderDetailDialog.tsx` | Read-only request-state section, shared color maps (§10) |
| `src/lib/order-workflow.ts` | Export shared `ORDER_STATUS_COLOR`/`PAYMENT_STATUS_COLOR` |
| `src/routes/products.$productId.tsx`, `portal-customer.catalog.$productId.tsx`, `components/product/ProductQuickView.tsx` | Read `available()` instead of `product.stock` (§5) |

## 12. Sequencing

1. §0 (move provider) — nothing else is reachable from checkout without this.
2. §1–§4 (new inventory schema, functions, persistence) as one unit — they're tightly coupled.
3. Wire `reserveForOrder`/`releaseReservation`/`fulfillOrder` into checkout + order-detail (§3), so real data exists before touching UI.
4. §7–§9 (request workflow + audit trail) — additive, can be built in parallel with step 3.
5. §10 (`OrderRequestsPanel` redesign, customer/agent UI) — depends on step 4.
6. §6 (new inventory UI, tab removal) — last, since it's easiest to verify once the ledger is already producing correct rows.
7. §5 (`Product.stock` migration on customer pages) — independent, can land anytime.

## 13. Verification (manual — no automated test suite exists in this repo today)

1. Place an order (any of the 3 flows) → Admin Inventory shows `Reserved += qty`, `Available` drops; product history page shows a `Good → Reserved` row referencing the order id.
2. Cancel that order via the Cancellation Request flow (customer requests → admin approves) → `Reserved -= qty`, `Available` restored, a `Reserved → Good` row appears.
3. Advance a different order to Delivered → `Good`/`Reserved` drop, `Sold` rises, a `Good → Sold` row appears.
4. Submit a Return Request on a delivered order → admin Approves → Marks Received (pick product/qty) → `Sold -= qty`, `Returned += qty`, `Sold → Returned` row → Resolve as Restock → `Good += qty`, `Returned -= qty`, `Returned → Good` row, request flips to Completed, order's own timeline gets an entry too.
5. Resolve a different return as Scrap → confirm `writtenOff` increments instead of the quantity disappearing.
6. Confirm `/admin/inventory` has no Returns/Damaged/Movements tabs; confirm `/admin/inventory/$productId` shows the full from→to ledger, filters, and pagination.
7. Hard-refresh mid-flow and confirm Reserved/Sold/movements survive (persistence working).
8. Cancel a still-`Pending` order as a customer → confirm it's instant, but still produces a completed request record.
9. Run `bun run lint` / `bun run build` to confirm everything type-checks.

## 14. Risks / open follow-ups

- Double-decrement risk if `fulfillOrder`/`releaseReservation` fire twice for the same order — needs the idempotency guard (§3).
- Effect-ordering race between `StoreProvider` hydration and the inventory bootstrap reconciliation (§4) — needs an explicit "hydrated" signal, not implicit effect ordering.
- Partial-order fulfillment/returns are out of scope (confirmed) — this design assumes an order's items reserve/fulfill/release atomically as a whole.
- Removing "Cancelled" from the Manual Overrides dropdown is a real behavior change for admins currently using it as an escape hatch — worth a quick confirmation pass with whoever uses that screen day-to-day before shipping.
- `compare.tsx` pages and `admin.reports.tsx` will keep reading stale `product.stock` until the deferred follow-up (§5) lands — numbers there just won't match `/admin/inventory` in the meantime.

See `INDUSTRY_STANDARD_RETURN_PROCESS.md` for how this design maps to standard ERP/e-commerce practice.
