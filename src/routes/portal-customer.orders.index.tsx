import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { generateInvoice } from "@/lib/pdf";
import { ORDER_REQUEST_STATUS_COLOR, useOrderRequests, type OrderRequest } from "@/lib/order-requests";
import type { OrderStatus } from "@/data/types";

export const Route = createFileRoute("/portal-customer/orders/")({
  head: () => ({ meta: [{ title: "My Orders — Portal" }] }),
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
  const requests = useOrderRequests(user?.email);
  const returns = requests.filter((r) => r.type === "return");
  const cancellations = requests.filter((r) => r.type === "cancellation");

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="font-display text-xl font-bold">My Orders</h2>
        <p className="text-sm text-muted-foreground">{myOrders.length} orders</p>
      </div>

      <Tabs defaultValue="orders" className="p-5">
        <TabsList>
          <TabsTrigger value="orders">Orders ({myOrders.length})</TabsTrigger>
          <TabsTrigger value="returns">Returns ({returns.length})</TabsTrigger>
          <TabsTrigger value="cancellations">Cancellation ({cancellations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          {myOrders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No orders yet. <Link to="/portal-customer/catalog" className="text-primary hover:underline">Start shopping</Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
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
                      <td className="px-4 py-3"><Link to="/portal-customer/orders/$orderId" params={{ orderId: o.id }} className="font-semibold hover:text-primary">{o.id}</Link></td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(o.date)}</td>
                      <td className="px-4 py-3">{o.items.length} items</td>
                      <td className="px-4 py-3"><Badge className={statusVariant[o.status]}>{o.status}</Badge></td>
                      <td className="px-4 py-3 text-right font-display font-bold text-primary">{formatBDT(o.total)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" asChild className="mr-2">
                          <Link to="/portal-customer/orders/$orderId" params={{ orderId: o.id }}><Eye className="size-3 mr-1" /> View</Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => generateInvoice(o)}><Download className="size-3 mr-1" /> PDF</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="returns" className="mt-4">
          <RequestTable
            rows={returns}
            emptyText="No return requests. Open a delivered order and choose “Request Return”."
          />
        </TabsContent>

        <TabsContent value="cancellations" className="mt-4">
          <RequestTable
            rows={cancellations}
            emptyText="No cancelled orders. You can cancel an order from its details page."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RequestTable({ rows, emptyText }: { rows: OrderRequest[]; emptyText: string }) {
  if (rows.length === 0) {
    return <div className="p-12 text-center text-muted-foreground">{emptyText}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Reference</th>
            <th className="px-4 py-3 text-left">Order</th>
            <th className="px-4 py-3 text-left">Requested</th>
            <th className="px-4 py-3 text-left">Reason</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Order total</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-secondary">
              <td className="px-4 py-3 font-semibold">{r.id}</td>
              <td className="px-4 py-3">{r.orderId}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(r.createdAt)}</td>
              <td className="px-4 py-3"><div className="max-w-[320px] whitespace-pre-wrap">{r.reason}</div></td>
              <td className="px-4 py-3"><Badge className={ORDER_REQUEST_STATUS_COLOR[r.status]}>{r.status}</Badge></td>
              <td className="px-4 py-3 text-right font-semibold">{r.orderTotal ? formatBDT(r.orderTotal) : "—"}</td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/portal-customer/orders/$orderId" params={{ orderId: r.orderId }}><Eye className="size-3 mr-1" /> View order</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
