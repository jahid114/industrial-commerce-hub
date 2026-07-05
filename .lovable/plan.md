
## Goal

Give logged-in customers a dedicated sidebar-based portal (like admin/agent/partner) that they never leave for private activity, and split the product catalog so the public site shows only "public" (featured) products while the full catalog lives inside the portal.

## 1. Customer portal at `/portal-customer/*`

Reuse the same sidebar shell pattern as `admin.tsx` / `portal.tsx` (dark sidebar, sticky topbar, account dropdown). Layout file `src/routes/portal-customer.tsx` guards on `isAuthenticated && role === "customer"` and redirects otherwise. Sidebar items:

- Dashboard (`/portal-customer`) — welcome, quick stats (orders, wishlist count, open quotations), recent orders, shortcuts
- Browse Catalog (`/portal-customer/catalog`) — full product catalog with filters (same as current `/products` page, but scoped inside portal shell)
- My Orders (`/portal-customer/orders`, `/portal-customer/orders/$orderId`)
- Quotations (`/portal-customer/quotations`)
- Wishlist (`/portal-customer/wishlist`)
- Compare (`/portal-customer/compare`)
- Profile & Addresses (`/portal-customer/profile`)
- Cart & Checkout (`/portal-customer/cart`, `/portal-customer/checkout`)

Migrate content out of the existing `/account/*` and public `/cart`, `/checkout`, `/compare` routes into the portal versions. Redirect old `/account*` URLs to the equivalent portal URL.

## 2. Public vs private product listing

Product type already has `featured?: boolean`. Reuse it as the public-visibility flag (rename semantically to "public listing"). Two helpers in `src/lib/products.ts`:

- `getPublicProducts()` — only `featured === true`
- `getAllProducts()` — all products (portal / admin / agent only)

Wire:
- Public `/products` and `/products/$productId` → use `getPublicProducts()`. Landing page featured grid stays as-is.
- Portal `/portal-customer/catalog` and its detail page → use `getAllProducts()`.
- Product detail: if guest hits a non-public product id, redirect to `/auth/login?redirect=...`. Same for direct visits to hidden URLs.
- Admin products page gets a "Public listing" toggle column (checkbox that flips `featured`) so admins can control what shows publicly.

## 3. Header behavior

Public header: when the user is a logged-in `customer`, replace "My Account" links with a single "Go to Portal" button pointing to `/portal-customer`. Admin/agent/partner already redirect to their own areas — leave that logic intact.

## 4. Auth flow

`auth.login.tsx` after successful login routes by role:
- admin → `/admin`
- agent/partner → `/portal`
- customer → `/portal-customer`

## Technical notes

- Same `useStore` / `StoreProvider` — no data-layer changes needed beyond the product filter helpers.
- Portal customer layout is a copy of `portal.tsx`'s shell (sidebar + topbar + account menu) styled identically.
- `/account/*` route files stay only as thin redirects to keep old links from 404'ing; can be deleted in a follow-up.
- Product mutations in admin already exist; adding the "public" toggle only needs an update action on `featured`.
- Compare and Wishlist move fully into the portal (no public equivalents), so those routes get portal-only.

## Out of scope

- Real auth (still demo login).
- Backend/database — everything remains in `useStore` + seed data.
- Redesigning product cards, filters, or checkout flow — only relocating them.
