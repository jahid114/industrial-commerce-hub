import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { orders } from "@/data/orders";
import { formatBDT, formatDate } from "@/lib/format";

export const Route = createFileRoute("/portal/orders")({
  component: PortalOrdersPage,
});

function PortalOrdersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">My Orders</h1>
        <p className="text-sm text-muted-foreground">Orders you have placed on behalf of customers.</p>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                <td className="px-4 py-3">{formatDate(o.date)}</td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3"><Badge variant="outline">{o.status}</Badge></td>
                <td className="px-4 py-3 text-right">{formatBDT(o.total)}</td>
                <td className="px-4 py-3 text-right font-semibold text-success">{formatBDT(Math.round(o.total * 0.04))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
