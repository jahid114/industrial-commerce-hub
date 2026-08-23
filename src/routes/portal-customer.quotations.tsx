import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { QUOTATION_STATUS_COLOR, QUOTATION_STAGES, quotationStageIndex } from "@/lib/quotation-workflow";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal-customer/quotations")({
  head: () => ({ meta: [{ title: "My Quotations — Portal" }] }),
  component: QuotationsPage,
});

function QuotationsPage() {
  const { quotations, user } = useStore();
  const mine = quotations.filter((q) => q.customerEmail === user?.email);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = mine.find((q) => q.id === selectedId);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="font-display text-xl font-bold">My Quotation Requests</h2>
          <p className="text-sm text-muted-foreground">{mine.length} requests</p>
        </div>
        <Link to="/portal-customer/quotation" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          + New Quotation
        </Link>
      </div>
      {mine.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          No quotations yet. <Link to="/portal-customer/quotation" className="text-primary hover:underline">Request one</Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {mine.map((q) => {
            const first = q.items[0];
            const extra = q.items.length - 1;
            const totalQty = q.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <div key={q.id} className="p-5 hover:bg-secondary">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-muted-foreground">{q.id} · {formatDate(q.date)}</div>
                    <div className="mt-1 font-display text-lg font-bold">
                      {first?.productName ?? "—"}
                      {extra > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">and {extra} more</span>}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {q.items.length} product{q.items.length !== 1 ? "s" : ""} · {totalQty} units · {q.message.slice(0, 80)}{q.message.length > 80 ? "…" : ""}
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-right">
                      <Badge className={QUOTATION_STATUS_COLOR[q.status]}>{q.status}</Badge>
                      {q.quotedTotal && <div className="mt-2 font-display text-lg font-bold text-primary">{formatBDT(q.quotedTotal)}</div>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedId(q.id)}
                    >
                      <Eye className="mr-1.5 size-4" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Quotation {selected.id}</DialogTitle>
                <DialogDescription>
                  Submitted on {formatDate(selected.date)} · {selected.items.length} product{selected.items.length !== 1 ? "s" : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                <div className="flex flex-wrap gap-2">
                  {QUOTATION_STAGES.map((s, i) => {
                    const stageIdx = quotationStageIndex(selected.status);
                    return (
                      <span
                        key={s}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          i <= stageIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {s}
                      </span>
                    );
                  })}
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary text-left text-xs font-semibold uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2">Product</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Unit price</th>
                        <th className="px-4 py-2 text-right">Line total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selected.items.map((it, idx) => (
                        <tr key={`${it.productId}-${idx}`}>
                          <td className="px-4 py-2">
                            <div className="font-medium">{it.productName}</div>
                            {it.notes && <div className="text-xs text-muted-foreground">{it.notes}</div>}
                          </td>
                          <td className="px-4 py-2 text-right">{it.quantity}</td>
                          <td className="px-4 py-2 text-right">
                            {it.quotedPrice ? formatBDT(it.quotedPrice) : <span className="text-muted-foreground">Pending</span>}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold">
                            {it.quotedPrice ? formatBDT(it.quotedPrice * it.quantity) : <span className="text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem label="Quoted total" value={selected.quotedTotal ? formatBDT(selected.quotedTotal) : "Awaiting quote"} />
                  <DetailItem label="Valid until" value={selected.validUntil ? formatDate(selected.validUntil) : "—"} />
                  <DetailItem label="Payment terms" value={selected.paymentTerms ?? "—"} />
                  <DetailItem label="Delivery terms" value={selected.deliveryTerms ?? "—"} />
                </div>

                {selected.message && (
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">Your message</div>
                    <p className="mt-1 text-sm">{selected.message}</p>
                  </div>
                )}

                {selected.timeline && selected.timeline.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">Activity</div>
                    <ol className="mt-2 space-y-2">
                      {selected.timeline.map((e, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                          <div>
                            <div>{e.message}</div>
                            <div className="text-xs text-muted-foreground">{formatDate(e.at)} · {e.by}</div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {selected.convertedOrderId && (
                  <Link
                    to="/portal-customer/orders/$orderId"
                    params={{ orderId: selected.convertedOrderId }}
                    className="inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    View order {selected.convertedOrderId} →
                  </Link>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
