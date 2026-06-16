import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, FileText, Heart, ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";

export const Route = createFileRoute("/account/")({
  head: () => ({ meta: [{ title: "Account Overview — MegaHaus" }] }),
  component: AccountIndex,
});

function AccountIndex() {
  const { orders, quotations, wishlist, cart, user } = useStore();
  const myOrders = orders.filter((o) => o.customerEmail === user?.email);
  const myQuotations = quotations.filter((q) => q.customerEmail === user?.email);

  const stats = [
    { label: "My Orders", value: myOrders.length, icon: Package, color: "bg-primary", to: "/account/orders" as const },
    { label: "Quotations", value: myQuotations.length, icon: FileText, color: "bg-accent", to: "/account/quotations" as const },
    { label: "Wishlist", value: wishlist.length, icon: Heart, color: "bg-industrial", to: "/account/wishlist" as const },
    { label: "Cart Items", value: cart.reduce((s, i) => s + i.quantity, 0), icon: ShoppingCart, color: "bg-success", to: "/cart" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="border border-border bg-card p-5 hover:border-primary transition-colors">
            <div className={`flex size-10 items-center justify-center ${s.color} text-white`}><s.icon className="size-5" /></div>
            <div className="mt-4 font-display text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-display text-lg font-bold">Recent Orders</h2>
          <Link to="/account/orders" className="text-sm font-medium text-primary hover:underline">View all →</Link>
        </div>
        {myOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No orders yet. <Link to="/products" className="text-primary hover:underline">Browse products</Link></div>
        ) : (
          <div className="divide-y divide-border">
            {myOrders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between p-4 text-sm hover:bg-secondary">
                <div>
                  <div className="font-semibold">{o.id}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(o.date)} · {o.items.length} items</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-primary">{formatBDT(o.total)}</div>
                  <div className="text-xs text-muted-foreground">{o.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
