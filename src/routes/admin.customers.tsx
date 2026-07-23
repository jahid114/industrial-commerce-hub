import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { CustomersProvider } from "@/lib/customers-store";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersLayout,
});

function CustomersLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/admin/customers", label: "Customers", exact: true },
    { to: "/admin/customers/statistics", label: "Statistics" },
  ];
  return (
    <CustomersProvider>
      <div className="space-y-6">
        <div className="flex gap-1 border-b border-border">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <Outlet />
      </div>
    </CustomersProvider>
  );
}
