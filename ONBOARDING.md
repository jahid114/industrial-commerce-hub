# MegaHaus Industrial Hub — Engineering Onboarding

Welcome! This document is a guided tour of the codebase: what the product is, how the app is put together, where things live, and what to watch out for. It's written for someone new to the project — read it top to bottom once, then use it as a reference.

## 1. What this project is

**MegaHaus** is a B2B industrial-equipment marketplace for the Bangladeshi market (brands like Bosch, Makita, Siemens, Festo, ABB, Hilti, Caterpillar, Kärcher), built by **Protocol Cashmere Limited**. It's one app with four distinct experiences:

- **Public storefront** — browse products, request quotes, apply as an agent/partner, read company/marketing pages.
- **Admin console** (`/admin/*`) — full back-office: products, inventory, orders, customers, agents, quotations, RBAC, reports.
- **Agent / Partner portal** (`/portal/*`) — sales agents create orders on behalf of customers and track commissions; partners/investors see KPIs and a deal room.
- **Customer self-service portal** (`/portal-customer/*`) — logged-in customers shop at their own pricing, track orders, manage addresses.

The project was scaffolded by **Lovable** on top of **TanStack Start**, and currently has **no real backend** — all data is static seed arrays + browser `localStorage`. A full PostgreSQL schema has already been designed for the eventual real backend (see §6) but nothing is wired up to it yet. A large chunk of early engineering work here will likely be **building the real API and swapping the mock stores for it**.

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | **TanStack Start** (SSR + file-based routing via TanStack Router) on **React 19** |
| Build tool | **Vite 7**, package manager **Bun** (`bun.lock`, `bunfig.toml` — not npm/yarn/pnpm) |
| Styling | **Tailwind CSS v4** |
| UI primitives | **shadcn/ui** (style "new-york") on top of **Radix UI**, icons from **lucide-react** |
| Forms/validation | **react-hook-form** + **zod** |
| Data fetching (scaffolded, not yet used) | **@tanstack/react-query** |
| Charts | **recharts** (admin dashboards, portfolio docs) |
| PDF generation | **jsPDF** + **jspdf-autotable** (invoices, reports, placeholder docs) |
| Toasts | **sonner** |

### Getting started
```bash
bun install
bun run dev      # vite dev — starts the app with SSR
bun run build    # production build
bun run lint     # eslint .
bun run format   # prettier --write .
```
- Use the `@/` import alias for everything under `src/` (e.g. `@/components`, `@/lib`, `@/data`).
- `vite.config.ts` is intentionally thin — it wraps `@lovable.dev/vite-tanstack-config`, which already bundles the TanStack Start plugin, React plugin, Tailwind, path aliases, and Nitro. **Don't re-add those plugins manually** (there's a comment in the file warning about this).
- New shadcn primitives should be added via the shadcn CLI per `components.json` (they land in `src/components/ui/`), not hand-rolled.
- `src/routeTree.gen.ts` is **auto-generated** by the TanStack Router Vite plugin from `src/routes/**` — never hand-edit it. Adding a page = adding a file in `src/routes/`.

## 3. Top-level file structure

```
src/
  routes/          File-based routes (TanStack Router) — pages, layouts, loaders
  components/
    layout/        Public header/footer, customer portal shell (admin/agent shells live inline in their route files — see §4.3)
    admin/          Admin-only widgets (order requests panel, taxonomy tabs, table toolbar)
    agent/          Agent-portal widgets (new order dialog, order detail dialog)
    customer/       Customer-facing widgets shared with admin (address book)
    product/        Product card, filters, quick-view modal
    quotation/      RFQ ("request a quote") builder + success screen
    portfolio/      Shared layout primitives for investor/marketing "document" pages
    ui/             shadcn/ui primitive library (buttons, dialogs, tables, etc.) — boilerplate, not business logic
  data/            Static seed/mock data (products, brands, categories, orders, quotations, suppliers, agents) + shared TS types
  lib/             App "backend": React Context stores, business logic, PDF/formatting helpers (see §5)
    api/            Stub for the real future backend (TanStack Start server functions)
  hooks/           Two small UI-only hooks (NOT where data-fetching hooks live — see §5)
  routeTree.gen.ts Auto-generated route tree — do not edit
  router.tsx       Router + QueryClient factory
  start.ts         TanStack Start server config (SSR error handling)
  server.ts        Custom SSR entry, wraps error handling
  styles.css       Global Tailwind v4 stylesheet
docs/
  database-design.md, schema.sql   Designed-but-not-yet-built Postgres schema (see §6)
.lovable/
  plan/            Planning docs Lovable generated (e.g. the DB design plan)
  project.json     Minimal Lovable project metadata
```

