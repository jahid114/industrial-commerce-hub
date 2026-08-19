# MegaHaus — PostgreSQL Database Design

Backend-agnostic relational design for the MegaHaus marketplace UI. Runnable DDL lives in [`schema.sql`](./schema.sql) (PostgreSQL 14+).

Conventions used everywhere:

- `uuid` primary keys via `gen_random_uuid()`; human-facing identifiers (`order_no`, `rfq_no`, `sku`, `slug`) are separate unique text columns.
- Money is `numeric(14,2)` in BDT — never floating point.
- `created_at` / `updated_at` are `timestamptz` (UTC) with a shared `set_updated_at()` trigger.
- Soft delete (`deleted_at`) on products, suppliers, brands, agents and job postings; everything else hard-deletes.
- Every foreign key is indexed; history tables (`order_items`, `quotation_items`) use `ON DELETE RESTRICT` against products so past documents stay intact, while child event/file tables cascade.

---

## 1. Entity map

```text
                        ┌──────────┐
                        │  users   │───< user_roles
                        └────┬─────┘
        ┌────────────────────┼─────────────────────┬──────────────┐
        │                    │                     │              │
 customer_profiles       addresses            admin_users     agents
        │                                          │              │
        │                                     admin_roles ──< admin_role_permissions
        │                                                        │
        │                                                  agent_customers
        │                                                        │
        └─────────────┐                       ┌──────────────────┘
                      ▼                       ▼
                   ┌──────────────────────────────┐
                   │            orders            │──< order_items >── products
                   └──────────────────────────────┘
                      │        │        │      │
            order_events  order_shipments  order_requests  agent_commissions

  countries ──< brands ──┐
  countries ──< suppliers│──< products ──< product_images / product_specs / product_tags
  categories (self ref) ─┘        │
                                  └── inventory ──< inventory_movements

  quotations ──< quotation_items / quotation_events   (converted_order_id → orders)

  job_postings ──< job_applications ──< job_application_files   (agents.application_id →)
  partner_requests ──< partner_request_files
  contact_messages
  carts ──< cart_items      wishlist_items      compare_items
```

---

## 2. Identity & access

| Table | Purpose | Key columns |
|---|---|---|
| `users` | One row per human account (customer, agent, partner, admin) | `email` (unique, case-insensitive), `password_hash`, `status` |
| `user_roles` | Role assignment — deliberately **not** a column on `users` | `(user_id, role)` PK, enum `customer/agent/partner/admin` |
| `customer_profiles` | Customer-only fields | `source` (Registration / Guest Checkout / Admin), `must_reset_password`, `suspended_reason` |
| `addresses` | Multi-address book, one default per user | partial unique index `(user_id) WHERE is_default` |
| `admin_roles` | Named admin roles; `is_system` roles can't be renamed or deleted | |
| `admin_role_permissions` | Permission matrix rows, keys in the UI's `module:action` format (`orders:edit`) | |
| `admin_users` | Links a user to exactly one admin role | `status` Active/Inactive |

Guest checkout creates a `users` row plus a `customer_profiles` row with `source = 'Guest Checkout'` and `must_reset_password = true`, matching the temp-password flow in the UI.

Authorization must always be evaluated server-side. `has_role(user_id, role)` is provided as a `STABLE` SQL function so policies and queries share a single definition.

---

## 3. Catalog

| Table | Notes |
|---|---|
| `countries` | Business countries with ISO-2 code and `active` toggle (Admin → Settings → Country) |
| `brands` | Brand CRUD with optional country of origin and logo text |
| `categories` | Self-referencing: `parent_id IS NULL` = top-level, otherwise subcategory. Drives the two-pane mega menu |
| `suppliers` | Vendor directory. Product count is **derived**, not stored — see the `supplier_product_counts` view |
| `products` | Core catalog record |
| `product_images` / `product_specs` / `product_tags` | Ordered child rows; one primary image enforced by partial unique index |
| `inventory` | One row per product: `stock`, `reserved`, `reorder_level`, `warehouse` |
| `inventory_movements` | Append-only ledger; every stock change references its source document |

### Two-price rule

`products.price_bdt` is the public customer price. `products.agent_price_bdt` is the optional agent-only price and is constrained to be ≤ the customer price. When it is null, the effective agent price is derived at read time:

```sql
COALESCE(p.agent_price_bdt, round(p.price_bdt * (1 - a.commission_pct / 100), 2))
```

Public (unauthenticated) endpoints must never project `agent_price_bdt`.

### Search

`products.search_tsv` is a generated `tsvector` over name + descriptions with a GIN index, plus a trigram index on `name` for typo-tolerant lookups.

---

## 4. Agents

| Table | Notes |
|---|---|
| `agents` | Profile, `area`, `agent_type` (Servicing / Product / Field), `commission_pct` (default 8%), `status`, optional `user_id` login and `application_id` back-reference to the career application they were promoted from |
| `agent_customers` | The agent's own book of business — name, contact, address, interest, estimated value. Optionally linked to a real `users` row |
| `agent_commissions` | One row per (agent, order): base amount, pct applied, amount, payout status |

Aggregates the admin agent-details screen needs (`orders_submitted`, `revenue`, `commission_earned`) come from the `agent_performance` view rather than denormalized counters.

---

## 5. Orders

`orders` holds a single authoritative `status` (no separate fulfillment status), plus `payment_status`, `payment_method` and `priority`. A non-null `agent_id` is the "order came from an agent" flag the admin table shows; `agent_customer_id` records which of the agent's customers it was placed for.

