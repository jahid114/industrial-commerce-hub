import { Check, Circle, Clock, Package, CreditCard, MapPin, User as UserIcon, Truck, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { formatBDT, formatDate } from "@/lib/format";
import {
  STAGE_INFO,
  currentStageIndex,
  derivePaymentStatus,
  computeSubtotal,
  computeTax,
} from "@/lib/order-workflow";
import type { Order, OrderStatus, PaymentStatus, OrderEvent } from "@/data/types";

const statusColor: Record<OrderStatus, string> = {
  Pending: "bg-muted text-muted-foreground",
  Confirmed: "bg-accent/20 text-accent-foreground",
  Processing: "bg-blue-100 text-blue-800",
  Shipped: "bg-primary text-primary-foreground",
  Delivered: "bg-success/20 text-success",
  Cancelled: "bg-destructive/10 text-destructive",
  "On Hold": "bg-amber-100 text-amber-800",
};

const paymentColor: Record<PaymentStatus, string> = {
  Unpaid: "bg-destructive/10 text-destructive",
  Partial: "bg-amber-100 text-amber-800",
  Paid: "bg-success/20 text-success",
  Refunded: "bg-muted text-muted-foreground",
};

interface Props {
  order: Order | null;
  onOpenChange: (v: boolean) => void;
}

export function OrderDetailDialog({ order, onOpenChange }: Props) {
  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl inline-flex items-center gap-3">
            <span>Order {order?.id}</span>
            {order && <Badge className={statusColor[order.status]}>{order.status}</Badge>}
            {order && (
              <Badge className={paymentColor[derivePaymentStatus(order)]} variant="outline">
                <CreditCard className="size-3 mr-1" /> {derivePaymentStatus(order)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {order && <>Placed {formatDate(order.date)} · Payment via {order.paymentMethod}</>}
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-5">
            <ProcessTimeline order={order} />

            <div className="grid gap-3 md:grid-cols-2">
              <InfoCard icon={<UserIcon className="size-4 text-primary" />} title="Customer">
                <div className="font-medium">{order.customerName}</div>
                {order.customerEmail && <div className="text-xs text-muted-foreground">{order.customerEmail}</div>}
                {order.customerPhone && <div className="text-xs text-muted-foreground">{order.customerPhone}</div>}
              </InfoCard>
              <InfoCard icon={<MapPin className="size-4 text-primary" />} title="Delivery">
                <div className="text-sm">{order.shippingAddress}</div>
              </InfoCard>
              {(order.carrier || order.trackingNumber) && (
                <InfoCard icon={<Truck className="size-4 text-primary" />} title="Shipping">
                  {order.carrier && <div><span className="text-xs text-muted-foreground">Carrier: </span>{order.carrier}</div>}
                  {order.trackingNumber && <div><span className="text-xs text-muted-foreground">Tracking: </span><span className="font-mono">{order.trackingNumber}</span></div>}
                  {order.estimatedDelivery && <div className="text-xs text-muted-foreground">ETA {formatDate(order.estimatedDelivery)}</div>}
                </InfoCard>
              )}
              {order.internalNotes && (
                <InfoCard icon={<StickyNote className="size-4 text-primary" />} title="Notes">
                  <div className="text-sm whitespace-pre-wrap">{order.internalNotes}</div>
                </InfoCard>
              )}
            </div>

            <LineItems order={order} />
            <ActivityLog events={order.timeline ?? []} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="mb-1.5 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">{icon} {title}</div>
      <div>{children}</div>
    </div>
  );
}

function ProcessTimeline({ order }: { order: Order }) {
  if (order.status === "Cancelled") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        This order was cancelled.
      </div>
    );
  }
  const stageIdx = currentStageIndex(order.status);
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Order Progress</h3>
        {order.status === "On Hold" && <Badge className="bg-amber-100 text-amber-800">On Hold</Badge>}
      </div>
      <div className="flex items-start">
        {STAGE_INFO.map((stage, i) => {
          const done = i <= stageIdx;
          const active = i === stageIdx;
          return (
            <div key={stage.key} className="flex flex-1 items-start">
              <div className="flex flex-col items-center">
                <div className={`flex size-8 items-center justify-center rounded-full border-2 ${done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground"} ${active ? "ring-4 ring-primary/20" : ""}`}>
                  {done ? <Check className="size-3.5" /> : <Circle className="size-2.5" />}
                </div>
                <div className="mt-1.5 max-w-[8rem] text-center">
                  <div className={`text-[11px] font-semibold ${done ? "" : "text-muted-foreground"}`}>{stage.label}</div>
                </div>
              </div>
              {i < STAGE_INFO.length - 1 && (
                <div className={`mt-4 h-0.5 flex-1 ${i < stageIdx ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Status updates are managed by the admin team.</p>
    </div>
  );
}

function LineItems({ order }: { order: Order }) {
  const subtotal = computeSubtotal(order);
  const tax = computeTax(order);
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5 flex items-center gap-2">
        <Package className="size-4 text-primary" />
        <h3 className="font-semibold text-sm">Line Items ({order.items.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map((it) => (
              <tr key={it.productId}>
                <td className="px-3 py-2">
                  <div>{it.name}</div>
                  {it.sku && <div className="text-xs text-muted-foreground font-mono">{it.sku}</div>}
                </td>
                <td className="px-3 py-2 text-right">{it.quantity}</td>
                <td className="px-3 py-2 text-right">{formatBDT(it.unitPrice)}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatBDT(it.unitPrice * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border p-3">
        <dl className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatBDT(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">VAT (5%)</dt><dd>{formatBDT(tax)}</dd></div>
          <div className="flex justify-between border-t border-border pt-1.5 font-display font-bold">
            <dt>Total</dt><dd className="text-primary">{formatBDT(order.total)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function ActivityLog({ events }: { events: OrderEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        <Clock className="mx-auto mb-1 size-4 opacity-50" />
        No activity yet. Admin will update this order's timeline as it progresses.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="size-4 text-primary" />
        <h3 className="font-semibold text-sm">Activity Timeline</h3>
      </div>
      <ol className="space-y-3 border-l-2 border-border pl-4">
        {[...events].reverse().map((ev, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[21px] top-1 size-3 rounded-full border-2 border-primary bg-background" />
            <div className="text-sm">{ev.message}</div>
            <div className="text-[11px] text-muted-foreground">
              {new Date(ev.at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · {ev.by} · <span className="uppercase tracking-wide">{ev.type}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
