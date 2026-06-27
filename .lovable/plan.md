## Goal
Add a proper **Inventory** module to the admin panel — beyond the existing single "Stock" number — so the team can track returns, damaged/bad stock, and adjustments alongside good (sellable) stock.

Demo-only (in-memory like the rest of the admin). No backend changes.

## New left-nav entry
Admin sidebar → **Inventory** (between Products and Orders), icon `Boxes`.

Route: `src/routes/admin.inventory.tsx`

## Inventory model (per product)
Replace the single `stock` view with a richer breakdown computed from movements:

- **Good stock** — sellable on-hand
- **Reserved** — held against pending orders (read-only, derived)
- **Returned** — customer-returned, awaiting inspection
- **Damaged / Bad stock** — written off, not sellable
- **Incoming** — POs / shipments in transit
- **Available** = Good − Reserved
- **Reorder level** — threshold for "Low stock" badge

These live in a new module `src/data/inventory.ts` keyed by `productId`, seeded from existing `products[].stock` (all into "Good"). Held in a `useState` map on the page (matches current demo pattern).

## Page layout — `/admin/inventory`

```text
Header: "Inventory"  [Search]  [+ Adjust stock]  [+ Record movement]

KPI row: Total SKUs | Good stock value (৳) | Low-stock SKUs | Damaged units | Returns pending

Tabs:
  Overview  |  Returns  |  Damaged  |  Movements
```

### Overview tab — main inventory table
Columns: Product · SKU · Good · Reserved · Available · Returned · Damaged · Incoming · Reorder lvl · Status badge (In stock / Low / Out) · Actions

Row actions: **Adjust** (open Adjust dialog pre-filled), **History** (filters Movements tab to that SKU).

### Returns tab
List of return entries: Date · Order # · Product · Qty · Reason · Condition · Status (Pending inspection / Restocked / Scrapped) · Actions.
Actions: **Restock** (moves qty Returned → Good), **Mark damaged** (Returned → Damaged), **Scrap** (removes from Returned).
`+ Log return` button opens a dialog (product picker, qty, reason, condition, optional order #).

### Damaged tab
List of damaged/bad-stock entries: Date · Product · Qty · Reason (Defective / Transit damage / Expired / Other) · Notes · Logged by.
`+ Log damaged` button. Action: **Write off** (removes the units permanently from Damaged with audit entry).

### Movements tab (audit log)
Chronological list of every stock change: Date · Product · Type (Adjustment / Return / Damage / Restock / Write-off / Incoming receipt / Sale) · Δ Good · Δ Returned · Δ Damaged · Note · User.
Filterable by product and type.

## Dialogs

1. **Adjust stock** — pick product, pick bucket (Good / Returned / Damaged / Incoming), delta (+/−), reason, note → writes a movement and updates counts.
2. **Log return** — product, qty, reason (Wrong item / Defective / Customer change of mind / Warranty), condition (Resellable / Inspect / Damaged), order # (optional). Creates a Return entry + movement (+ Returned).
3. **Log damaged** — product, qty, reason, note. Creates Damaged entry + movement (+ Damaged).
4. **Restock from return** — confirm qty, moves Returned → Good.

All dialogs follow the existing admin dialog styling (`rounded-lg` buttons, `Field` helper, same select styling as Products).

## Sync with Products page

- `Product.stock` shown in `/admin/products` becomes a **derived read** of `goodStock` from the inventory store (kept in the same module so both pages share state in the demo). The Products "Stock" input in Add/Edit still sets initial Good stock on create; editing existing stock is redirected to the Inventory → Adjust dialog (with a helper note).
- Product detail page continues to show `In stock / Out of stock` based on Available.

## Files

**New**
- `src/data/inventory.ts` — types (`StockBucket`, `Movement`, `ReturnEntry`, `DamagedEntry`), seed builder from `products`, helper functions (`applyMovement`, `summarize`).
- `src/lib/inventory-store.tsx` — tiny React context wrapping the inventory state so `admin.inventory.tsx` and `admin.products.tsx` share it for the demo.
- `src/routes/admin.inventory.tsx` — the page above.

**Edited**
- `src/routes/admin.tsx` — add "Inventory" nav link with `Boxes` icon.
- `src/routes/admin.products.tsx` — read good-stock from inventory store; minor copy tweak on the Stock field.
- `src/routes/__root.tsx` (or wherever admin shell wraps providers) — mount `<InventoryProvider>` around the admin subtree.

## Out of scope
- Real persistence / Lovable Cloud
- Multi-warehouse locations
- Supplier PO workflow (we only track "Incoming" qty as a number)
- Barcode scanning