## 4. Routing & app shell

Routes live in `src/routes/**` using TanStack Router's **flat-file convention**: `.` in a filename is a path separator, `$param` is a dynamic segment, a file with no suffix beyond its parent's name (or `index.tsx`) is that parent's index route, and a file that shares a name with a group of other files acts as their **layout route** (renders `<Outlet/>` for its children).

### 4.1 Root shell — `src/routes/__root.tsx`
Sets up `<html>/<head>`, and nests the global providers in this order:
`QueryClientProvider` → `StoreProvider` → `DirectoryProvider` → `CustomersProvider` → `<Outlet/>` + a global `<Toaster richColors position="top-right"/>`. Also defines the global 404 page and a top-level error boundary.

### 4.2 Route groups

| Prefix | Area | Layout route | Access |
|---|---|---|---|
| *(none)* | Public storefront & marketing pages | `PublicLayout` (wrapped per-page) | Everyone; auto-redirects logged-in users to their role's home |
| `portfolio.*` | Static investor/press documents | — | Public |
| `admin.*` | Admin console | `admin.tsx` | Role-gated: admins only |
| `portal.*` | Agent & Partner portal | `portal.tsx` | Role-gated: agents or partners (same URL space, nav/content differs by role) |
| `portal-customer.*` | Customer self-service portal | `portal-customer.tsx` | Role-gated: logged-in customers |

Key dynamic routes: `products.$productId`, `portal-customer.catalog.$productId`, `admin.orders.$orderId`, `portal-customer.orders.$orderId`, `admin.jobs.$jobId`, `admin.quotations.$rfqId`, `careers.$slug`.

Full per-page breakdown (what each route file renders) is at the end of this document in **Appendix A**, since it's long — skim it once to know where a given screen lives.

### 4.3 Layout components — ⚠️ a gotcha worth knowing
Only 4 files live in `src/components/layout/`: `PublicLayout`, `PublicHeader`, `PublicFooter`, `CustomerPortalShell`. **The admin sidebar shell and the agent/partner portal shell are not in this folder** — they're defined inline inside `src/routes/admin.tsx` (`AdminLayout`) and `src/routes/portal.tsx` (`PortalLayout`). A newcomer looking for "the admin layout component" should check the route file, not `components/layout/`.

Role-based chrome summary:
- **Admin** → ERP-style collapsible sidebar + topbar (`admin.tsx`).
- **Agent/Partner** → same sidebar/topbar pattern, but nav items + dashboard content swap based on `isAgent`/`isPartner` (`portal.tsx`).
- **Customer** → storefront-style header (`CustomerPortalShell`), no sidebar.
- **Guest** → `PublicLayout` (header/footer); redirects any logged-in user away to their proper home.

## 5. Component architecture by domain

Business logic components are grouped by who uses them, but **domains are not fully isolated** — several components are deliberately shared:

- **`customer/AddressBook.tsx`** is used both in the customer's own profile page and inside the **admin** customer-management screen.
- **`product/ProductCard.tsx`** and **`product/ProductQuickView.tsx`** are shared across the public catalog, the agent portal catalog, and the customer portal catalog; they conditionally reveal **agent-only pricing** via a `canSeeAgentPrice(role)` check rather than forking separate components per role.
- **`quotation/QuotationBuilder.tsx`** is the same RFQ form used by both the public `/quotation` page and the customer portal's `/portal-customer/quotation`.

