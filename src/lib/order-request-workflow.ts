import type { OrderRequestStatus, OrderRequestType } from "@/lib/order-requests";

/** Happy-path stages per request type (mirrors the convention in order-workflow.ts / quotation-workflow.ts). */
export const RETURN_REQUEST_STAGES: OrderRequestStatus[] = ["Requested", "Approved", "Completed"];
export const CANCELLATION_REQUEST_STAGES: OrderRequestStatus[] = ["Requested", "Completed"];

export function stagesFor(type: OrderRequestType): OrderRequestStatus[] {
  return type === "return" ? RETURN_REQUEST_STAGES : CANCELLATION_REQUEST_STAGES;
}

export function requestStageIndex(type: OrderRequestType, status: OrderRequestStatus): number {
  return stagesFor(type).indexOf(status);
}

/** Single-step guarded transition, like nextActionFor() for orders. */
export function nextRequestAction(
  type: OrderRequestType,
  status: OrderRequestStatus,
): { next: OrderRequestStatus; label: string } | null {
  if (type === "return") {
    switch (status) {
      case "Requested":
        return { next: "Approved", label: "Approve Return" };
      case "Approved":
        // Completing a return = goods logged as received; grading (restock/damage) continues in Inventory.
        return { next: "Completed", label: "Mark Received" };
      default:
        return null; // Completed/Rejected are terminal
    }
  }
  switch (status) {
    case "Requested":
      return { next: "Completed", label: "Approve Cancellation" };
    default:
      return null;
  }
}

/** Reject is a side-action, not part of the single-step forward chain, so it's modeled separately. */
export function canRejectRequest(type: OrderRequestType, status: OrderRequestStatus): boolean {
  if (type === "return") return status === "Requested" || status === "Approved";
  return status === "Requested";
}

export const RETURN_RESOLUTION_ACTIONS: ReadonlyArray<{
  action: "restock" | "damage" | "scrap";
  label: string;
}> = [
  { action: "restock", label: "Restock" },
  { action: "damage", label: "Mark Damaged" },
  { action: "scrap", label: "Scrap" },
];

/** A Received return forks into three grading outcomes instead of one single next step. */
export function returnResolutionActions(type: OrderRequestType, status: OrderRequestStatus) {
  return type === "return" && status === "Received" ? RETURN_RESOLUTION_ACTIONS : [];
}

export function isTerminalRequest(status: OrderRequestStatus): boolean {
  return status === "Completed" || status === "Rejected";
}
