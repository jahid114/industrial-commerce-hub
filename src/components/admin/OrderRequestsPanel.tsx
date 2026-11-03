import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { formatBDT, formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useInventory, RETURN_REASONS, type ReturnReason, type ReturnCondition } from "@/lib/inventory-store";
import { cancelOrder } from "@/lib/order-actions";
import {
  ORDER_REQUEST_STATUS_COLOR,
  patchOrderRequest,
  appendRequestEvent,
  nowIso,
  type OrderRequest,
  type OrderRequestStatus,
  type OrderRequestType,
  useOrderRequests,
} from "@/lib/order-requests";
import {
  nextRequestAction,
  canRejectRequest,
} from "@/lib/order-request-workflow";

const STATUSES: OrderRequestStatus[] = ["Requested", "Approved", "Received", "Rejected", "Completed"];

export function OrderRequestsPanel({ type }: { type: OrderRequestType }) {
  const all = useOrderRequests();
  const { orders, dispatch, user } = useStore();
  const inv = useInventory();
  const actor = user?.name ?? user?.email ?? "Admin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      all.filter((r) => {
        if (r.type !== type) return false;
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (search && !`${r.id} ${r.orderId} ${r.customerEmail}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [all, type, statusFilter, search],
  );

  const label = type === "return" ? "Return" : "Cancellation";
  const detail = all.find((r) => r.id === detailId) ?? null;

  const approve = (req: OrderRequest) => {
    const action = nextRequestAction(req.type, req.status);
    if (!action) return;

    if (req.type === "cancellation" && action.next === "Completed") {
      const order = orders.find((o) => o.id === req.orderId);
      if (!order) return;
      const { patch } = cancelOrder(order, { actor, reason: req.reason });
      dispatch({ type: "UPDATE_ORDER", id: order.id, patch });
      inv.releaseReservation(order, actor);
      patchOrderRequest(req.id, {
        status: "Completed",
        timeline: appendRequestEvent(req, { at: nowIso(), by: actor, type: "status", message: "Cancellation approved — order cancelled, reservation released" }),
      });
      return;
    }

    patchOrderRequest(req.id, {
      status: action.next,
      timeline: appendRequestEvent(req, { at: nowIso(), by: actor, type: "status", message: action.label }),
    });
  };

  const reject = (req: OrderRequest, reason: string) => {
    patchOrderRequest(req.id, {
      status: "Rejected",
      rejectionReason: reason,
      timeline: appendRequestEvent(req, { at: nowIso(), by: actor, type: "status", message: `Rejected: ${reason}` }),
    });
  };

  const markReceived = (req: OrderRequest, input: { productId: string; productName: string; quantity: number; reason: ReturnReason; condition: ReturnCondition; note?: string }) => {
    const entryId = inv.logReturn({
      productId: input.productId,
      quantity: input.quantity,
      reason: input.reason,
      condition: input.condition,
      orderId: req.orderId,
      note: input.note,
      user: actor,
    });
    patchOrderRequest(req.id, {
      status: "Completed",
      inventoryReturnEntryId: entryId,
      timeline: appendRequestEvent(req, { at: nowIso(), by: actor, type: "status", message: `Return received: ${input.quantity} × ${input.productName} — sent to Inventory for restock / damage decision` }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
        <Input
          placeholder={`Search ${label.toLowerCase()} by request, order or email…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{rows.length} request(s)</span>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Request ID</th>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Requested</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-right">Order Total</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const order = orders.find((o) => o.id === r.orderId);
              const action = nextRequestAction(r.type, r.status);
              const canReject = canRejectRequest(r.type, r.status);
              return (
                <tr key={r.id} className="hover:bg-secondary align-top">
                  <td className="px-4 py-3 font-semibold">
                    <button className="hover:underline" onClick={() => setDetailId(r.id)}>{r.id}</button>
                  </td>
                  <td className="px-4 py-3">
                    <Link to="/admin/orders/$orderId" params={{ orderId: r.orderId }} className="font-semibold text-primary hover:underline">
                      {r.orderId}
                    </Link>
                    {r.orderDate && <div className="text-xs text-muted-foreground">{formatDate(r.orderDate)}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.customerEmail}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3 max-w-xs text-muted-foreground">{r.reason}</td>
                  <td className="px-4 py-3 text-right font-display font-bold text-primary">
                    {r.orderTotal != null ? formatBDT(r.orderTotal) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={ORDER_REQUEST_STATUS_COLOR[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {action ? (
                        r.type === "return" && r.status === "Approved" ? (
                          <MarkReceivedDialog request={r} order={order} onSubmit={(input) => markReceived(r, input)} />
                        ) : (
                          <Button size="sm" className="rounded-lg" onClick={() => approve(r)}>{action.label}</Button>
                        )
                      ) : null}
                      {canReject && <RejectDialog onConfirm={(reason) => reject(r, reason)} />}
                      <Button asChild size="sm" variant="ghost" className="rounded-lg">
                        <Link to="/admin/orders/$orderId" params={{ orderId: r.orderId }}>
                          <Eye className="size-3 mr-1" /> Order
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No {label.toLowerCase()} requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!detail} onOpenChange={(v) => { if (!v) setDetailId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.id}</DialogTitle>
            <DialogDescription>
              {detail && <>Order <span className="font-semibold">{detail.orderId}</span> · {detail.customerEmail}</>}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <Badge className={ORDER_REQUEST_STATUS_COLOR[detail.status]}>{detail.status}</Badge>
              {detail.rejectionReason && (
                <p className="text-sm text-destructive">Rejection reason: {detail.rejectionReason}</p>
              )}
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Clock className="size-4 text-primary" /> Activity
                </div>
                {detail.timeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No activity yet.</p>
                ) : (
                  <ol className="space-y-3 border-l-2 border-border pl-4">
                    {[...detail.timeline].reverse().map((ev, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[21px] top-1 size-3 rounded-full border-2 border-primary bg-background" />
                        <div className="text-sm">{ev.message}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(ev.at).toLocaleString()} · {ev.by}</div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RejectDialog({ onConfirm }: { onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <AlertDialog onOpenChange={(open) => { if (!open) setReason(""); }}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive">
          Reject
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject this request?</AlertDialogTitle>
          <AlertDialogDescription>Provide a reason — this will be visible to the customer.</AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Outside the return window" />
        <AlertDialogFooter>
          <AlertDialogCancel>Back</AlertDialogCancel>
          <AlertDialogAction
            disabled={reason.trim().length < 3}
            onClick={() => onConfirm(reason.trim())}
            className="bg-destructive text-destructive-foreground"
          >
            Reject request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MarkReceivedDialog({
  request, order, onSubmit,
}: {
  request: OrderRequest;
  order: { items: { productId: string; name: string; quantity: number; sku?: string }[] } | undefined;
  onSubmit: (input: { productId: string; productName: string; quantity: number; reason: ReturnReason; condition: ReturnCondition; note?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const items = order?.items ?? [];
  const [productId, setProductId] = useState(items[0]?.productId ?? "");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<ReturnReason>(RETURN_REASONS[0]);
  const [condition, setCondition] = useState<ReturnCondition>("Inspect");
  const [note, setNote] = useState("");

  const selectedItem = items.find((i) => i.productId === productId);

  const submit = () => {
    if (!selectedItem) return;
    if (quantity <= 0) return;
    onSubmit({ productId, productName: selectedItem.name, quantity, reason, condition, note: note || undefined });
    setOpen(false);
    setQuantity(1);
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-lg">Mark Received</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log physical return — {request.orderId}</DialogTitle>
          <DialogDescription>Record what came back before it can be graded (restock / damage / scrap).</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">Product</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {items.length === 0 && <option value="">No line items on this order</option>}
              {items.map((it) => <option key={it.productId} value={it.productId}>{it.name} (ordered {it.quantity})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider">Quantity</Label>
              <Input type="number" min={1} max={selectedItem?.quantity} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider">Reason</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReturnReason)}
              >
                {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">Condition</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={condition}
              onChange={(e) => setCondition(e.target.value as ReturnCondition)}
            >
              <option value="Resellable">Resellable</option>
              <option value="Inspect">Needs inspection</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">Notes</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-lg" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="rounded-lg font-bold uppercase" disabled={!selectedItem} onClick={submit}>Mark Received</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
