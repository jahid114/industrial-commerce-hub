import type { Product } from "@/data/types";
import type { Role } from "@/data/types";

/** Returns the explicit agent price or an 8% discounted fallback. */
export function getAgentPrice(p: Pick<Product, "price" | "agentPrice">): number {
  return p.agentPrice ?? Math.round(p.price * 0.92);
}

/** Resolve the unit price a given role should pay/see. */
export function priceFor(role: Role | undefined, p: Pick<Product, "price" | "agentPrice">): number {
  if (role === "agent") return getAgentPrice(p);
  return p.price;
}

/** Should we surface the agent price in the UI? */
export function canSeeAgentPrice(role: Role | undefined): boolean {
  return role === "agent" || role === "admin";
}