| Folder | What it's for |
|---|---|
| `admin/` | `OrderRequestsPanel` (returns/cancellations table), `TableToolbar` (shared search/pagination helpers), `TaxonomyTabs` (brand & country CRUD for `/admin/settings`) |
| `agent/` | `NewOrderDialog` (agent builds an order for a customer at agent pricing), `OrderDetailDialog` (read-only order view with status timeline) — used from the `portal.*` routes |
| `customer/` | `AddressBook` — CRUD for saved delivery addresses, shared with admin |
| `product/` | `ProductCard`, `ProductFilters`, `ProductQuickView` — the catalog browsing experience, reused across all three authenticated areas plus the public site |
| `quotation/` | `QuotationBuilder` + `QuotationSuccess` — the RFQ flow |
| `portfolio/` | `DocChrome` — shared layout primitives (headers, bullet lists, key tables) + a jsPDF-based placeholder-PDF generator for the investor/marketing document pages |
| `ui/` | shadcn/ui primitive library (accordion, dialog, table, form, sidebar, etc.) — pure boilerplate, generated via the shadcn CLI, no business logic |

Mutations in all of these flow through `dispatch({ type: "..." })` on `useStore()` (a reducer), and user feedback is via `sonner` toasts.

## 6. Data layer — how state actually works today

**There is no real backend yet.** Everything is a client-side simulation:

```
src/data/*.ts  (static seed arrays)
      │  seed
      ▼
src/lib/*-store.tsx  (React Context + useReducer/useState)
      │  hydrate/persist
      ▼
  localStorage (per-browser only — no server, no multi-device sync, no real auth)
      │  consumed via use*() hooks exported from these same lib files
      ▼
   components
```

### 6.1 `src/data/` — seed data & shared types
`types.ts` defines all shared domain types (`Product`, `Order`, `Quotation`, `Agent`, `Supplier`, `Role`, etc.). The other files (`products.ts`, `brands.ts`, `categories.ts`, `orders.ts`, `quotations.ts`, `suppliers.ts`, `agents.ts`) are hardcoded demo arrays — e.g. 16 products across 8 real industrial brands, 11 seed orders for fictional Bangladeshi companies.

### 6.2 `src/lib/*-store.tsx` — the "mock backend"
Each store follows the same recipe: seed from `src/data/*`, hold state in a React Context via `useReducer`/`useState`, hydrate from a `localStorage` key on mount, persist back on every change.

| Store | Hook | Covers |
|---|---|---|
| `store.tsx` | `useStore()` | Auth/current user, cart, wishlist, compare, orders, quotations — the main one |
| `customers-store.tsx` | `useCustomers()` | Registered customer directory (admin CRM) |
| `inventory-store.tsx` | `useInventory()` | Stock buckets, movement ledger, returns/damaged goods |
| `rbac-store.tsx` | `useRbac()` | Admin roles & permission matrix |
| `directory-store.tsx` | `useDirectory()` | Suppliers + field agents |
| `agent-customers.ts` | `useAgentCustomers()` | An individual agent's leads |
| `customer-addresses.ts` | `useCustomerAddresses()` | Per-customer saved addresses |
| `order-requests.ts` | `useOrderRequests()` | Return/cancellation requests |
| `taxonomy-store.ts` | `useBrandsAdmin()` / `useCountriesAdmin()` | Admin-editable brand/country lists |

Plus pure-logic helpers with no persistence: `order-workflow.ts`, `quotation-workflow.ts` (status/stage rules), `pricing.ts` (two-tier customer vs. agent pricing, `canSeeAgentPrice`), `format.ts` (currency/date formatting), `pdf.ts` (invoice/report generation).

### 6.3 ⚠️ Gotcha: data hooks are not in `src/hooks/`
`src/hooks/` only contains two small **UI** hooks (`use-mobile`, `use-sidebar-collapsed`). All the real "data" hooks listed above live in `src/lib/*`. A newcomer looking for data-fetching hooks should check `src/lib/`, not `src/hooks/`.

### 6.4 `src/lib/api/` — the future backend, scaffolded but empty
Only one file exists: `example.functions.ts`, a template showing the intended pattern — TanStack Start's `createServerFn()` with zod input validation, explicitly commented as the replacement for "Supabase Edge Functions." **No real API functions have been built yet**, and `@tanstack/react-query` (already wired into the app via `QueryClientProvider`) isn't actually used for data fetching anywhere yet — it's scaffolding, waiting for a real backend to call.

## 7. The planned real backend (not yet implemented)

`docs/database-design.md` + `docs/schema.sql` (a full PostgreSQL 14+ DDL, ~660 lines) describe the **intended future schema** — explicitly scoped as documentation-only, with **no app code wired to it**. It was planned in `.lovable/plan/postgresql-database-design-for-megahaus-2026-08-19.md`.

