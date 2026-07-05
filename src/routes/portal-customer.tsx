import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CustomerPortalShell } from "@/components/layout/CustomerPortalShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/portal-customer")({
  head: () => ({ meta: [{ title: "Customer Portal — MegaHaus" }] }),
  component: PortalCustomerLayout,
});

function PortalCustomerLayout() {
  const { isAuthenticated, isAdmin, isAgent, isPartner } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/auth/login" });
    else if (isAdmin) navigate({ to: "/admin" });
    else if (isAgent || isPartner) navigate({ to: "/portal" });
  }, [isAuthenticated, isAdmin, isAgent, isPartner, navigate]);

  if (!isAuthenticated || isAdmin || isAgent || isPartner) return null;

  return (
    <CustomerPortalShell>
      <Outlet />
    </CustomerPortalShell>
  );
}