`order_items` snapshots `name_snapshot`, `sku_snapshot`, `list_price` (catalog price at the time) and `unit_price` (what was actually charged), so agent per-line percentage or manual overrides are auditable forever.

`order_shipments` carries carrier, tracking number, ship date and estimated delivery — populated by the "Mark as Shipped" modal. `order_events` is the activity timeline shown to admin, agent and customer.

`order_requests` covers **both** returns and cancellations via `type`, with a partial unique index preventing two open requests of the same type on one order.

Typical status flow (enforced in application code, values constrained by the enum):

```text
Pending → Confirmed → Processing → Shipped → Delivered
   │           │            │
   └──────── Cancelled ◄────┘        On Hold ⇄ (any active state)
```

---

## 6. Quotations

`quotations` is a multi-item RFQ with its own number, status pipeline (`New → Under Review → Sourcing → Quoted → Negotiating → Accepted/Rejected → Converted`), commercial terms, assignee and internal notes. `quotation_items` holds per-product quantity, customer target price and the admin's quoted price. `quotation_events` is the timeline. When admin converts an RFQ, an order is created and its id stored in `converted_order_id`.

Quotations can be submitted by a logged-in customer (`customer_user_id`) or anonymously (email only).

---

## 7. Partners, careers and messages

- `partner_requests` — every field on the public partnership form (passport, shop location, trade licence, city corporation and chamber certificates, investment amount) plus `source` (`Public` for website submissions, `Manual` for admin-created records) which drives the two admin tabs. Attachments in `partner_request_files`.
- `job_postings` — slug-based SEO detail pages; `published` toggles visibility on the public careers page; `responsibilities` and `requirements` are `jsonb` string arrays.
- `job_applications` — linked to a job, with `nid` required and `trade_license` optional, plus a status workflow (`New / Reviewed / Shortlisted / Rejected`). Files in `job_application_files`. Promoting an applicant creates an `agents` row that points back via `application_id`.
- `contact_messages` — public contact form inbox with `New / Read / Resolved`.

CSV exports in the admin panel are plain `SELECT`s over `job_applications` joined to `job_postings`.

---

## 8. Cart, wishlist, compare

`carts` supports three owners: a logged-in customer (`user_id`), a guest (`session_token`), or an agent building a draft order (`agent_id` + `agent_customer_id`). `cart_items` carries `unit_price_override` and `discount_pct` so an agent's manual pricing survives until checkout. `wishlist_items` and `compare_items` are simple user↔product join tables.

---

## 9. Indexing summary

| Index | Serves |
|---|---|
| `orders(status, placed_at DESC)` | Admin order list + status filters |
| `orders(agent_id, placed_at DESC)` | Agent portal order list |
| `orders(customer_user_id, placed_at DESC)` | Customer order history |
| `products(category_id, featured) WHERE deleted_at IS NULL` | Public featured grid & category browse |
| `products USING gin(search_tsv)` / `gin(name gin_trgm_ops)` | Catalog search |
| `quotations(status, created_at DESC)` | Admin RFQ pipeline |
| `job_applications(job_id, status, submitted_at DESC)` | Job detail applicant table |
| `partner_requests(source, status, submitted_at DESC)` | Partner requests vs. managed records tabs |
| `order_requests(type, status, created_at DESC)` | Returns / cancellations tabs |

---

## 10. Views

| View | Returns |
|---|---|
| `supplier_product_counts` | Live product count per supplier (replaces the stored `productsCount`) |
| `agent_performance` | Orders submitted, revenue and commission earned per agent |
| `customer_registration_daily` | Daily signup counts for the customer statistics screen |

---

## 11. Screen → table map

| UI screen | Reads |
|---|---|
| Public home / products | `products`, `product_images`, `brands`, `categories` |
| Product detail | `products`, `product_images`, `product_specs`, `inventory`, `suppliers` |
| Cart / checkout | `carts`, `cart_items`, `addresses`, `orders`, `order_items` |
| Customer portal — Orders | `orders`, `order_items`, `order_events`, `order_shipments`, `order_requests` |
| Customer portal — Quotations | `quotations`, `quotation_items`, `quotation_events` |
| Customer portal — Profile | `users`, `customer_profiles`, `addresses` |
| Agent portal — Customers | `agent_customers` |
| Agent portal — New order | `products`, `agents.commission_pct`, `carts`, `orders`, `order_items` |
| Agent portal — Commissions | `agent_commissions`, `agent_performance` |
| Admin — Orders | `orders`, `order_items`, `order_events`, `order_shipments`, `order_requests`, `agents` |
| Admin — Customers & statistics | `users`, `customer_profiles`, `orders`, `customer_registration_daily` |
| Admin — Agents | `agents`, `agent_performance`, `job_applications` |
| Admin — Partners & Investors | `partner_requests`, `partner_request_files` |
| Admin — Jobs & Applications | `job_postings`, `job_applications`, `job_application_files` |
| Admin — Messages | `contact_messages` |
| Admin — Settings | `brands`, `countries`, `categories` |
| Admin — Roles & Permissions | `admin_roles`, `admin_role_permissions`, `admin_users` |

---

## 12. Security notes for the backend

1. Never trust a role claim from the client; resolve roles from `user_roles` on every request.
2. Scope customer queries by `customer_user_id`, agent queries by `agent_id`, and admin queries by the permission keys in `admin_role_permissions`.
3. `agent_price_bdt` and `agent_commissions` must never appear in public responses.
4. Hash passwords with bcrypt/argon2; `password_hash` is the only credential column and should never be selected into API payloads.
5. Auto-created guest accounts must be forced through a password reset (`must_reset_password`).