Table groups: identity & access (`users`, `user_roles` kept separate from `users` for security, `addresses`, admin RBAC tables), catalog (`countries`, `brands`, `categories` with proper parent/child nesting, `products`, `suppliers`, `inventory` + an append-only `inventory_movements` ledger), agents (`agents`, `agent_customers`, per-order `agent_commissions`), orders (`orders`, `order_items` with price snapshots, `order_shipments`, `order_events`, `order_requests`), quotations (`quotations`, `quotation_items`, `quotation_events`), plus partners/careers/contact tables, and session state (`carts`, `wishlist_items`, `compare_items`).

**Known divergences between today's mock data and this schema** (useful to know before wiring up the real backend):
- Mock `Category.subcategories` is a flat `string[]`; the schema models categories as a proper self-referencing table.
- Mock `Product.specs`/`gallery` are inline arrays; the schema normalizes them into child tables (`product_specs`, `product_images`).
- There's no `users` table in the mock — role lives directly on the in-memory `User` object; the schema deliberately isolates roles into `user_roles`.
- Mock agent commission is a single running total; the schema tracks a per-order ledger (`agent_commissions`).
- Cart/wishlist/compare only exist inside `store.tsx`'s client state today; the schema gives them dedicated tables.

**Likely first big engineering project here**: build `createServerFn` handlers in `src/lib/api/` against this Postgres schema, then replace the `localStorage`-backed stores in `src/lib/*` with `react-query` hooks calling those functions.

## 8. Quick orientation checklist for your first week

1. Run `bun install && bun run dev`, click through the public site, then log in via `/auth/login` as each role (customer/agent/partner/admin) to see all four experiences.
2. Read `src/routes/__root.tsx` to see the provider stack, then open `src/routes/admin.tsx` and `src/routes/portal.tsx` to see how the two sidebar shells work.
3. Pick one end-to-end flow (e.g. submitting a quotation) and trace it: route file → `components/quotation/QuotationBuilder.tsx` → `dispatch({ type: "ADD_QUOTATION" })` in `src/lib/store.tsx` → where it's read back in `admin.quotations.index.tsx` and `portal-customer.quotations.tsx`.
4. Skim `docs/database-design.md` so you understand where this is all headed once a real backend gets built.
5. Remember the two gotchas above: admin/agent layout shells live in route files, not `components/layout/`; and data hooks live in `src/lib/`, not `src/hooks/`.

---

## Appendix A — Full route table

### Public site
| Path | File | Purpose |
|---|---|---|
| `/` | `index.tsx` | Home: hero, brand marquee, category grid, featured products, quote CTA |
| `/about` | `about.tsx` | Corporate "About Us" (vision, team, roadmap) |
| `/account` | `account.tsx` | Legacy shim — redirects by role |
| `/agents` | `agents.tsx` | "Become an Agent" application form |
| `/auth/login` | `auth.login.tsx` | Login (mock role selection) |
| `/auth/register` | `auth.register.tsx` | Customer registration |
| `/careers` | `careers.index.tsx` | Job openings list |
| `/careers/field-agent` | `careers.field-agent.tsx` | Field Agent role landing + apply |
| `/careers/$slug` | `careers.$slug.tsx` | Generic job detail + apply |
| `/cart` | `cart.tsx` | Guest cart |
| `/checkout` | `checkout.tsx` | Guest checkout → creates order + PDF invoice |
| `/compare` | `compare.tsx` | Public product comparison |
| `/contact` | `contact.tsx` | Contact form → admin inbox |
| `/industries` | `industries.tsx` | Industry-vertical marketing page |
| `/partners` | `partners.tsx` | Investment/partnership application |
| `/products` | `products.index.tsx` | Public catalog with filters |
| `/products/$productId` | `products.$productId.tsx` | Product detail |
| `/quotation` | `quotation.tsx` | Public RFQ builder |
| `/suppliers` | `suppliers.tsx` | Verified suppliers list |
| `/wishlist` | `wishlist.tsx` | Public wishlist |

### Portfolio (investor/press docs)
| Path | File |
|---|---|
| `/portfolio` | `portfolio.index.tsx` |
| `/portfolio/corporate-profile` | `portfolio.corporate-profile.tsx` |
| `/portfolio/market-potential` | `portfolio.market-potential.tsx` |
| `/portfolio/strategic-vision-2033` | `portfolio.strategic-vision-2033.tsx` |

