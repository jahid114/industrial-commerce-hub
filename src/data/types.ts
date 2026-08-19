export type Country = "Germany" | "Japan" | "China" | "USA" | "Italy" | "Switzerland";

export interface Brand {
  id: string;
  name: string;
  country: Country;
  logoText: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories: string[];
  description: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  country: Country;
  price: number; // BDT — customer price
  agentPrice?: number; // BDT — agent-only price (admin/agent visible). Defaults to ~8% off customer price.
  moq: number;
  deliveryDays: string;
  image: string;
  gallery: string[];
  shortDescription: string;
  description: string;
  specs: ProductSpec[];
  supplierId: string;
  featured?: boolean;
  tags?: string[];
  slug?: string;
  subcategory?: string;
  stock: number;
  sku: string;
}

export interface Supplier {
  id: string;
  name: string;
  country: Country;
  contactName: string;
  email: string;
  phone: string;
  productsCount: number;
  since: string;
}

export interface Agent {
  id: string;
  name: string;
  area: string;
  phone: string;
  email: string;
  joined: string;
  ordersSubmitted: number;
  commissionEarned: number;
  /** Discount percentage from customer price this agent gets as their price. Defaults to 8. */
  commissionPct?: number;
  status: "Active" | "Pending" | "Suspended";
}

export type OrderStatus = "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "On Hold";

export type PaymentStatus = "Unpaid" | "Partial" | "Paid" | "Refunded";

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  sku?: string;
}

export interface OrderEvent {
  at: string; // ISO timestamp
  by: string; // user/role
  type: "status" | "payment" | "fulfillment" | "note" | "created";
  message: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  date: string;
  items: OrderItem[];
  subtotal?: number;
  tax?: number;
  shippingFee?: number;
  discount?: number;
  total: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod: "COD" | "Bank Transfer" | "bKash" | "Nagad";
  shippingAddress: string;
  billingAddress?: string;
  agentId?: string;
  priority?: "Low" | "Normal" | "High" | "Urgent";
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  internalNotes?: string;
  timeline?: OrderEvent[];
}


export type QuotationStatus =
  | "New"
  | "Under Review"
  | "Sourcing"
  | "Quoted"
  | "Negotiating"
  | "Accepted"
  | "Rejected"
  | "Expired"
  | "Converted";

export interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  targetPrice?: number;
  quotedPrice?: number;
  notes?: string;
}

export interface QuotationEvent {
  at: string;
  by: string;
  type: "status" | "note" | "quote" | "created" | "conversion";
  message: string;
}

export interface Quotation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  company?: string;
  date: string;
  items: QuotationItem[];
  message: string;
  status: QuotationStatus;
  quotedTotal?: number;
  validUntil?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  assignedTo?: string;
  internalNotes?: string;
  timeline?: QuotationEvent[];
  convertedOrderId?: string;
}

export type Role = "guest" | "customer" | "admin" | "agent" | "partner";
