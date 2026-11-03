# Industry-Standard Inventory, Return & Cancellation Process

> Reference document accompanying `INVENTORY_RETURNS_REDESIGN_PLAN.md`. This describes how mainstream inventory/order systems (e.g. NetSuite, Shopify, SAP) model these flows, and how the redesign plan maps to that standard.

## 1. Standard inventory states

Almost every inventory system separates stock into exactly these layers:

| Layer | Meaning | Typical name elsewhere |
|---|---|---|
| **On-hand** | Physically present, counted in a stock-take | "On hand" (Shopify), "Quantity on Hand" (NetSuite) |
| **Committed / Reserved** | Subset of on-hand already promised to an order not yet shipped | "Committed" (Shopify), "Reserved" |
| **Available to Promise (ATP)** | On-hand minus committed — what can be sold right now | "Available" |
| **In transit / Incoming** | Ordered from a supplier, not yet received | "Incoming" / "On PO" |
| **Sold / Shipped** | Left the warehouse via a completed order | Often just a derived report, not a stored bucket — but tracking it explicitly (as this plan does) is common in systems that need lifetime sales analytics separate from current stock |
| **Returned (pending grading)** | Physically back, not yet inspected | "Pending return", "RMA received" |
| **Damaged / Quarantine** | Identified unsellable, awaiting disposal decision | "Quarantine", "QA hold" |
| **Written off / Scrapped** | Permanently removed from sellable inventory | "Write-off", "Scrap" |

The redesign plan's model (good/reserved/sold/returned/damaged/writtenOff) matches this directly — this is the standard shape, not a custom invention.

## 2. Standard Return Merchandise Authorization (RMA) process

The textbook RMA flow has exactly the stages the redesign plan proposes:

1. **Request** — customer initiates, states reason.
2. **Authorization (Approve/Reject)** — seller decides whether to accept the return at all, *before* anything physical happens. This step exists specifically to prevent shipping fraud and unnecessary reverse-logistics cost on requests that will be rejected anyway.
3. **Receipt** — the physical goods arrive back at the warehouse; this is the trigger that actually moves stock (in the plan: `Sold → Returned`). Many systems generate a physical "RMA number" at authorization time that's scanned on receipt — equivalent to the plan's `reference` field on the inventory movement.
4. **Inspection / Grading** — the single most variable step across systems, but always resolves to one of: resellable (restock), damaged (quarantine/refurbish), or unsellable (scrap/write-off) — exactly the plan's three resolution actions.
5. **Resolution / Closure** — refund or replacement is issued, request closes, audit trail is permanent.

**Where the plan matches standard practice**: 4-stage return lifecycle, explicit authorization gate before physical movement, 3-way grading outcome.

**Where the plan intentionally simplifies** (a deliberate choice for this platform's size): no line-item/quantity granularity at request time — industry standard generally captures this at authorization time (so the RMA number already specifies what's expected back), but the lighter whole-order request is kept, deferring the item/qty detail to the admin's manual entry at receipt.

## 3. Standard cancellation process

Industry convention almost universally gates cancellation on **whether fulfillment work has started**:
- Before payment capture / before "accepted" status: instant, no approval (nothing to unwind).
- After acceptance (picking, carrier booking, partial shipment): requires review, because unwinding may involve a refund decision, a restocking fee, or goods already in transit.

This is exactly the redesign plan's "instant while Pending, approval required after" rule — it mirrors how most e-commerce and ERP systems gate self-service cancellation on an "order accepted" boundary rather than a blanket rule either way.

## 4. Movement ledger / stock-card conventions

What the plan calls a "movement" is universally known as a **stock card** or **inventory ledger** entry in standard systems. The from→to + quantity + reference + note shape matches the standard "stock card" format used in SAP MM, Odoo Inventory, and most WMS systems, which always record: date, item, quantity, source location/state, destination location/state, and a reference document (PO/SO/RMA number) — never a set of parallel delta columns per bucket, which is a non-standard, harder-to-audit format (the current codebase's existing design, being replaced).

## 5. Summary — how the plan maps to the standard

| Standard concept | Redesign plan's implementation |
|---|---|
| On-hand / Committed / ATP / Sold split | `good` / `reserved` / `available()` / `sold` |
| RMA authorization gate | Return Request `Requested → Approved` step, before any inventory movement |
| RMA receipt trigger | `Approved → Received`, triggers `logReturn` |
| 3-way grading | Restock / Damage / Scrap resolution actions |
| Stock-card / movement ledger | `Movement` with `fromState`/`toState`/`quantity`/`reference`/`note` |
| Fulfillment-gated cancellation policy | Instant while `Pending`, approval required from `Confirmed` onward |

In short, the redesign plan is a standard implementation of these patterns scaled to this app's size — no exotic/non-standard mechanics were introduced.
