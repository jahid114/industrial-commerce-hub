# MegaHaus Industrial Hub — Demo Build Plan

A static demo of MegaHaus on TanStack Start with mock JSON data. No backend, no auth server — login is a fake form that flips a local flag. Three surfaces: public site, customer dashboard, admin panel.

## Brand & Design System

From the PDF brief:
- **Primary:** Red `#E53935` (CTAs: Buy, Submit, Add to Cart)
- **Secondary:** Yellow/Orange `#FFA500` (highlights, Request Quote, active states)
- **Industrial neutrals:** Black `#0E0E0E`, White `#FFFFFF`, Gray scale
- **Feel:** "Industrial strength + modern technology + global marketplace" — Alibaba × Amazon Industrial × engineering catalog. Dense product grids, technical specs front-and-center, no soft/wellness aesthetic.
- Tokens added to `src/styles.css` as oklch under `@theme inline` (semantic: `--primary`, `--accent`, `--industrial-dark`, `--spec-table`, etc.). All components consume tokens — no hardcoded hex.
- Typography: Inter for body, a heavy condensed sans (e.g. Oswald) for headlines / product names — loaded via `<link>` in `__root.tsx`.
- Logo: "MEGAHAUS" wordmark in heavy black with red accent bar, rendered as an SVG component.

## Tech Stack (mapped from your list)

| You asked for | What we'll use on TanStack Start | Why |
|---|---|---|
| Next.js 16 | TanStack Start (React 19 + Vite, file-based routes, SSR) | Lovable constraint |
| Tailwind v4 | Tailwind v4 (already configured) | ✓ |
| shadcn latest | shadcn (already installed) | ✓ |
| Zod v4 | Zod v4 for form schemas (RFQ, registration, checkout) | ✓ |
| jspdf + autotable | jsPDF for invoices & admin reports | ✓ |
| framer-motion | framer-motion for page transitions, card hovers, drawer | ✓ |
| RTK Query | Skipped per your choice → React state + mock JSON in `src/data/` | Simpler, faster demo |

## Mock Data (`src/data/`)

- `brands.ts` — Bosch, Makita, Siemens, Festo, ABB, Hilti, Caterpillar, Karcher (each with logo URL, country)
- `categories.ts` — Tools, Machinery, Electrical, Construction, Automotive (+ subcategories)
- `products.ts` — ~40 products with: name, brand, category, country, price (BDT), MOQ, delivery days, image, gallery, specs table, description, supplier
- `suppliers.ts` — ~8 international suppliers
- `agents.ts` — ~6 field agents with area + commission stats
- `orders.ts` — ~12 mock orders across statuses (Pending, Confirmed, Shipped, Delivered)
- `quotations.ts` — ~8 RFQs with status + supplier responses

Cart, wishlist, auth-flag, and "submitted RFQs/orders" stored in a single `useAppStore` (React Context + `useReducer`) persisted to `localStorage` so the demo survives reloads.

## Routes

### Public site
- `/` — Hero ("Global Industrial Products, Delivered to Bangladesh"), category tiles, featured products carousel, brand strip, industrial solutions, partner CTA
- `/products` — Catalog: search, filters (Category, Brand, Country, Price range, MOQ), sort, grid/list toggle, pagination
- `/products/$productId` — Gallery, title/brand, price, MOQ, delivery, "Add to Cart" (red) + "Request Quotation" (yellow), tabs: Description / Specifications / Supplier Info, related products
- `/compare` — Side-by-side product comparison (up to 4)
- `/industries` — Industry solutions (Textile, Marine, Construction, Automotive, Power)
- `/suppliers` — Supplier directory + "Become a Supplier" CTA → form
- `/partners` — Partnership & Investment page (Become a Partner / Invest With Us CTAs + inquiry form)
- `/agents` — Agent program landing + registration form
- `/contact` — Contact form, address, phones, map placeholder
- `/about` — Vision, business model, network
- `/cart` — Line items, qty edit, totals, proceed to checkout
- `/checkout` — Address, payment method (COD / Bank / bKash / Nagad), order review → success page generates **jsPDF invoice download**
- `/quotation` — Standalone RFQ form
- `/auth/login` and `/auth/register` — Fake forms; toggle role (customer / agent / admin) for demo navigation

### Customer dashboard (`/account/*`)
- `/account` — Overview tiles (orders, RFQs, wishlist counts)
- `/account/orders` — Order history table, status badges, detail drawer, **download invoice (jsPDF + autotable)**
- `/account/orders/$orderId` — Timeline tracker, items, totals
- `/account/quotations` — RFQ history with supplier response status
- `/account/wishlist` — Saved products
- `/account/profile` — Profile edit form (Zod validated)

### Admin panel (`/admin/*`)
Separate layout with black sidebar (per brief), red active indicator, dense data tables.
- `/admin` — Dashboard: KPI cards, orders-over-time chart (Recharts, already installed), recent activity
- `/admin/products` — Table + create/edit dialog (Zod form), category/brand filters, bulk actions
- `/admin/suppliers` — Supplier CRUD
- `/admin/orders` — All orders, status update, **export PDF report (jsPDF autotable)**
- `/admin/agents` — Agent list + commission tracking
- `/admin/quotations` — RFQ inbox, mark as quoted/closed
- `/admin/reports` — Generate downloadable PDF sales/agent/inventory reports

All admin mutations update the in-memory store + localStorage; refresh keeps changes.

## Reusable Components (`src/components/`)

- `layout/PublicHeader.tsx` — Logo, mega-menu (categories dropdown), search, cart, account, language stub (EN/BN)
- `layout/PublicFooter.tsx` — Address block from PDF, links, brand strip
- `layout/AdminShell.tsx` — Black sidebar + topbar
- `layout/AccountShell.tsx` — Customer sidebar
- `product/ProductCard.tsx`, `ProductGrid.tsx`, `ProductFilters.tsx`, `SpecTable.tsx`, `BrandStrip.tsx`
- `forms/QuotationDialog.tsx`, `PartnerInquiryForm.tsx`, `AgentRegistrationForm.tsx` — Zod + react-hook-form
- `cart/CartDrawer.tsx` (framer-motion slide-in)
- `pdf/invoice.ts`, `pdf/orderReport.ts` — jsPDF generators

## Technical Notes

- Every route file gets its own `head()` (title, description, og:title, og:description) per route-architecture rules. Root sets only the site-wide defaults.
- All navigation via `<Link to=...>` from `@tanstack/react-router`; no `<a href>` for internal routes.
- Forms: `react-hook-form` + `zod` resolver; validation messages tied to shadcn `<FormMessage />`.
- Animations kept tasteful: page fade/slide on route change, card lift on hover, drawer slide. No layout/layoutId tricks needed.
- Mobile: hamburger drawer for public nav, collapsible sidebar for admin.
- SEO: semantic HTML, single H1 per page, alt text on product images, responsive viewport (already set).

## Out of Scope (this phase)

- Agent platform UI and Partner platform UI (per your selection — only public + customer + admin now)
- Real auth, real payments, real database, email sending, real shipment tracking
- i18n implementation (EN/BN toggle is a visual stub)

## Build Order

1. Design tokens + fonts + logo + shells (public, account, admin)
2. Mock data + global store + cart logic
3. Public routes: home → catalog → product detail → cart → checkout (+ invoice PDF)
4. Auxiliary public routes: industries, suppliers, partners, agents, contact, about, auth
5. Customer dashboard routes
6. Admin panel routes + PDF reports
7. Polish pass: animations, empty states, mobile, SEO meta on every route
