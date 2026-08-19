-- =============================================================================
-- MegaHaus Marketplace — PostgreSQL schema
-- Target: PostgreSQL 14+
-- Money: numeric(14,2), BDT. Timestamps: timestamptz (UTC).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy search on names/SKUs

-- -----------------------------------------------------------------------------
-- 0. Shared helpers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 1. Enum types
-- -----------------------------------------------------------------------------
CREATE TYPE user_role            AS ENUM ('customer', 'agent', 'partner', 'admin');
CREATE TYPE account_status       AS ENUM ('Active', 'Inactive', 'Suspended');
CREATE TYPE customer_source      AS ENUM ('Registration', 'Guest Checkout', 'Admin');

CREATE TYPE product_status       AS ENUM ('Draft', 'Active', 'Archived');

CREATE TYPE agent_type           AS ENUM ('Servicing Agent', 'Product Agent', 'Field Agent');
CREATE TYPE agent_status         AS ENUM ('Active', 'Pending', 'Suspended');
CREATE TYPE commission_status    AS ENUM ('Accrued', 'Approved', 'Paid', 'Cancelled');

CREATE TYPE order_status         AS ENUM ('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled','On Hold');
CREATE TYPE payment_status       AS ENUM ('Unpaid','Partial','Paid','Refunded');
CREATE TYPE payment_method       AS ENUM ('COD','Bank Transfer','bKash','Nagad');
CREATE TYPE order_priority       AS ENUM ('Low','Normal','High','Urgent');
CREATE TYPE order_event_type     AS ENUM ('created','status','payment','fulfillment','note');
CREATE TYPE order_request_type   AS ENUM ('cancellation','return');
CREATE TYPE order_request_status AS ENUM ('Requested','Approved','Rejected','Completed');

CREATE TYPE quotation_status     AS ENUM ('New','Under Review','Sourcing','Quoted','Negotiating','Accepted','Rejected','Expired','Converted');
CREATE TYPE quotation_event_type AS ENUM ('created','status','note','quote','conversion');

CREATE TYPE partner_source       AS ENUM ('Public','Manual');
CREATE TYPE partner_type         AS ENUM ('Partnership','Exclusive Partnership','Product Servicing Agent','Investor');
CREATE TYPE partner_status       AS ENUM ('New','In Review','Meeting Scheduled','Approved','Rejected');

CREATE TYPE application_status   AS ENUM ('New','Reviewed','Shortlisted','Rejected');
CREATE TYPE message_status       AS ENUM ('New','Read','Resolved');

CREATE TYPE inventory_reason     AS ENUM ('purchase','sale','return','adjustment','reservation','release');

-- =============================================================================
-- 2. Identity & access
-- =============================================================================
CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext_or_text  NOT NULL, -- see note below; use citext if extension enabled
  password_hash  text            NOT NULL,
  full_name      text            NOT NULL,
  phone          text,
  company        text,
  status         account_status  NOT NULL DEFAULT 'Active',
  email_verified boolean         NOT NULL DEFAULT false,
  last_login_at  timestamptz,
  created_at     timestamptz     NOT NULL DEFAULT now(),
  updated_at     timestamptz     NOT NULL DEFAULT now()
);
-- If the citext extension is unavailable, declare email as `text` and rely on
-- the lower() unique index below (already the case for portability).
ALTER TABLE users ALTER COLUMN email TYPE text;
CREATE UNIQUE INDEX users_email_lower_uidx ON users (lower(email));
CREATE TRIGGER users_touch BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Roles are NEVER a column on users: separate table prevents privilege escalation.
CREATE TABLE user_roles (
  user_id uuid      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role    user_role NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role user_role)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE customer_profiles (
  user_id              uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  city                 text,
  source               customer_source NOT NULL DEFAULT 'Registration',
  must_reset_password  boolean         NOT NULL DEFAULT false,
  suspended_reason     text,
  notes                text,
  registered_at        timestamptz     NOT NULL DEFAULT now()
);

CREATE TABLE addresses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label        text NOT NULL DEFAULT 'Home',
  recipient    text NOT NULL,
  phone        text,
  line1        text NOT NULL,
  line2        text,
  city         text NOT NULL,
  district     text,
  postal_code  text,
  country      text NOT NULL DEFAULT 'Bangladesh',
  is_default   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX addresses_user_idx ON addresses (user_id);
