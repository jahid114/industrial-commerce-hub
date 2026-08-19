# PostgreSQL Database Design for MegaHaus

Deliverable: a single documentation file `docs/database-design.md` plus a runnable `docs/schema.sql` containing the full DDL (enums, tables, keys, indexes, constraints, seed-friendly notes). No app code changes — the UI keeps using its current local stores until you wire the backend.

## Scope

The schema covers everything the UI models today:

- Identity & access: users, roles, permissions, admin RBAC matrix
- Catalog: categories, subcategories, brands, countries, suppliers, products, images, specs, inventory
- Selling: carts, wishlist, compare, orders, order items, order events, shipping, returns/cancellations
- Quotations: multi-item RFQs, quoted prices, status timeline, conversion to order
- Agents: agent profiles, commission percentages, agent-owned customers, per-line price overrides
- Partners & investors: public requests + manually managed records
- Careers: job postings, applications, uploaded files
- Contact messages

## Table groups

### 1. Identity
```text
users(id, email uniq, password_hash, full_name, phone, company, status, created_at)
user_roles(user_id, role)            -- enum: customer, agent, partner, admin
customer_profiles(user_id PK, city, source, must_reset_password, suspended_reason, notes)
addresses(id, user_id, label, recipient, phone, line1, city, district, postal_code, is_default)
admin_roles(id, name, description, is_system)
admin_role_permissions(role_id, permission)   -- 'orders:edit' style keys
admin_users(user_id PK, role_id, status, last_active_at)
```
Roles live in their own table (never a column on users) so permission checks stay server-side.

### 2. Catalog
```text
countries(id, name, iso2, active)
brands(id, name, country_id, logo_text)
categories(id, slug uniq, name, description, icon, parent_id)   -- self-referencing for subcategories
suppliers(id, name, country_id, contact_name, email, rating, since)
products(id, sku uniq, slug uniq, name, brand_id, category_id, subcategory_id,
         supplier_id, country_id, price_bdt, agent_price_bdt, moq,
         delivery_days, short_description, description, featured, status)
product_images(id, product_id, url, position)
product_specs(id, product_id, label, value, position)
product_tags(product_id, tag)
inventory(product_id PK, stock, reserved, reorder_level, warehouse, updated_at)
inventory_movements(id, product_id, delta, reason, ref_type, ref_id, created_at)
```
Two-price rule stays in the data: `price_bdt` is the customer price, `agent_price_bdt` is agent-only. Effective agent price = product price discounted by that agent's `commission_pct` when no explicit agent price exists.

### 3. Agents & their customers
```text
agents(id, user_id, name, area, phone, email, agent_type, commission_pct,
       status, joined_at)
agent_customers(id, agent_id, name, contact_name, phone, email, address,
                interest, estimated_value, notes, created_at)
agent_commissions(id, agent_id, order_id, base_amount, pct, amount, status, paid_at)
```

### 4. Orders
```text
orders(id, order_no uniq, customer_user_id, agent_id null, agent_customer_id null,
       customer_name, customer_email, customer_phone,
       status, payment_status, payment_method, priority,
       subtotal, tax, shipping_fee, discount, total,
       shipping_address, billing_address, internal_notes, placed_at)
order_items(id, order_id, product_id, name_snapshot, sku_snapshot,
            quantity, unit_price, list_price, discount_pct, line_total)
order_shipments(id, order_id, carrier, tracking_number, shipped_at, estimated_delivery)
order_events(id, order_id, type, message, actor, created_at)
order_requests(id, order_id, requester_user_id, type, reason, status, created_at)
```
`order_requests.type` covers both return and cancellation, matching the current UI. `agent_id` non-null is the "from agent" flag the admin table shows. Item price snapshots preserve what was charged even if the catalog changes.

### 5. Quotations
```text
quotations(id, rfq_no uniq, customer_user_id null, customer_name, customer_email,
           customer_phone, company, message, status, quoted_total, valid_until,
           payment_terms, delivery_terms, assigned_to, internal_notes,
           converted_order_id null, created_at)
quotation_items(id, quotation_id, product_id, product_name, quantity,
                target_price, quoted_price, notes)
quotation_events(id, quotation_id, type, message, actor, created_at)
```

### 6. Partners, careers, messages
```text
partner_requests(id, source, name, company, email, phone, type, passport_number,
                 address, shop_location, website, trade_license, city_corp_cert,
                 chamber_cert, amount, message, status, internal_notes, submitted_at)
partner_request_files(id, request_id, url, filename)
job_postings(id, slug uniq, title, type, location, summary, description,
             responsibilities jsonb, requirements jsonb, published, posted_at)
job_applications(id, job_id, role_applied, status, name, email, phone, city,
                 nid, trade_license, experience, areas, message, submitted_at)
job_application_files(id, application_id, url, filename)
contact_messages(id, name, email, subject, message, status, submitted_at)
```

### 7. Session state (optional server-side)
```text
carts(id, user_id null, session_token null, updated_at)
cart_items(cart_id, product_id, quantity, unit_price_override null)
wishlist_items(user_id, product_id, added_at)
```
Agent draft orders reuse `carts` with an `agent_id` column so an agent can build an order for one of their customers with per-line price overrides.

## Enum types

`user_role`, `order_status` (Pending, Confirmed, Processing, Shipped, Delivered, Cancelled, On Hold), `payment_status`, `payment_method`, `order_priority`, `order_request_type`, `order_request_status`, `quotation_status`, `partner_type`, `partner_status`, `application_status`, `message_status`, `agent_status`, `customer_status`.

## Conventions

- `uuid` primary keys with `gen_random_uuid()`; human-facing identifiers (`order_no`, `rfq_no`, `sku`) are separate unique text columns.
- Money stored as `numeric(14,2)` in BDT — never floats.
- `created_at`/`updated_at timestamptz default now()`, with an `updated_at` trigger function shared by all mutable tables.
- Soft delete via `deleted_at` on products, suppliers, agents, and job postings; hard delete elsewhere.
- Indexes on every FK, plus composite indexes for the hot listing queries: `orders(status, placed_at desc)`, `orders(agent_id, placed_at desc)`, `products(category_id, featured)`, `job_applications(job_id, status)`, `quotations(status, created_at desc)`.
- Full-text search index on `products(name, description)` using `tsvector` for the catalog search bar.
- Referential rules: order/quotation items use `ON DELETE RESTRICT` against products (history must survive), child event/file tables use `ON DELETE CASCADE`.

## Documentation contents

`docs/database-design.md` will include: an ERD in ASCII, per-table column tables with types and notes, the enum list, indexing and constraint rationale, and a short mapping section showing which UI screen reads which tables.

## Out of scope

No backend code, no ORM models, no migration runner setup, and no changes to the existing UI stores.
