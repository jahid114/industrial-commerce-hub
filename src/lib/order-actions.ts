import { appendEvent, derivePaymentStatus, nowIso } from "@/lib/order-workflow";
import type { Order, OrderEvent } from "@/data/types";

/**
 * Shared cancellation logic, used both by the admin's direct "Cancel Order" button and by the
 * Cancellation Request workflow's "Approve" action.
 * Callers are responsible for dispatching the returned patch and calling inventory.releaseReservation(order).
 */
export function cancelOrder(
  order: Order,
  { actor, reason }: { actor: string; reason?: string },
): { patch: Partial<Order>; event: OrderEvent } {
  const paymentStatus = derivePaymentStatus(order);
  const message = reason ? `Order cancelled: ${reason}` : "Order cancelled";
  const event: OrderEvent = { at: nowIso(), by: actor, type: "status", message };
  const timeline = appendEvent(order, event);
  const patch: Partial<Order> = {
    status: "Cancelled",
    // Stays Paid until an admin completes the customer's refund request (see refund-requests.ts).
    paymentStatus,
    timeline,
  };
  return { patch, event };
}
