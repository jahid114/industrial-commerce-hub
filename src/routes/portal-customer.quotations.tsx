import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { QUOTATION_STATUS_COLOR } from "@/lib/quotation-workflow";

export const Route = createFileRoute("/portal-customer/quotations")({
  head: () => ({ meta: [{ title: "My Quotations — Portal" }] }),
  component: QuotationsPage,
});

function QuotationsPage() {
  const { quotations, user } = useStore();
  const mine = quotations.filter((q) => q.customerEmail === user?.email);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="font-display text-xl font-bold">My Quotation Requests</h2>
          <p className="text-sm text-muted-foreground">{mine.length} requests</p>
        </div>
        <Link to="/quotation" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          + New Quotation
        </Link>
      </div>
      {mine.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          No quotations yet. <Link to="/quotation" className="text-primary hover:underline">Request one</Link>
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
                  <div className="text-right">
                    <Badge className={QUOTATION_STATUS_COLOR[q.status]}>{q.status}</Badge>
                    {q.quotedTotal && <div className="mt-2 font-display text-lg font-bold text-primary">{formatBDT(q.quotedTotal)}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
