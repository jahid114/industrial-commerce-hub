import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

// Legacy /account/* — redirect to appropriate portal by role.
export const Route = createFileRoute("/account")({
  component: AccountLayout,
});

function AccountLayout() {
  const { isAuthenticated, isAdmin, isAgent, isPartner } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/auth/login" });
    else if (isAdmin) navigate({ to: "/admin" });
    else if (isAgent || isPartner) navigate({ to: "/portal" });
    else navigate({ to: "/portal-customer" });
  }, [isAuthenticated, isAdmin, isAgent, isPartner, navigate]);

  return null;
}
