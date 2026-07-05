import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { generateInvoice } from "@/lib/pdf";
import type { OrderStatus } from "@/data/types";

export const Route = createFileRoute("/account/orders")({
  head: () => ({ meta: [{ title: "My Orders — MegaHaus" }] }),
  component: OrdersPage,
});

const statusVariant: Record<OrderStatus, string> = {
  Pending: "bg-muted text-muted-foreground",
  Confirmed: "bg-accent/20 text-accent-foreground",
  Processing: "bg-blue-100 text-blue-800",
  Shipped: "bg-primary text-primary-foreground",
  Delivered: "bg-success/20 text-success",
  Cancelled: "bg-destructive/10 text-destructive",
  "On Hold": "bg-amber-100 text-amber-800",
};

function OrdersPage() {
  const { orders, user } = useStore();
  const myOrders = orders.filter((o) => o.customerEmail === user?.email);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="font-display text-xl font-bold">Order History</h2>
        <p className="text-sm text-muted-foreground">{myOrders.length} orders</p>
      </div>
      {myOrders.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">No orders yet. <Link to="/products" className="text-primary hover:underline">Start shopping</Link></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Order ID</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myOrders.map((o) => (
                <tr key={o.id} className="hover:bg-secondary">
                  <td className="px-4 py-3"><Link to="/account/orders/$orderId" params={{ orderId: o.id }} className="font-semibold hover:text-primary">{o.id}</Link></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(o.date)}</td>
                  <td className="px-4 py-3">{o.items.length} items</td>
                  <td className="px-4 py-3"><Badge className={statusVariant[o.status]}>{o.status}</Badge></td>
                  <td className="px-4 py-3 text-right font-display font-bold text-primary">{formatBDT(o.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => generateInvoice(o)}><Download className="size-3 mr-1" /> PDF</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
