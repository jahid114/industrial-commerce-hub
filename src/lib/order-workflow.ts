import type { Order, OrderStatus, PaymentStatus, FulfillmentStatus, OrderEvent } from "@/data/types";

export const ORDER_STAGES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
];

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "On Hold",
  "Cancelled",
];

export const PAYMENT_STATUSES: PaymentStatus[] = ["Unpaid", "Partial", "Paid", "Refunded"];
export const FULFILLMENT_STATUSES: FulfillmentStatus[] = [
  "Unfulfilled",
  "Picking",
  "Packed",
  "Shipped",
  "Delivered",
];

// Derive sensible defaults from legacy orders that only store `status`.
export function derivePaymentStatus(order: Order): PaymentStatus {
  if (order.paymentStatus) return order.paymentStatus;
  if (order.status === "Cancelled") return "Refunded";
  if (order.status === "Delivered") return "Paid";
  if (order.status === "Shipped") return "Paid";
  if (order.status === "Processing" || order.status === "Confirmed")
    return order.paymentMethod === "COD" ? "Unpaid" : "Paid";
  return "Unpaid";
}

export function deriveFulfillmentStatus(order: Order): FulfillmentStatus {
  if (order.fulfillmentStatus) return order.fulfillmentStatus;
  switch (order.status) {
    case "Delivered":
      return "Delivered";
    case "Shipped":
      return "Shipped";
    case "Processing":
      return "Picking";
    default:
      return "Unfulfilled";
  }
}

export interface StageInfo {
  key: OrderStatus;
  label: string;
  description: string;
}

export const STAGE_INFO: StageInfo[] = [
  { key: "Pending", label: "Pending", description: "Order placed, awaiting review" },
  { key: "Confirmed", label: "Confirmed", description: "Order verified & accepted" },
  { key: "Processing", label: "Processing", description: "Picking & packing in warehouse" },
  { key: "Shipped", label: "Shipped", description: "Dispatched to carrier" },
  { key: "Delivered", label: "Delivered", description: "Received by customer" },
];

export function currentStageIndex(status: OrderStatus): number {
  const idx = ORDER_STAGES.indexOf(status);
  return idx < 0 ? -1 : idx;
}

// Given current order status, compute next-action button.
export function nextActionFor(status: OrderStatus): { next: OrderStatus; label: string } | null {
  switch (status) {
    case "Pending":
      return { next: "Confirmed", label: "Confirm Order" };
    case "Confirmed":
      return { next: "Processing", label: "Start Processing" };
    case "Processing":
      return { next: "Shipped", label: "Mark as Shipped" };
    case "Shipped":
      return { next: "Delivered", label: "Mark as Delivered" };
    default:
      return null;
  }
}

export function computeSubtotal(order: Order): number {
  if (typeof order.subtotal === "number") return order.subtotal;
  return order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
}

export function computeTax(order: Order): number {
  if (typeof order.tax === "number") return order.tax;
  // Bangladesh 5% VAT default for demo purposes.
  return Math.round(computeSubtotal(order) * 0.05);
}

export function computeShipping(order: Order): number {
  if (typeof order.shippingFee === "number") return order.shippingFee;
  return 0;
}

export function computeDiscount(order: Order): number {
  return order.discount ?? 0;
}

export function appendEvent(order: Order, event: OrderEvent): OrderEvent[] {
  return [...(order.timeline ?? []), event];
}

export function nowIso(): string {
  return new Date().toISOString();
}
