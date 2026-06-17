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

export type OrderStatus = "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: "COD" | "Bank Transfer" | "bKash" | "Nagad";
  shippingAddress: string;
  agentId?: string;
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
