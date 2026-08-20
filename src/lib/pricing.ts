import type { Product, Role } from "@/data/types";
import { useStore } from "@/lib/store";
import { useDirectory } from "@/lib/directory-store";

export const DEFAULT_AGENT_COMMISSION_PCT = 8;

type Priced = Pick<Product, "price" | "agentPrice"> & { discountPct?: number };

/** Admin-configured discount percentage on a product (0 when none). */
export function getDiscountPct(p: Priced): number {
  return Math.min(90, Math.max(0, p.discountPct ?? 0));
}

export function hasDiscount(p: Priced): boolean {
  return getDiscountPct(p) > 0;
}

/** Customer-facing price after the admin discount. */
export function getEffectivePrice(p: Priced): number {
  const pct = getDiscountPct(p);
  return pct > 0 ? Math.round(p.price * (1 - pct / 100)) : p.price;
}

/** Compute the agent price for a product given a commission percentage. */
export function getAgentPrice(
  p: Priced,
  commissionPct: number = DEFAULT_AGENT_COMMISSION_PCT,
): number {
  const pct = Math.min(100, Math.max(0, commissionPct));
  return Math.round(getEffectivePrice(p) * (1 - pct / 100));
}

/** Resolve the unit price a given role should pay/see. */
export function priceFor(
  role: Role | undefined,
  p: Priced,
  commissionPct?: number,
): number {
  if (role === "agent") return getAgentPrice(p, commissionPct);
  return getEffectivePrice(p);
}

/** Agent pricing is visible only inside the agent portal and admin views — never on the public site. */
export function canSeeAgentPrice(role: Role | undefined): boolean {
  return role === "agent" || role === "admin";
}

/** Hook: resolves the commission percentage of the currently logged-in agent, or the default. */
export function useCurrentAgentCommission(): number {
  const { user } = useStore();
  const { agents } = useDirectory();
  if (!user?.email) return DEFAULT_AGENT_COMMISSION_PCT;
  const match = agents.find((a) => a.email.toLowerCase() === user.email.toLowerCase());
  return match?.commissionPct ?? DEFAULT_AGENT_COMMISSION_PCT;
}