-- Exactly one default address per user.
CREATE UNIQUE INDEX addresses_one_default_uidx ON addresses (user_id) WHERE is_default;
CREATE TRIGGER addresses_touch BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---- Admin RBAC --------------------------------------------------------------
CREATE TABLE admin_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  is_system   boolean NOT NULL DEFAULT false,   -- system roles cannot be renamed/deleted
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Permission keys use the UI format '<module>:<action>', e.g. 'orders:edit'.
CREATE TABLE admin_role_permissions (
  role_id    uuid NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission text NOT NULL,
  PRIMARY KEY (role_id, permission)
);

CREATE TABLE admin_users (
  user_id        uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role_id        uuid NOT NULL REFERENCES admin_roles(id) ON DELETE RESTRICT,
  status         account_status NOT NULL DEFAULT 'Active',
  last_active_at timestamptz
);
CREATE INDEX admin_users_role_idx ON admin_users (role_id);

-- =============================================================================
-- 3. Catalog
-- =============================================================================
CREATE TABLE countries (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name   text NOT NULL UNIQUE,
  iso2   char(2) NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE brands (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  name       text NOT NULL,
  country_id uuid REFERENCES countries(id) ON DELETE SET NULL,
  logo_text  text,
  logo_url   text,
  deleted_at timestamptz
);
CREATE INDEX brands_country_idx ON brands (country_id);

-- Self-referencing: parent_id IS NULL => top-level category, otherwise subcategory.
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   uuid REFERENCES categories(id) ON DELETE CASCADE,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon        text,
  position    int  NOT NULL DEFAULT 0
);
CREATE INDEX categories_parent_idx ON categories (parent_id);

CREATE TABLE suppliers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  country_id   uuid REFERENCES countries(id) ON DELETE SET NULL,
  contact_name text,
  email        text,
  phone        text,
  rating       numeric(2,1) CHECK (rating BETWEEN 0 AND 5),
  since        date,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE TRIGGER suppliers_touch BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku               text NOT NULL UNIQUE,
  slug              text NOT NULL UNIQUE,
  name              text NOT NULL,
  brand_id          uuid REFERENCES brands(id)     ON DELETE SET NULL,
  category_id       uuid REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id    uuid REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id       uuid REFERENCES suppliers(id)  ON DELETE SET NULL,
  country_id        uuid REFERENCES countries(id)  ON DELETE SET NULL,
  price_bdt         numeric(14,2) NOT NULL CHECK (price_bdt >= 0),   -- customer price
  agent_price_bdt   numeric(14,2) CHECK (agent_price_bdt >= 0),      -- agent-only price
  moq               int NOT NULL DEFAULT 1 CHECK (moq > 0),
  delivery_days     text,
  short_description text NOT NULL DEFAULT '',
  description       text NOT NULL DEFAULT '',
  featured          boolean NOT NULL DEFAULT false,
  status            product_status NOT NULL DEFAULT 'Active',
  search_tsv        tsvector GENERATED ALWAYS AS (
                      to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(short_description,'') || ' ' || coalesce(description,''))
                    ) STORED,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  CHECK (agent_price_bdt IS NULL OR agent_price_bdt <= price_bdt)
);
CREATE INDEX products_category_featured_idx ON products (category_id, featured) WHERE deleted_at IS NULL;
CREATE INDEX products_brand_idx     ON products (brand_id);
CREATE INDEX products_supplier_idx  ON products (supplier_id);
CREATE INDEX products_country_idx   ON products (country_id);
CREATE INDEX products_price_idx     ON products (price_bdt);
CREATE INDEX products_search_idx    ON products USING gin (search_tsv);
CREATE INDEX products_name_trgm_idx ON products USING gin (name gin_trgm_ops);
CREATE TRIGGER products_touch BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        text NOT NULL,
  alt        text,
  position   int  NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false
);
CREATE INDEX product_images_product_idx ON product_images (product_id, position);
CREATE UNIQUE INDEX product_images_one_primary_uidx ON product_images (product_id) WHERE is_primary;