### Admin console (`admin.tsx` = layout, admins only)
| Path | File | Purpose |
|---|---|---|
| `/admin` | `admin.index.tsx` | KPI dashboard + charts |
| `/admin/products` | `admin.products.tsx` | Product CRUD |
| `/admin/inventory` | `admin.inventory.tsx` | Stock + movement history |
| `/admin/suppliers` | `admin.suppliers.tsx` | Supplier CRUD |
| `/admin/orders` | `admin.orders.index.tsx` | Orders list + return/cancel requests |
| `/admin/orders/$orderId` | `admin.orders.$orderId.tsx` | Order detail/actions |
| `/admin/customers` | `admin.customers.tsx` | Nested layout (tabs) |
| `/admin/customers/` | `admin.customers.index.tsx` | Customer CRUD |
| `/admin/customers/statistics` | `admin.customers.statistics.tsx` | Customer trend charts |
| `/admin/agents` | `admin.agents.tsx` | Field-agent directory + commissions |
| `/admin/quotations` | `admin.quotations.index.tsx` | RFQ list |
| `/admin/quotations/$rfqId` | `admin.quotations.$rfqId.tsx` | RFQ detail / convert to order |
| `/admin/jobs` | `admin.jobs.index.tsx` | Job postings CRUD |
| `/admin/jobs/$jobId` | `admin.jobs.$jobId.tsx` | Applicants for a posting |
| `/admin/partners` | `admin.partners.tsx` | Partner/investor inquiry pipeline |
| `/admin/messages` | `admin.messages.tsx` | Contact-form inbox |
| `/admin/reports` | `admin.reports.tsx` | PDF report generation |
| `/admin/users` | `admin.users.tsx` | Admin console user management |
| `/admin/roles` | `admin.roles.tsx` | RBAC configuration |
| `/admin/settings` | `admin.settings.tsx` | Taxonomy (categories/brands/countries) |

### Agent/Partner portal (`portal.tsx` = layout)
| Path | File | Purpose |
|---|---|---|
| `/portal` | `portal.index.tsx` | Role-aware dashboard |
| `/portal/catalog` | `portal.catalog.tsx` | Agent catalog at agent pricing |
| `/portal/orders` | `portal.orders.tsx` | Agent's submitted orders |
| `/portal/leads` | `portal.leads.tsx` | Agent lead CRM |
| `/portal/commissions` | `portal.commissions.tsx` | Commission ledger |
| `/portal/kpis` | `portal.kpis.tsx` | Partner investor KPI dashboard |
| `/portal/documents` | `portal.documents.tsx` | Partner "Deal Room" |
| `/portal/inquiries` | `portal.inquiries.tsx` | Partner inquiry threads |

### Customer portal (`portal-customer.tsx` = layout)
| Path | File | Purpose |
|---|---|---|
| `/portal-customer/` | `portal-customer.index.tsx` | Redirects to catalog |
| `/portal-customer/catalog/` | `portal-customer.catalog.index.tsx` | Customer catalog |
| `/portal-customer/catalog/$productId` | `portal-customer.catalog.$productId.tsx` | Product detail |
| `/portal-customer/cart` | `portal-customer.cart.tsx` | Customer cart |
| `/portal-customer/checkout` | `portal-customer.checkout.tsx` | Checkout, pre-filled addresses |
| `/portal-customer/compare` | `portal-customer.compare.tsx` | Comparison table |
| `/portal-customer/wishlist` | `portal-customer.wishlist.tsx` | Wishlist |
| `/portal-customer/orders` | `portal-customer.orders.tsx` | Outlet wrapper |
| `/portal-customer/orders/` | `portal-customer.orders.index.tsx` | Order list + return/cancel |
| `/portal-customer/orders/$orderId` | `portal-customer.orders.$orderId.tsx` | Order detail |
| `/portal-customer/quotation` | `portal-customer.quotation.tsx` | RFQ builder |
| `/portal-customer/quotations` | `portal-customer.quotations.tsx` | Customer's RFQs |
| `/portal-customer/profile` | `portal-customer.profile.tsx` | Profile + addresses |
