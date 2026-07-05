import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Download,
  Check,
  Circle,
  Truck,
  CreditCard,
  Package,
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  StickyNote,
  AlertTriangle,
  Ban,
  PauseCircle,
  PlayCircle,
  Save,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { generateInvoice } from "@/lib/pdf";
import {
  ALL_ORDER_STATUSES,
  PAYMENT_STATUSES,
  FULFILLMENT_STATUSES,
  STAGE_INFO,
  currentStageIndex,
  nextActionFor,
  derivePaymentStatus,
  deriveFulfillmentStatus,
  computeSubtotal,
  computeTax,
  computeShipping,
  computeDiscount,
  appendEvent,
  nowIso,
} from "@/lib/order-workflow";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
} from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders/$orderId")({
  head: () => ({ meta: [{ title: "Order Details — Admin" }] }),
  component: AdminOrderDetail,
});

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

const fulfillmentColor: Record<FulfillmentStatus, string> = {
  Unfulfilled: "bg-muted text-muted-foreground",
  Picking: "bg-blue-100 text-blue-800",
  Packed: "bg-accent/20 text-accent-foreground",
  Shipped: "bg-primary text-primary-foreground",
  Delivered: "bg-success/20 text-success",
};

function AdminOrderDetail() {
  const { orderId } = Route.useParams();
  const { orders, dispatch, user } = useStore();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw notFound();

  const paymentStatus = derivePaymentStatus(order);
  const fulfillmentStatus = deriveFulfillmentStatus(order);
  const subtotal = computeSubtotal(order);
  const tax = computeTax(order);
  const shipping = computeShipping(order);
  const discount = computeDiscount(order);
  const grandTotal = subtotal + tax + shipping - discount;

  const stageIdx = currentStageIndex(order.status);
  const nextAction = nextActionFor(order.status);
  const isTerminal = order.status === "Cancelled" || order.status === "Delivered";

  const [editingShipping, setEditingShipping] = useState(false);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [eta, setEta] = useState(order.estimatedDelivery ?? "");
  const [note, setNote] = useState("");
  const [internalNotes, setInternalNotes] = useState(order.internalNotes ?? "");
  const [priority, setPriority] = useState(order.priority ?? "Normal");

  const shippingReady = !!(order.carrier && order.trackingNumber);
  const requiresShipping = nextAction?.next === "Shipped";
  const advanceDisabled = requiresShipping && !shippingReady;

  const actor = user?.name ?? user?.email ?? "Admin";

  const patchOrder = (patch: Partial<Order>, message: string, type: "status" | "payment" | "fulfillment" | "note" = "status") => {
    const timeline = appendEvent(order, { at: nowIso(), by: actor, type, message });
    dispatch({ type: "UPDATE_ORDER", id: order.id, patch: { ...patch, timeline } });
  };

  const advanceStage = () => {
    if (!nextAction) return;
    const extra: Partial<Order> = { status: nextAction.next };
    if (nextAction.next === "Processing") extra.fulfillmentStatus = "Picking";
    if (nextAction.next === "Shipped") extra.fulfillmentStatus = "Shipped";
    if (nextAction.next === "Delivered") {
      extra.fulfillmentStatus = "Delivered";
      if (paymentStatus !== "Paid") extra.paymentStatus = "Paid";
    }
    patchOrder(extra, `Status advanced to ${nextAction.next}`);
    toast.success(`Order moved to ${nextAction.next}`);
  };

  const setStatus = (s: OrderStatus) => {
    patchOrder({ status: s }, `Status changed to ${s}`);
    toast.success(`Status: ${s}`);
  };

  const setPay = (s: PaymentStatus) => {
    patchOrder({ paymentStatus: s }, `Payment status set to ${s}`, "payment");
    toast.success(`Payment: ${s}`);
  };

  const setFulfil = (s: FulfillmentStatus) => {
    patchOrder({ fulfillmentStatus: s }, `Fulfillment set to ${s}`, "fulfillment");
    toast.success(`Fulfillment: ${s}`);
  };

  const saveShipping = () => {
    if (!carrier.trim() || !tracking.trim()) {
      toast.error("Carrier and Tracking # are required");
      return;
    }
    patchOrder(
      { trackingNumber: tracking.trim(), carrier: carrier.trim(), estimatedDelivery: eta || undefined },
      `Tracking updated (${carrier.trim()}: ${tracking.trim()})`,
      "fulfillment",
    );
    setEditingShipping(false);
    toast.success("Shipping details saved");
  };

  const cancelShippingEdit = () => {
    setCarrier(order.carrier ?? "");
    setTracking(order.trackingNumber ?? "");
    setEta(order.estimatedDelivery ?? "");
    setEditingShipping(false);
  };

  const addNote = () => {
    if (!note.trim()) return;
    patchOrder({}, note.trim(), "note");
    setNote("");
    toast.success("Note added");
  };

  const saveInternal = () => {
    dispatch({ type: "UPDATE_ORDER", id: order.id, patch: { internalNotes, priority: priority as Order["priority"] } });
    toast.success("Internal details saved");
  };

  const cancelOrder = () => {
    patchOrder({ status: "Cancelled", paymentStatus: paymentStatus === "Paid" ? "Refunded" : paymentStatus }, "Order cancelled");
    toast.success("Order cancelled");
  };

  const holdOrder = () => {
    patchOrder({ status: "On Hold" }, "Order placed on hold");
    toast.success("Order on hold");
  };

  const resumeOrder = () => {
    patchOrder({ status: "Confirmed" }, "Order resumed");
    toast.success("Order resumed");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            to="/admin/orders"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-3.5 mr-1" /> Back to orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">Order {order.id}</h1>
            <Badge className={statusColor[order.status]}>{order.status}</Badge>
            <Badge className={paymentColor[paymentStatus]} variant="outline">
              <CreditCard className="size-3 mr-1" /> {paymentStatus}
            </Badge>
            <Badge className={fulfillmentColor[fulfillmentStatus]} variant="outline">
              <Package className="size-3 mr-1" /> {fulfillmentStatus}
            </Badge>
            {order.priority && order.priority !== "Normal" && (
              <Badge variant="outline" className="border-amber-500 text-amber-700">
                <AlertTriangle className="size-3 mr-1" /> {order.priority}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Placed {formatDate(order.date)} · Payment via {order.paymentMethod}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {nextAction && !isTerminal && order.status !== "On Hold" && (
            <Button
              onClick={advanceDisabled ? () => toast.error("Add carrier & tracking # before shipping") : advanceStage}
              disabled={advanceDisabled}
              className="font-bold uppercase"
              title={advanceDisabled ? "Carrier and Tracking # required" : undefined}
            >
              <PlayCircle className="size-4 mr-2" /> {nextAction.label}
            </Button>
          )}
          {order.status === "On Hold" && (
            <Button onClick={resumeOrder}>
              <PlayCircle className="size-4 mr-2" /> Resume
            </Button>
          )}
          {!isTerminal && order.status !== "On Hold" && (
            <Button variant="outline" onClick={holdOrder}>
              <PauseCircle className="size-4 mr-2" /> Hold
            </Button>
          )}
          <Button variant="outline" onClick={() => generateInvoice(order)}>
            <Download className="size-4 mr-2" /> Invoice
          </Button>
          {!isTerminal && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:bg-destructive/20 hover:text-destructive">
                  <Ban className="size-4 mr-2" /> Cancel Order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the order as Cancelled. If payment was received it will be flagged as Refunded. This action cannot be undone from the UI.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep order</AlertDialogCancel>
                  <AlertDialogAction onClick={cancelOrder} className="bg-destructive text-destructive-foreground">
                    Yes, cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Workflow stepper */}
      {order.status !== "Cancelled" && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Order Workflow</h3>
            {order.status === "On Hold" && (
              <Badge className="bg-amber-100 text-amber-800">On Hold</Badge>
            )}
          </div>
          <div className="flex items-center">
            {STAGE_INFO.map((stage, i) => {
              const done = i <= stageIdx;
              const active = i === stageIdx;
              return (
                <div key={stage.key} className="flex flex-1 items-start">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex size-9 items-center justify-center rounded-full border-2 ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground"
                      } ${active ? "ring-4 ring-primary/20" : ""}`}
                    >
                      {done ? <Check className="size-4" /> : <Circle className="size-3" />}
                    </div>
                    <div className="mt-2 max-w-[9rem] text-center">
                      <div className={`text-xs font-semibold ${done ? "" : "text-muted-foreground"}`}>
                        {stage.label}
                      </div>
                      <div className="text-[10px] leading-tight text-muted-foreground">
                        {stage.description}
                      </div>
                    </div>
                  </div>
                  {i < STAGE_INFO.length - 1 && (
                    <div className={`mt-4 h-0.5 flex-1 ${i < stageIdx ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Items */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h3 className="font-semibold">Line Items ({order.items.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map((it) => (
                    <tr key={it.productId}>
                      <td className="px-4 py-3">{it.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {it.sku ?? it.productId}
                      </td>
                      <td className="px-4 py-3 text-right">{it.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatBDT(it.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatBDT(it.unitPrice * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border p-4">
              <dl className="ml-auto max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatBDT(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">VAT (5%)</dt>
                  <dd>{formatBDT(tax)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd>{formatBDT(shipping)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>Discount</dt>
                    <dd>− {formatBDT(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 font-display text-base font-bold">
                  <dt>Total</dt>
                  <dd className="text-primary">{formatBDT(grandTotal)}</dd>
                </div>
                {grandTotal !== order.total && (
                  <div className="text-[10px] text-muted-foreground">
                    Recorded order total: {formatBDT(order.total)}
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Shipping / tracking */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Truck className="size-4 text-primary" />
              <h3 className="font-semibold">Shipping & Tracking</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="carrier" className="text-xs">Carrier</Label>
                <Input
                  id="carrier"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. Sundarban Courier"
                />
              </div>
              <div>
                <Label htmlFor="tracking" className="text-xs">Tracking #</Label>
                <Input
                  id="tracking"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="AWB / consignment"
                />
              </div>
              <div>
                <Label htmlFor="eta" className="text-xs">Est. Delivery</Label>
                <Input id="eta" type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={saveShipping}>
                <Save className="size-3.5 mr-1" /> Save tracking
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <h3 className="font-semibold">Activity Timeline</h3>
            </div>
            <div className="mb-4 flex gap-2">
              <Input
                placeholder="Add an internal update or customer note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addNote();
                }}
              />
              <Button onClick={addNote} size="sm">Add</Button>
            </div>
            <ol className="relative space-y-4 border-l border-border pl-5">
              {[...(order.timeline ?? [])].reverse().map((ev, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[26px] top-1.5 size-3 rounded-full border-2 border-primary bg-background" />
                  <div className="text-sm">{ev.message}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(ev.at).toLocaleString()} · {ev.by} · {ev.type}
                  </div>
                </li>
              ))}
              <li className="relative">
                <span className="absolute -left-[26px] top-1.5 size-3 rounded-full border-2 border-border bg-background" />
                <div className="text-sm">Order created</div>
                <div className="text-[11px] text-muted-foreground">
                  {formatDate(order.date)} · System · created
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <UserIcon className="size-4 text-primary" />
              <h3 className="font-semibold">Customer</h3>
            </div>
            <div className="space-y-1 text-sm">
              <div className="font-semibold">{order.customerName}</div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Mail className="size-3" /> {order.customerEmail}
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="size-3" /> {order.customerPhone}
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <h3 className="font-semibold">Addresses</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Shipping</div>
                <div>{order.shippingAddress}</div>
              </div>
              {order.billingAddress && (
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Billing</div>
                  <div>{order.billingAddress}</div>
                </div>
              )}
            </div>
          </div>

          {/* Manual state overrides */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="font-semibold">Manual Overrides</h3>
            <div>
              <Label className="text-xs">Order Status</Label>
              <Select value={order.status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Payment Status</Label>
              <Select value={paymentStatus} onValueChange={(v) => setPay(v as PaymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fulfillment</Label>
              <Select value={fulfillmentStatus} onValueChange={(v) => setFulfil(v as FulfillmentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FULFILLMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Internal */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <StickyNote className="size-4 text-primary" />
              <h3 className="font-semibold">Internal</h3>
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as NonNullable<Order["priority"]>)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low", "Normal", "High", "Urgent"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Internal Notes</Label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={4}
                placeholder="Not visible to customer"
              />
            </div>
            <Button size="sm" onClick={saveInternal} className="w-full">
              <Save className="size-3.5 mr-1" /> Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