CREATE TABLE product_specs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label      text NOT NULL,
  value      text NOT NULL,
  position   int  NOT NULL DEFAULT 0
);
CREATE INDEX product_specs_product_idx ON product_specs (product_id, position);

CREATE TABLE product_tags (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag        text NOT NULL,
  PRIMARY KEY (product_id, tag)
);
CREATE INDEX product_tags_tag_idx ON product_tags (tag);

CREATE TABLE inventory (
  product_id    uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  stock         int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reserved      int NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  reorder_level int NOT NULL DEFAULT 0,
  warehouse     text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER inventory_touch BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE inventory_movements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta      int  NOT NULL,                 -- +receipt / -issue
  reason     inventory_reason NOT NULL,
  ref_type   text,                          -- 'order' | 'return' | 'manual'
  ref_id     uuid,
  actor_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inventory_movements_product_idx ON inventory_movements (product_id, created_at DESC);

-- =============================================================================
-- 4. Agents & agent-owned customers
-- =============================================================================
CREATE TABLE agents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  code           text UNIQUE,                       -- e.g. AG-1042
  name           text NOT NULL,
  area           text,
  phone          text,
  email          text,
  agent_type     agent_type NOT NULL DEFAULT 'Field Agent',
  commission_pct numeric(5,2) NOT NULL DEFAULT 8.00 CHECK (commission_pct BETWEEN 0 AND 100),
  status         agent_status NOT NULL DEFAULT 'Pending',
  joined_at      date NOT NULL DEFAULT current_date,
  application_id uuid,                               -- FK added after job_applications
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);
CREATE TRIGGER agents_touch BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Agents keep their own book of business (the portal "Customers" tab).
CREATE TABLE agent_customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,  -- set if they also register
  name            text NOT NULL,
  contact_name    text,
  phone           text,
  email           text,
  address         text,
  interest        text,
  estimated_value numeric(14,2) DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX agent_customers_agent_idx ON agent_customers (agent_id);
CREATE TRIGGER agent_customers_touch BEFORE UPDATE ON agent_customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 5. Orders
-- =============================================================================
CREATE TABLE orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no          text NOT NULL UNIQUE,           -- ORD-10231
  customer_user_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  agent_id          uuid REFERENCES agents(id) ON DELETE SET NULL,           -- non-null => agent order
  agent_customer_id uuid REFERENCES agent_customers(id) ON DELETE SET NULL,
  customer_name     text NOT NULL,
  customer_email    text NOT NULL,
  customer_phone    text,
  company           text,
  status            order_status   NOT NULL DEFAULT 'Pending',
  payment_status    payment_status NOT NULL DEFAULT 'Unpaid',
  payment_method    payment_method NOT NULL DEFAULT 'COD',
  priority          order_priority NOT NULL DEFAULT 'Normal',
  subtotal          numeric(14,2) NOT NULL DEFAULT 0,
  tax               numeric(14,2) NOT NULL DEFAULT 0,
  shipping_fee      numeric(14,2) NOT NULL DEFAULT 0,
  discount          numeric(14,2) NOT NULL DEFAULT 0,
  total             numeric(14,2) NOT NULL DEFAULT 0,
  shipping_address  text NOT NULL,
  billing_address   text,
  internal_notes    text,
  placed_at         timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_status_placed_idx   ON orders (status, placed_at DESC);
CREATE INDEX orders_agent_placed_idx    ON orders (agent_id, placed_at DESC);
CREATE INDEX orders_customer_idx        ON orders (customer_user_id, placed_at DESC);
CREATE INDEX orders_email_lower_idx     ON orders (lower(customer_email));
CREATE TRIGGER orders_touch BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Snapshots keep historical accuracy when the catalog changes later.
CREATE TABLE order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    uuid REFERENCES products(id) ON DELETE RESTRICT,
  name_snapshot text NOT NULL,
  sku_snapshot  text,
  quantity      int NOT NULL CHECK (quantity > 0),
  list_price    numeric(14,2) NOT NULL,      -- catalog customer price at order time
  unit_price    numeric(14,2) NOT NULL,      -- price actually charged (agent override allowed)
  discount_pct  numeric(5,2)  NOT NULL DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 100),
  line_total    numeric(14,2) NOT NULL
);
CREATE INDEX order_items_order_idx   ON order_items (order_id);
CREATE INDEX order_items_product_idx ON order_items (product_id);

