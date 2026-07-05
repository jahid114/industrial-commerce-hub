import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, FileText, Heart, ShoppingCart, ShoppingBag, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";

export const Route = createFileRoute("/portal-customer/")({
  head: () => ({ meta: [{ title: "Dashboard — Customer Portal" }] }),
  component: PortalCustomerDashboard,
});

function PortalCustomerDashboard() {
  const { orders, quotations, wishlist, cart, user } = useStore();
  const myOrders = orders.filter((o) => o.customerEmail === user?.email);
  const myQuotations = quotations.filter((q) => q.customerEmail === user?.email);

  const stats = [
    { label: "My Orders", value: myOrders.length, icon: ShoppingBag, color: "bg-primary", to: "/portal-customer/orders" as const },
    { label: "Quotations", value: myQuotations.length, icon: FileText, color: "bg-accent", to: "/portal-customer/quotations" as const },
    { label: "Wishlist", value: wishlist.length, icon: Heart, color: "bg-industrial", to: "/portal-customer/wishlist" as const },
    { label: "Cart Items", value: cart.reduce((s, i) => s + i.quantity, 0), icon: ShoppingCart, color: "bg-success", to: "/portal-customer/cart" as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Your private catalog, orders and account tools live here.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="rounded-lg border border-border bg-card p-5 hover:border-primary transition-colors">
            <div className={`flex size-10 items-center justify-center ${s.color} text-white`}><s.icon className="size-5" /></div>
            <div className="mt-4 font-display text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link to="/portal-customer/catalog" className="group rounded-lg border border-border bg-card p-5 hover:border-primary">
          <Package className="size-6 text-primary" />
          <div className="mt-3 font-display text-lg font-bold group-hover:text-primary">Browse Full Catalog</div>
          <p className="mt-1 text-sm text-muted-foreground">Access the complete product catalog — including items not shown publicly.</p>
        </Link>
        <Link to="/portal-customer/cart" className="group rounded-lg border border-border bg-card p-5 hover:border-primary">
          <ShoppingCart className="size-6 text-primary" />
          <div className="mt-3 font-display text-lg font-bold group-hover:text-primary">Go to Cart</div>
          <p className="mt-1 text-sm text-muted-foreground">Review saved items and checkout securely.</p>
        </Link>
        <Link to="/portal-customer/quotations" className="group rounded-lg border border-border bg-card p-5 hover:border-primary">
          <FileText className="size-6 text-primary" />
          <div className="mt-3 font-display text-lg font-bold group-hover:text-primary">Request Quotations</div>
          <p className="mt-1 text-sm text-muted-foreground">Get pricing on bulk orders and custom sourcing.</p>
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-display text-lg font-bold">Recent Orders</h2>
          <Link to="/portal-customer/orders" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">View all <ArrowRight className="size-3" /></Link>
        </div>
        {myOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No orders yet. <Link to="/portal-customer/catalog" className="text-primary hover:underline">Browse products</Link></div>
        ) : (
          <div className="divide-y divide-border">
            {myOrders.slice(0, 5).map((o) => (
              <Link key={o.id} to="/portal-customer/orders/$orderId" params={{ orderId: o.id }} className="flex items-center justify-between p-4 text-sm hover:bg-secondary">
                <div>
                  <div className="font-semibold">{o.id}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(o.date)} · {o.items.length} items</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-primary">{formatBDT(o.total)}</div>
                  <div className="text-xs text-muted-foreground">{o.status}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
