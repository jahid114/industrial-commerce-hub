## Goal

Turn Quotations into a proper multi-item RFQ workflow: customers can request quotes for many products in one submission, and admins get a detail page with a staged status lifecycle (like the order processing page).

## Data model changes (`src/data/types.ts`)

Replace single-product fields with a line-item array and richer lifecycle:

```ts
export interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  targetPrice?: number;   // optional customer ask
  quotedPrice?: number;   // admin-entered per line
  notes?: string;
}

export type QuotationStatus =
  | "New" | "Under Review" | "Sourcing" | "Quoted"
  | "Negotiating" | "Accepted" | "Rejected" | "Expired" | "Converted";

export interface QuotationEvent {
  at: string; by: string;
  type: "status" | "note" | "quote" | "created" | "conversion";
  message: string;
}

export interface Quotation {
  id: string;
  customerName: string; customerEmail: string; customerPhone?: string;
  company?: string;
  date: string;
  items: QuotationItem[];        // NEW — multi-product
  message: string;
  status: QuotationStatus;
  quotedTotal?: number;          // sum of line quotedPrice*qty
  validUntil?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  assignedTo?: string;
  internalNotes?: string;
  timeline?: QuotationEvent[];
  convertedOrderId?: string;
}
```

Add `src/lib/quotation-workflow.ts` mirroring `order-workflow.ts`: status list, colors, allowed next-status transitions, helper to append timeline events.

Update seed `src/data/quotations.ts` to the new shape (wrap the single product into `items: [{...}]`, map old statuses: Open→New, Quoted→Quoted, Accepted→Accepted, Closed→Rejected).

## Customer-facing form (`src/routes/quotation.tsx` + `portal-customer.quotations.tsx`)

Rework the request form:
- Contact fields stay (name/email/phone/company).
- Replace single "Product + Quantity" with a **line-items builder**:
  - Product picker + qty + optional target price + optional per-item notes.
  - "Add another product" button; remove per row; running item count.
  - Preload from `?productId=` OR from cart (if opened from cart page) as first row.
- Message stays as overall requirement notes.
- On submit → build `items[]`, status `"New"`, first timeline event `created`.

`portal-customer.quotations.tsx`: show items count + first product name + "and N more", status badge with new color map. Row click → detail dialog (reuse admin detail component in read-only mode) OR link to a customer detail route. Simpler: reuse a shared `QuotationDetailView` component.

## Admin list + detail page

`src/routes/admin.quotations.tsx` becomes a **list only** (like `admin.orders.index.tsx`):
- Table columns: RFQ ID, Date, Customer, Items (count), Status badge, Quoted total, Actions (View, Delete).
- Search + status filter + pagination.
- Row "View" → navigate to `/admin/quotations/$rfqId`.

New file `src/routes/admin.quotations.$rfqId.tsx` — detail page modeled on `admin.orders.$orderId.tsx`:
- **Header**: RFQ id, current status badge, "Back to RFQs".
- **Stage stepper** (New → Under Review → Sourcing → Quoted → Negotiating → Accepted/Rejected) with allowed-next-action buttons.
- **Line items table**: editable per-row quoted price (৳) + qty, live line total; footer shows quoted total.
- **Customer card**: name, company, email, phone, message.
- **Terms card** (editable via Edit toggle, like the shipping block on orders): validity date, payment terms, delivery terms, assigned to.
- **Send Quote action**: opens modal to confirm per-line prices + terms → sets status `Quoted`, stores `quotedTotal`, appends timeline event.
- **Accept / Reject / Mark Expired** actions per workflow.
- **Convert to Order** when `Accepted`: create an `Order` from items + prices, link `convertedOrderId`, set status `Converted`, jump to the new order.
- **Activity timeline** panel (reads `timeline`), and **Internal notes** textarea with "Add note" button (appends `note` event).

## Store wiring (`src/lib/store.tsx`)

Extend quotation actions:
- `UPDATE_QUOTATION` already exists — keep, but ensure it merges timeline arrays.
- Add helper action `APPEND_QUOTATION_EVENT` (or fold into UPDATE_QUOTATION patch usage).
- `CONVERT_QUOTATION_TO_ORDER` — creates Order, patches quotation.

## Route tree

New route file `src/routes/admin.quotations.$rfqId.tsx`; router regenerates `routeTree.gen.ts` automatically. Existing `admin.quotations.tsx` stays as the index list (no rename needed since it has no children yet — but for consistency, rename to `admin.quotations.index.tsx` and add an `Outlet` in a new `admin.quotations.tsx` layout, matching the orders pattern).

## Files touched

- edit: `src/data/types.ts`, `src/data/quotations.ts`, `src/lib/store.tsx`, `src/routes/quotation.tsx`, `src/routes/portal-customer.quotations.tsx`
- create: `src/lib/quotation-workflow.ts`, `src/components/quotation/QuotationDetailView.tsx` (shared read-only view), `src/routes/admin.quotations.$rfqId.tsx`, `src/routes/admin.quotations.index.tsx`
- rewrite: `src/routes/admin.quotations.tsx` → thin layout with `<Outlet />`

## Out of scope

- Backend/persistence (still localStorage via `useStore`).
- Email notifications to customer on status change (UI-only).
- File attachments on RFQs.