CREATE TABLE order_shipments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier            text NOT NULL,
  tracking_number    text NOT NULL,
  shipped_at         timestamptz,
  estimated_delivery date,
  delivered_at       timestamptz,
  notes              text
);
CREATE INDEX order_shipments_order_idx ON order_shipments (order_id);

CREATE TABLE order_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type       order_event_type NOT NULL,
  message    text NOT NULL,
  actor_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_label text,                          -- e.g. 'Admin', 'Agent — Tarek'
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_idx ON order_events (order_id, created_at);

-- Returns and cancellations share one table, split by `type`.
CREATE TABLE order_requests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no         text NOT NULL UNIQUE,   -- RET-10231 / CAN-10231
  order_id           uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  requester_user_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  requester_email    text NOT NULL,
  type               order_request_type   NOT NULL,
  reason             text NOT NULL,
  status             order_request_status NOT NULL DEFAULT 'Requested',
  resolution_note    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  resolved_at        timestamptz
);
CREATE INDEX order_requests_order_idx  ON order_requests (order_id);
CREATE INDEX order_requests_status_idx ON order_requests (type, status, created_at DESC);
-- Only one open request of each type per order.
CREATE UNIQUE INDEX order_requests_open_uidx
  ON order_requests (order_id, type) WHERE status IN ('Requested','Approved');

CREATE TABLE agent_commissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  base_amount numeric(14,2) NOT NULL,
  pct         numeric(5,2)  NOT NULL,
  amount      numeric(14,2) NOT NULL,
  status      commission_status NOT NULL DEFAULT 'Accrued',
  paid_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, order_id)
);
CREATE INDEX agent_commissions_agent_idx ON agent_commissions (agent_id, status);

-- =============================================================================
-- 6. Quotations (multi-item RFQ)
-- =============================================================================
CREATE TABLE quotations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_no             text NOT NULL UNIQUE,          -- RFQ-2041
  customer_user_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_name      text NOT NULL,
  customer_email     text NOT NULL,
  customer_phone     text,
  company            text,
  message            text NOT NULL DEFAULT '',
  status             quotation_status NOT NULL DEFAULT 'New',
  quoted_total       numeric(14,2),
  valid_until        date,
  payment_terms      text,
  delivery_terms     text,
  assigned_to        uuid REFERENCES users(id) ON DELETE SET NULL,
  internal_notes     text,
  converted_order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quotations_status_created_idx ON quotations (status, created_at DESC);
CREATE INDEX quotations_customer_idx       ON quotations (customer_user_id, created_at DESC);
CREATE INDEX quotations_email_lower_idx    ON quotations (lower(customer_email));
CREATE TRIGGER quotations_touch BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE quotation_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity     int  NOT NULL CHECK (quantity > 0),
  target_price numeric(14,2),
  quoted_price numeric(14,2),
  notes        text
);
CREATE INDEX quotation_items_quotation_idx ON quotation_items (quotation_id);

CREATE TABLE quotation_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  type         quotation_event_type NOT NULL,
  message      text NOT NULL,
  actor_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_label  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quotation_events_quotation_idx ON quotation_events (quotation_id, created_at);

-- =============================================================================
-- 7. Partners & investors
-- =============================================================================
CREATE TABLE partner_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no    text NOT NULL UNIQUE,      -- PRT-XXXX
  source          partner_source NOT NULL DEFAULT 'Public',
  name            text NOT NULL,
  company         text,
  email           text NOT NULL,
  phone           text,
  type            partner_type   NOT NULL,
  passport_number text,
  address         text,
  shop_location   text,
  website         text,
  trade_license   text,
  city_corp_cert  text,
  chamber_cert    text,
  amount          numeric(14,2),
  message         text,
  status          partner_status NOT NULL DEFAULT 'New',
  internal_notes  text,
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX partner_requests_source_status_idx ON partner_requests (source, status, submitted_at DESC);
CREATE TRIGGER partner_requests_touch BEFORE UPDATE ON partner_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE partner_request_files (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES partner_requests(id) ON DELETE CASCADE,
  url        text NOT NULL,
  filename   text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX partner_request_files_request_idx ON partner_request_files (request_id);

-- =============================================================================
-- 8. Careers
-- =============================================================================
CREATE TABLE job_postings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text NOT NULL UNIQUE,
  title            text NOT NULL,
  type             text NOT NULL,            -- 'Commission-based · Field role'
  location         text NOT NULL,
  summary          text NOT NULL DEFAULT '',
  description      text NOT NULL DEFAULT '',
  responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements     jsonb NOT NULL DEFAULT '[]'::jsonb,
  published        boolean NOT NULL DEFAULT false,
  posted_at        timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);
