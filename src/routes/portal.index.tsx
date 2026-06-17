import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, ShoppingBag, Wallet, Users, FileText, BarChart3, Briefcase, Package } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatBDT } from "@/lib/format";
import { agents } from "@/data/agents";
import { orders } from "@/data/orders";

export const Route = createFileRoute("/portal/")({
  component: PortalDashboard,
});

function PortalDashboard() {
  const { isAgent, isPartner, user } = useStore();

  if (isAgent) {
    const me = agents[0];
    const stats = [
      { label: "Commission MTD", value: formatBDT(me.commissionEarned), Icon: Wallet, trend: "+12% vs last month" },
      { label: "Orders Submitted", value: me.ordersSubmitted.toString(), Icon: ShoppingBag, trend: "5 this week" },
      { label: "Open Leads", value: "8", Icon: Users, trend: "3 hot" },
      { label: "Conversion", value: "34%", Icon: TrendingUp, trend: "+4 pts" },
    ];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome, {user?.name?.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{me.area} · Joined {new Date(me.joined).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.Icon className="size-4 text-primary" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold">{s.value}</div>
              <div className="mt-1 text-xs text-success">{s.trend}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Link to="/portal/catalog" className="group rounded-lg border border-border bg-card p-5 hover:border-primary">
            <Package className="size-6 text-primary" />
            <div className="mt-3 font-display text-lg font-bold group-hover:text-primary">Browse Agent Catalog</div>
            <p className="mt-1 text-sm text-muted-foreground">See exclusive agent pricing and place orders for your customers.</p>
          </Link>
          <Link to="/portal/leads" className="group rounded-lg border border-border bg-card p-5 hover:border-primary">
            <Users className="size-6 text-primary" />
            <div className="mt-3 font-display text-lg font-bold group-hover:text-primary">Manage Leads</div>
            <p className="mt-1 text-sm text-muted-foreground">Convert open inquiries into shipped orders.</p>
          </Link>
          <Link to="/portal/commissions" className="group rounded-lg border border-border bg-card p-5 hover:border-primary">
            <Wallet className="size-6 text-primary" />
            <div className="mt-3 font-display text-lg font-bold group-hover:text-primary">Commission Ledger</div>
            <p className="mt-1 text-sm text-muted-foreground">Track payouts via bKash, Nagad and bank.</p>
          </Link>
        </div>
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4"><h2 className="font-display text-lg font-bold">Recent Orders</h2></div>
          <table className="w-full text-sm">
            <thead className="bg-spec text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-2 text-left">Order</th><th className="px-4 py-2 text-left">Customer</th><th className="px-4 py-2 text-right">Total</th><th className="px-4 py-2 text-right">Commission</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-2 font-mono text-xs">{o.id}</td>
                  <td className="px-4 py-2">{o.customerName}</td>
                  <td className="px-4 py-2 text-right">{formatBDT(o.total)}</td>
                  <td className="px-4 py-2 text-right font-semibold text-success">{formatBDT(Math.round(o.total * 0.04))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isPartner) {
    const stats = [
      { label: "Quarterly GMV", value: "৳ 4.82 Cr", Icon: TrendingUp, trend: "+38% YoY" },
      { label: "Active Customers", value: "1,284", Icon: Users, trend: "+162 QoQ" },
      { label: "Avg Order Value", value: formatBDT(86500), Icon: ShoppingBag, trend: "+9%" },
      { label: "Open Inquiries", value: "12", Icon: Briefcase, trend: "3 in DD" },
    ];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome, {user?.name?.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">Partner & Investor Portal — Q2 2026 review</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.Icon className="size-4 text-primary" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold">{s.value}</div>
              <div className="mt-1 text-xs text-success">{s.trend}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Link to="/portal/kpis" className="group rounded-lg border border-border bg-card p-5 hover:border-primary">
            <BarChart3 className="size-6 text-primary" />
            <div className="mt-3 font-display text-lg font-bold group-hover:text-primary">Live KPIs</div>
            <p className="mt-1 text-sm text-muted-foreground">Marketplace health — GMV, retention, supplier mix.</p>
          </Link>
          <Link to="/portal/documents" className="group rounded-lg border border-border bg-card p-5 hover:border-primary">
            <FileText className="size-6 text-primary" />
            <div className="mt-3 font-display text-lg font-bold group-hover:text-primary">Deal Room</div>
            <p className="mt-1 text-sm text-muted-foreground">Pitch deck, financial model, cap table and SHA drafts.</p>
          </Link>
          <Link to="/portal/inquiries" className="group rounded-lg border border-border bg-card p-5 hover:border-primary">
            <Briefcase className="size-6 text-primary" />
            <div className="mt-3 font-display text-lg font-bold group-hover:text-primary">Open Inquiries</div>
            <p className="mt-1 text-sm text-muted-foreground">Submit partnership and investment proposals.</p>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
