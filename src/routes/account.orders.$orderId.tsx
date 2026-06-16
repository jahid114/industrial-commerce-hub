import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Download, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { generateInvoice } from "@/lib/pdf";

export const Route = createFileRoute("/account/orders/$orderId")({
  head: () => ({ meta: [{ title: "Order Detail — MegaHaus" }] }),
  component: OrderDetail,
});

const timeline = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"] as const;

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { orders } = useStore();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw notFound();

  const currentStep = timeline.indexOf(order.status as typeof timeline[number]);

  return (
    <div className="space-y-4">
      <Link to="/account/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4 mr-1" /> Back to orders</Link>

      <div className="border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 className="font-display text-2xl font-bold">Order {order.id}</h2>
            <p className="text-sm text-muted-foreground">Placed on {formatDate(order.date)}</p>
          </div>
          <Button onClick={() => generateInvoice(order)}><Download className="size-4 mr-2" /> Download Invoice</Button>
        </div>

        {order.status !== "Cancelled" && (
          <div className="border-b border-border p-5">
            <h3 className="font-semibold mb-4">Order Tracking</h3>
            <div className="flex items-center justify-between">
              {timeline.map((step, i) => (
                <div key={step} className="flex flex-1 items-center">
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${i <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {i <= currentStep ? <Check className="size-4" /> : <Circle className="size-3" />}
                  </div>
                  <div className="ml-2 flex-1">
                    <div className={`text-xs font-semibold ${i <= currentStep ? "" : "text-muted-foreground"}`}>{step}</div>
                  </div>
                  {i < timeline.length - 1 && <div className={`h-0.5 flex-1 ${i < currentStep ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 p-5 md:grid-cols-2">
          <div>
            <h3 className="font-semibold mb-2">Shipping Address</h3>
            <p className="text-sm text-muted-foreground">{order.customerName}<br />{order.shippingAddress}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Payment</h3>
            <p className="text-sm text-muted-foreground">{order.paymentMethod}<br />Status: <span className="text-success font-medium">{order.status === "Cancelled" ? "Refunded" : "Confirmed"}</span></p>
          </div>
        </div>

        <div className="border-t border-border">
          <table className="w-full text-sm">
            <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3 text-left">Product</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Unit Price</th><th className="px-4 py-3 text-right">Subtotal</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {order.items.map((it) => (
                <tr key={it.productId}>
                  <td className="px-4 py-3">{it.name}</td>
                  <td className="px-4 py-3 text-right">{it.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatBDT(it.unitPrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatBDT(it.unitPrice * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-spec">
              <tr><td colSpan={3} className="px-4 py-3 text-right font-semibold">Total</td><td className="px-4 py-3 text-right font-display text-lg font-bold text-primary">{formatBDT(order.total)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
