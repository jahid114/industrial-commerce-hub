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
  productsCount: number;
  rating: number;
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


export type QuotationStatus = "Open" | "Quoted" | "Accepted" | "Closed";

export interface Quotation {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  company?: string;
  quantity: number;
  message: string;
  date: string;
  status: QuotationStatus;
  quotedPrice?: number;
}

export type Role = "guest" | "customer" | "admin" | "agent" | "partner";