CREATE INDEX job_postings_published_idx ON job_postings (published, posted_at DESC);
CREATE TRIGGER job_postings_touch BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE job_applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid REFERENCES job_postings(id) ON DELETE SET NULL,
  role_applied  text NOT NULL,
  status        application_status NOT NULL DEFAULT 'New',
  name          text NOT NULL,
  email         text NOT NULL,
  phone         text NOT NULL,
  city          text,
  nid           text NOT NULL,                -- National ID, required
  trade_license text,                         -- optional
  experience    text,
  areas         text,
  message       text,
  internal_notes text,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX job_applications_job_status_idx ON job_applications (job_id, status, submitted_at DESC);
CREATE TRIGGER job_applications_touch BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE agents
  ADD CONSTRAINT agents_application_fk
  FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE SET NULL;

CREATE TABLE job_application_files (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  url            text NOT NULL,
  filename       text NOT NULL,
  uploaded_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX job_application_files_app_idx ON job_application_files (application_id);

-- =============================================================================
-- 9. Contact messages
-- =============================================================================
CREATE TABLE contact_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  email        text NOT NULL,
  subject      text NOT NULL,
  message      text NOT NULL,
  status       message_status NOT NULL DEFAULT 'New',
  handled_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contact_messages_status_idx ON contact_messages (status, submitted_at DESC);

-- =============================================================================
-- 10. Session state: carts, wishlist, compare
-- =============================================================================
CREATE TABLE carts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES users(id) ON DELETE CASCADE,
  agent_id          uuid REFERENCES agents(id) ON DELETE CASCADE,          -- agent draft order
  agent_customer_id uuid REFERENCES agent_customers(id) ON DELETE SET NULL,
  session_token     text,                                                  -- guest carts
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR agent_id IS NOT NULL OR session_token IS NOT NULL)
);
CREATE UNIQUE INDEX carts_user_uidx    ON carts (user_id) WHERE agent_id IS NULL AND user_id IS NOT NULL;
CREATE UNIQUE INDEX carts_session_uidx ON carts (session_token) WHERE session_token IS NOT NULL;
CREATE TRIGGER carts_touch BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE cart_items (
  cart_id             uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id          uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity            int  NOT NULL CHECK (quantity > 0),
  unit_price_override numeric(14,2),        -- agent manual price
  discount_pct        numeric(5,2),         -- agent percentage override
  added_at            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cart_id, product_id)
);

CREATE TABLE wishlist_items (
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE compare_items (
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- =============================================================================
-- 11. Convenience views
-- =============================================================================
CREATE VIEW supplier_product_counts AS
SELECT s.id AS supplier_id, s.name, count(p.id) FILTER (WHERE p.deleted_at IS NULL) AS products_count
FROM suppliers s LEFT JOIN products p ON p.supplier_id = s.id
GROUP BY s.id, s.name;

CREATE VIEW agent_performance AS
SELECT a.id AS agent_id,
       a.name,
       count(DISTINCT o.id)                              AS orders_submitted,
       coalesce(sum(o.total), 0)                         AS revenue,
       coalesce(sum(c.amount) FILTER (WHERE c.status <> 'Cancelled'), 0) AS commission_earned
FROM agents a
LEFT JOIN orders o           ON o.agent_id = a.id AND o.status <> 'Cancelled'
LEFT JOIN agent_commissions c ON c.agent_id = a.id
GROUP BY a.id, a.name;

CREATE VIEW customer_registration_daily AS
SELECT date_trunc('day', cp.registered_at)::date AS day, count(*) AS registrations
FROM customer_profiles cp
GROUP BY 1 ORDER BY 1;
