import type { Product, Role } from "@/data/types";
import { useStore } from "@/lib/store";
import { useDirectory } from "@/lib/directory-store";

export const DEFAULT_AGENT_COMMISSION_PCT = 8;

/** Compute the agent price for a product given a commission percentage. */
export function getAgentPrice(
  p: Pick<Product, "price" | "agentPrice">,
  commissionPct: number = DEFAULT_AGENT_COMMISSION_PCT,
): number {
  const pct = Math.min(100, Math.max(0, commissionPct));
  return Math.round(p.price * (1 - pct / 100));
}

/** Resolve the unit price a given role should pay/see. */
export function priceFor(
  role: Role | undefined,
  p: Pick<Product, "price" | "agentPrice">,
  commissionPct?: number,
): number {
  if (role === "agent") return getAgentPrice(p, commissionPct);
  return p.price;
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
