import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, Check, Circle, Clock, Package, CreditCard, MapPin, Truck, StickyNote, XCircle, Undo2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addOrderRequest, hasRequest, useOrderRequests, mergeTimeline, returnEventsForOrder, orderFlow, type OrderRequestType } from "@/lib/order-requests";
import {
  addRefundRequest, useRefundRequests, validateRefundAccount, REFUND_STATUS_COLOR,
  type RefundAccount, type RefundMethod,
} from "@/lib/refund-requests";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useInventory } from "@/lib/inventory-store";
import { cancelOrder } from "@/lib/order-actions";
import { formatBDT, formatDate } from "@/lib/format";
import { generateInvoice } from "@/lib/pdf";
import {
  PAYMENT_STATUS_COLOR,
  derivePaymentStatus,
  computeSubtotal,
  computeTax,
} from "@/lib/order-workflow";
import type { Order, OrderEvent } from "@/data/types";

export const Route = createFileRoute("/portal-customer/orders/$orderId")({
  head: () => ({ meta: [{ title: "Order Detail — Portal" }] }),
  component: OrderDetail,
});

const paymentColor = PAYMENT_STATUS_COLOR;

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { orders, user, dispatch } = useStore();
  const inv = useInventory();
  const order = orders.find((o) => o.id === orderId);
  const requests = useOrderRequests(user?.email);
  const [dialog, setDialog] = useState<OrderRequestType | null>(null);
  const [reason, setReason] = useState("");
  if (!order) throw notFound();

  const flow = orderFlow(order, requests);
  const cancelled = order.status === "Cancelled";
  const activeCancellation = requests.find((r) => r.orderId === order.id && r.type === "cancellation" && r.status === "Requested");
  const canCancel = !cancelled && order.status !== "Delivered" && order.status !== "Shipped" && !activeCancellation;
  const returnRequested = hasRequest(requests, order.id, "return");
  const canReturn = order.status === "Delivered" && !returnRequested;

  const refunds = useRefundRequests(user?.email).filter((r) => r.orderId === order.id);
  const liveRefund = refunds.find((r) => r.status !== "Rejected");
  const returnCompleted = requests.some((r) => r.orderId === order.id && r.type === "return" && r.status === "Completed");
  const payStatus = derivePaymentStatus(order);
  const canRefund = (cancelled || returnCompleted) && (payStatus === "Paid" || payStatus === "Partial") && !liveRefund;
  const [refundOpen, setRefundOpen] = useState(false);
  const [acct, setAcct] = useState<RefundAccount>({ method: "bKash" });
  const setField = (k: keyof RefundAccount, v: string) => setAcct((a) => ({ ...a, [k]: v }));

  const submitRefund = () => {
    const err = validateRefundAccount(acct);
    if (err) return toast.error(err);
    addRefundRequest({
      orderId: order.id,
      customerEmail: order.customerEmail,
      amount: order.paidAmount ?? order.total,
      account: acct,
    });
    const event: OrderEvent = { at: new Date().toISOString(), by: order.customerName || "Customer", type: "payment", message: `Refund requested via ${acct.method}` };
    dispatch({ type: "UPDATE_ORDER", id: order.id, patch: { timeline: [...(order.timeline ?? []), event] } });
    toast.success("Refund request submitted");
    setRefundOpen(false);
  };

  const submit = () => {
    const text = reason.trim();
    if (text.length < 5) {
      toast.error("Please write a short reason (at least 5 characters).");
      return;
    }
    if (text.length > 500) {
      toast.error("Reason must be under 500 characters.");
      return;
    }
    const actor = order.customerName || "Customer";

    if (dialog === "return") {
      addOrderRequest({
        orderId: order.id,
        customerEmail: order.customerEmail,
        type: "return",
        reason: text,
        orderTotal: order.total,
        orderDate: order.date,
      });
      const event: OrderEvent = { at: new Date().toISOString(), by: actor, type: "status", message: `Return requested: ${text}` };
      dispatch({ type: "UPDATE_ORDER", id: order.id, patch: { timeline: [...(order.timeline ?? []), event] } });
      toast.success("Return request submitted");
    } else if (order.status === "Pending") {
      // No fulfillment work has started yet — instant self-cancel, still logged as a completed request.
      const { patch } = cancelOrder(order, { actor, reason: text });
      dispatch({ type: "UPDATE_ORDER", id: order.id, patch });
      inv.releaseReservation(order, actor);
      addOrderRequest({
        orderId: order.id,
        customerEmail: order.customerEmail,
        type: "cancellation",
        reason: text,
        orderTotal: order.total,
        orderDate: order.date,
        status: "Completed",
        timeline: [{ at: new Date().toISOString(), by: actor, type: "status", message: "Self-cancelled while order was Pending (no approval required)" }],
      });
      toast.success("Order cancelled");
    } else {
      addOrderRequest({
        orderId: order.id,
        customerEmail: order.customerEmail,
        type: "cancellation",
        reason: text,
        orderTotal: order.total,
        orderDate: order.date,
      });
      toast.success("Cancellation requested — awaiting review");
    }
    setDialog(null);
    setReason("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/portal-customer/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4 mr-1" /> Back to orders
        </Link>
        <div className="flex flex-wrap gap-2">
          {canCancel && (
            <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => { setReason(""); setDialog("cancellation"); }}>
              <XCircle className="size-4 mr-2" /> Cancel Order
            </Button>
          )}
          {canReturn && (
            <Button variant="outline" onClick={() => { setReason(""); setDialog("return"); }}>
              <Undo2 className="size-4 mr-2" /> Request Return
            </Button>
          )}
          {canRefund && (
            <Button variant="outline" onClick={() => { setAcct({ method: "bKash" }); setRefundOpen(true); }}>
              <CreditCard className="size-4 mr-2" /> Request Refund
            </Button>
          )}
          {refunds[0] && (
            <Badge className={`self-center ${REFUND_STATUS_COLOR[refunds[0].status]}`}>Refund {refunds[0].status.toLowerCase()}</Badge>
          )}
          {activeCancellation && <Badge className="self-center bg-amber-100 text-amber-800">Cancellation requested</Badge>}
          {returnRequested && <Badge className="self-center bg-amber-100 text-amber-800">Return requested</Badge>}
          <Button onClick={() => generateInvoice(order)}><Download className="size-4 mr-2" /> Download Invoice</Button>
        </div>
      </div>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a refund</DialogTitle>
            <DialogDescription>
              Refund of {formatBDT(order.paidAmount ?? order.total)}. Tell us where to send it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Receive method</Label>
              <Select value={acct.method} onValueChange={(v) => setAcct({ method: v as RefundMethod })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Bank", "bKash", "Nagad"] as const).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {acct.method === "Bank" ? (
              <>
                {([
                  ["bankName", "Bank name"],
                  ["branchName", "Branch name"],
                  ["routingNumber", "Routing number"],
                  ["accountNumber", "Account number"],
                ] as const).map(([k, label]) => (
                  <div key={k} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Input value={acct[k] ?? ""} maxLength={60} onChange={(e) => setField(k, e.target.value)} />
                  </div>
                ))}
              </>
            ) : (
              <div className="space-y-1.5">
                <Label>{acct.method} phone number</Label>
                <Input value={acct.phone ?? ""} maxLength={14} placeholder="01XXXXXXXXX" onChange={(e) => setField("phone", e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>Back</Button>
            <Button onClick={submitRefund}>Submit request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "return" ? "Request a return" : "Cancel this order"}</DialogTitle>
            <DialogDescription>
              {dialog === "return"
                ? "Tell us why you want to return this order. Our team will review your request."
                : order.status === "Pending"
                  ? "This order hasn't been confirmed yet, so it will be cancelled immediately."
                  : "Please tell us why you are cancelling. An admin will review this before the order is cancelled."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              maxLength={500}
              rows={4}
              onChange={(e) => setReason(e.target.value)}
              placeholder={dialog === "return" ? "e.g. Item damaged on arrival" : "e.g. Ordered the wrong model"}
            />
            <p className="text-xs text-muted-foreground">{reason.length}/500</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Back</Button>
            <Button onClick={submit} className={dialog === "cancellation" ? "bg-destructive text-destructive-foreground hover:opacity-90" : ""}>
              {dialog === "return" ? "Submit request" : "Confirm cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className="rounded-lg border border-border bg-card p-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold">Order {order.id}</h2>
            <Badge className={flow.color}>{flow.label}</Badge>
            <Badge className={paymentColor[derivePaymentStatus(order)]} variant="outline">
              <CreditCard className="size-3 mr-1" /> {derivePaymentStatus(order)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Placed {formatDate(order.date)} · Payment via {order.paymentMethod}
          </p>
        </div>
        <div className="max-w-xs sm:text-right">
          <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground sm:justify-end">
            <MapPin className="size-3.5 text-primary" /> Delivery Address
          </div>
          <div className="text-sm">{order.shippingAddress}</div>
        </div>
      </div>

      {refunds[0]?.status === "Rejected" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span className="font-semibold">Refund {refunds[0].id} was rejected.</span>
          {refunds[0].rejectionReason && <> Reason: {refunds[0].rejectionReason}</>}
        </div>
      )}

      <ProcessTimeline order={order} flow={flow} />

      <div className="grid gap-3 md:grid-cols-2">

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
      <ActivityLog events={mergeTimeline(order.timeline ?? [], returnEventsForOrder(requests, order.id))} />
    </div>
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

function ProcessTimeline({ order, flow }: { order: Order; flow: ReturnType<typeof orderFlow> }) {
  if (order.status === "Cancelled") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        This order was cancelled.
      </div>
    );
  }
  const stageIdx = flow.idx;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Order Progress</h3>
        {order.status === "On Hold" && <Badge className="bg-amber-100 text-amber-800">On Hold</Badge>}
      </div>
      <div className="overflow-x-auto">
      <div className="flex min-w-[38rem]">
        {flow.stages.map((stage, i) => {
          const done = i <= stageIdx;
          const active = i === stageIdx;
          const bad = !!flow.rejected && active;
          return (
            <div key={stage.key} className="relative flex-1 basis-0">
              {/* connector runs from this circle's centre to the next one's */}
              {i < flow.stages.length - 1 && (
                <div className={`absolute left-1/2 top-[15px] h-0.5 w-full ${i < stageIdx ? "bg-primary" : "bg-border"}`} />
              )}
              <div className="relative flex flex-col items-center">
                <div className={`flex size-8 items-center justify-center rounded-full border-2 ${bad ? "border-destructive bg-destructive text-destructive-foreground" : done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground"} ${active ? "ring-4 ring-primary/20" : ""}`}>
                  {bad ? <X className="size-3.5" /> : done ? <Check className="size-3.5" /> : <Circle className="size-2.5" />}
                </div>
                <div className="mt-1.5 px-1 text-center">
                  <div className={`text-[11px] font-semibold ${done ? "" : "text-muted-foreground"}`}>{stage.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
