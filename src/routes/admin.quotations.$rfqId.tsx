import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Circle,
  Mail,
  Phone,
  User as UserIcon,
  Building2,
  Clock,
  Pencil,
  Save,
  StickyNote,
  Send,
  Ban,
  ShoppingCart,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate, newOrderId } from "@/lib/format";
import {
  ALL_QUOTATION_STATUSES,
  QSTAGE_INFO,
  QUOTATION_STAGES,
  QUOTATION_STATUS_COLOR,
  appendQuotationEvent,
  computeQuotedTotal,
  isTerminalQuotation,
  nextQuotationAction,
  nowIso,
  quotationStageIndex,
} from "@/lib/quotation-workflow";
import type { Order, Quotation, QuotationEvent, QuotationItem, QuotationStatus } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/quotations/$rfqId")({
  head: () => ({ meta: [{ title: "Quotation Details — Admin" }] }),
  component: AdminQuotationDetail,
});

function AdminQuotationDetail() {
  const { rfqId } = Route.useParams();
  const { quotations, dispatch, user } = useStore();
  const navigate = useNavigate();
  const q = quotations.find((x) => x.id === rfqId);
  if (!q) throw notFound();

  const actor = user?.name ?? user?.email ?? "Admin";
  const stageIdx = quotationStageIndex(q.status);
  const nextAction = nextQuotationAction(q.status);
  const terminal = isTerminalQuotation(q.status);

  const [editItems, setEditItems] = useState(false);
  const [items, setItems] = useState<QuotationItem[]>(q.items);
  const [editTerms, setEditTerms] = useState(false);
  const [validUntil, setValidUntil] = useState(q.validUntil ?? "");
  const [paymentTerms, setPaymentTerms] = useState(q.paymentTerms ?? "");
  const [deliveryTerms, setDeliveryTerms] = useState(q.deliveryTerms ?? "");
  const [assignedTo, setAssignedTo] = useState(q.assignedTo ?? "");
  const [internalNotes, setInternalNotes] = useState(q.internalNotes ?? "");
  const [note, setNote] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const quotedTotal = useMemo(() => computeQuotedTotal(items), [items]);
  const allLinesPriced = items.every((i) => (i.quotedPrice ?? 0) > 0);

  const patchQ = (patch: Partial<Quotation>, event: QuotationEvent) => {
    const timeline = appendQuotationEvent(q, event);
    dispatch({ type: "UPDATE_QUOTATION", id: q.id, patch: { ...patch, timeline } });
  };

  const saveItems = () => {
    patchQ({ items, quotedTotal: computeQuotedTotal(items) }, { at: nowIso(), by: actor, type: "quote", message: "Line items updated" });
    setEditItems(false);
    toast.success("Line items saved");
  };

  const saveTerms = () => {
    patchQ(
      { validUntil: validUntil || undefined, paymentTerms: paymentTerms || undefined, deliveryTerms: deliveryTerms || undefined, assignedTo: assignedTo || undefined },
      { at: nowIso(), by: actor, type: "note", message: "Quotation terms updated" }
    );
    setEditTerms(false);
    toast.success("Terms saved");
  };

  const advance = () => {
    if (!nextAction) return;
    if (nextAction.next === "Quoted") {
      if (!allLinesPriced) return toast.error("Enter a quoted price for every line first");
      setSendOpen(true);
      return;
    }
    patchQ({ status: nextAction.next }, { at: nowIso(), by: actor, type: "status", message: `Status advanced to ${nextAction.next}` });
    toast.success(`Moved to ${nextAction.next}`);
  };

  const setStatus = (s: QuotationStatus) => {
    patchQ({ status: s }, { at: nowIso(), by: actor, type: "status", message: `Status changed to ${s}` });
    toast.success(`Status: ${s}`);
  };

  const sendQuote = () => {
    patchQ(
      { status: "Quoted", items, quotedTotal, validUntil: validUntil || undefined, paymentTerms: paymentTerms || undefined, deliveryTerms: deliveryTerms || undefined },
      { at: nowIso(), by: actor, type: "quote", message: `Quotation sent · Total ${formatBDT(quotedTotal)}` }
    );
    setSendOpen(false);
    setEditItems(false);
    setEditTerms(false);
    toast.success("Quotation sent to customer");
  };

  const reject = () => {
    patchQ({ status: "Rejected" }, { at: nowIso(), by: actor, type: "status", message: "Quotation rejected" });
    setRejectOpen(false);
    toast.success("Quotation rejected");
  };

  const markExpired = () => {
    patchQ({ status: "Expired" }, { at: nowIso(), by: actor, type: "status", message: "Quotation expired" });
    toast.success("Marked expired");
  };

  const addNote = () => {
    if (!note.trim()) return;
    const patch: Partial<Quotation> = { internalNotes };
    patchQ(patch, { at: nowIso(), by: actor, type: "note", message: note.trim() });
    setNote("");
    toast.success("Note added");
  };

  const convertToOrder = () => {
    if (!allLinesPriced) return toast.error("All lines need a quoted price");
    const newOrder: Order = {
      id: newOrderId(),
      customerName: q.customerName,
      customerEmail: q.customerEmail,
      customerPhone: q.customerPhone,
      date: new Date().toISOString().slice(0, 10),
      items: items.map((i) => ({ productId: i.productId, name: i.productName, quantity: i.quantity, unitPrice: i.quotedPrice ?? 0 })),
      total: quotedTotal,
      status: "Confirmed",
      paymentStatus: "Unpaid",
      paymentMethod: "Bank Transfer",
      shippingAddress: q.company ? `${q.company} — address TBD` : "Address to be confirmed",
      internalNotes: `Converted from ${q.id}`,
      timeline: [{ at: nowIso(), by: actor, type: "created", message: `Order created from RFQ ${q.id}` }],
    };
    dispatch({ type: "ADD_ORDER", order: newOrder });
    patchQ(
      { status: "Converted", convertedOrderId: newOrder.id },
      { at: nowIso(), by: actor, type: "conversion", message: `Converted to order ${newOrder.id}` }
    );
    setConvertOpen(false);
    toast.success(`Order ${newOrder.id} created`);
    navigate({ to: "/admin/orders/$orderId", params: { orderId: newOrder.id } });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/quotations" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-4" /> Back to RFQs
          </Link>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="font-display text-2xl font-bold">{q.id}</h1>
            <p className="text-xs text-muted-foreground">Received {formatDate(q.date)}</p>
          </div>
          <Badge className={QUOTATION_STATUS_COLOR[q.status]}>{q.status}</Badge>
          {q.convertedOrderId && (
            <Link to="/admin/orders/$orderId" params={{ orderId: q.convertedOrderId }} className="text-xs text-primary hover:underline">
              → Order {q.convertedOrderId}
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {nextAction && !terminal && (
            <Button size="sm" className="font-semibold" onClick={advance}>
              {nextAction.next === "Quoted" ? <Send className="mr-1 size-4" /> : <Check className="mr-1 size-4" />}
              {nextAction.label}
            </Button>
          )}
          {q.status === "Accepted" && (
            <Button size="sm" onClick={() => setConvertOpen(true)}>
              <ShoppingCart className="mr-1 size-4" /> Convert to Order
            </Button>
          )}
          {!terminal && q.status !== "New" && (
            <Button size="sm" variant="outline" onClick={markExpired}><Clock className="mr-1 size-4" /> Mark Expired</Button>
          )}
          {!terminal && (
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setRejectOpen(true)}>
              <Ban className="mr-1 size-4" /> Reject
            </Button>
          )}
          <Select value={q.status} onValueChange={(v) => setStatus(v as QuotationStatus)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{ALL_QUOTATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Stage stepper */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="grid grid-cols-6 gap-2">
          {QSTAGE_INFO.map((s, i) => {
            const done = stageIdx > i;
            const active = stageIdx === i;
            return (
              <div key={s.key} className="flex flex-col items-center text-center">
                <div className={`flex size-8 items-center justify-center rounded-full border-2 ${done ? "border-success bg-success text-white" : active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>
                  {done ? <Check className="size-4" /> : <Circle className="size-3 fill-current" />}
                </div>
                <div className={`mt-2 text-xs font-semibold ${active ? "text-primary" : done ? "text-success" : "text-muted-foreground"}`}>{s.label}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{s.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Line items */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-display text-lg font-bold flex items-center gap-2"><FileText className="size-4" /> Line Items</h2>
              {editItems ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setItems(q.items); setEditItems(false); }}>Cancel</Button>
                  <Button size="sm" onClick={saveItems}><Save className="mr-1 size-4" /> Save</Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setEditItems(true)}><Pencil className="mr-1 size-4" /> Edit prices</Button>
              )}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Target ৳</th>
                  <th className="px-4 py-2 text-right">Quoted ৳</th>
                  <th className="px-4 py-2 text-right">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{it.productName}</div>
                      {it.notes && <div className="text-xs text-muted-foreground">{it.notes}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">{it.quantity}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {it.targetPrice ? formatBDT(it.targetPrice) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editItems ? (
                        <Input
                          type="number"
                          className="h-8 w-32 text-right"
                          value={it.quotedPrice ?? ""}
                          onChange={(e) => {
                            const v = e.target.value ? Number(e.target.value) : undefined;
                            setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, quotedPrice: v } : x)));
                          }}
                        />
                      ) : (
                        it.quotedPrice ? <span className="font-semibold">{formatBDT(it.quotedPrice)}</span> : <span className="text-muted-foreground">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {it.quotedPrice ? formatBDT(it.quotedPrice * it.quantity) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-secondary/40">
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold">Quoted total</td>
                  <td className="px-4 py-3 text-right font-display text-lg font-bold text-primary">{formatBDT(quotedTotal)}</td>
                </tr>
              </tfoot>
            </table>
            {!allLinesPriced && (
              <div className="border-t border-border bg-amber-50 p-3 text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle className="size-4" /> Enter a quoted price for every line before sending the quotation.
              </div>
            )}
          </div>

          {/* Terms */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-display text-lg font-bold">Quotation Terms</h2>
              {editTerms ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => {
                    setValidUntil(q.validUntil ?? ""); setPaymentTerms(q.paymentTerms ?? "");
                    setDeliveryTerms(q.deliveryTerms ?? ""); setAssignedTo(q.assignedTo ?? "");
                    setEditTerms(false);
                  }}>Cancel</Button>
                  <Button size="sm" onClick={saveTerms}><Save className="mr-1 size-4" /> Save</Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setEditTerms(true)}><Pencil className="mr-1 size-4" /> Edit</Button>
              )}
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <TermField label="Valid until" value={validUntil} editing={editTerms} onChange={setValidUntil} type="date" placeholder="—" />
              <TermField label="Assigned to" value={assignedTo} editing={editTerms} onChange={setAssignedTo} placeholder="Sales rep" />
              <TermField label="Payment terms" value={paymentTerms} editing={editTerms} onChange={setPaymentTerms} placeholder="e.g. 50% advance" />
              <TermField label="Delivery terms" value={deliveryTerms} editing={editTerms} onChange={setDeliveryTerms} placeholder="e.g. CFR Chittagong" />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <h2 className="font-display text-lg font-bold flex items-center gap-2"><Clock className="size-4" /> Activity</h2>
            </div>
            <div className="max-h-80 overflow-y-auto p-4">
              {q.timeline && q.timeline.length > 0 ? (
                <ol className="relative border-l border-border pl-4">
                  {[...q.timeline].reverse().map((ev, i) => (
                    <li key={i} className="mb-4 last:mb-0">
                      <div className="absolute -left-1.5 size-3 rounded-full bg-primary" />
                      <div className="text-sm font-medium">{ev.message}</div>
                      <div className="text-xs text-muted-foreground">{new Date(ev.at).toLocaleString()} · {ev.by} · {ev.type}</div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Customer */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-display text-base font-bold">Customer</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2"><UserIcon className="size-4 text-muted-foreground" /> {q.customerName}</div>
              {q.company && <div className="flex items-center gap-2"><Building2 className="size-4 text-muted-foreground" /> {q.company}</div>}
              <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /> <a href={`mailto:${q.customerEmail}`} className="hover:text-primary">{q.customerEmail}</a></div>
              {q.customerPhone && <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> {q.customerPhone}</div>}
            </div>
            <div className="mt-4 rounded-md bg-secondary p-3 text-sm text-muted-foreground">
              "{q.message}"
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-display text-base font-bold flex items-center gap-2"><StickyNote className="size-4" /> Internal notes</h3>
            <Textarea rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} className="mt-3" placeholder="Notes visible only to the team…" />
            <div className="mt-3">
              <Label className="text-xs">Add activity note</Label>
              <div className="mt-1 flex gap-2">
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Called customer, awaiting reply…" />
                <Button size="sm" onClick={addNote}>Add</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send quotation modal */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send quotation</DialogTitle>
            <DialogDescription>Confirm pricing and terms before dispatching to {q.customerName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Products</span><span className="font-semibold">{items.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total units</span><span className="font-semibold">{items.reduce((s, i) => s + i.quantity, 0)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 text-base"><span className="font-semibold">Quoted total</span><span className="font-display text-xl font-bold text-primary">{formatBDT(quotedTotal)}</span></div>
            {validUntil && <div className="text-xs text-muted-foreground">Valid until {formatDate(validUntil)}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button onClick={sendQuote}><Send className="mr-1 size-4" /> Send quotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to order */}
      <AlertDialog open={convertOpen} onOpenChange={setConvertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert RFQ to Order?</AlertDialogTitle>
            <AlertDialogDescription>A new confirmed order will be created with all {items.length} line item{items.length !== 1 ? "s" : ""} at their quoted prices ({formatBDT(quotedTotal)}). You can then finalize shipping and payment on the order page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={convertToOrder}>Create order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this RFQ?</AlertDialogTitle>
            <AlertDialogDescription>The customer will see this quotation as rejected. This can still be reopened by changing the status.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={reject}>Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TermField({ label, value, editing, onChange, placeholder, type }: { label: string; value: string; editing: boolean; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{label}</Label>
      {editing ? (
        <Input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <div className="text-sm">{value ? (type === "date" ? formatDate(value) : value) : <span className="text-muted-foreground">{placeholder ?? "—"}</span>}</div>
      )}
    </div>
  );
}
