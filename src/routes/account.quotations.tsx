import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";

export const Route = createFileRoute("/account/quotations")({
  head: () => ({ meta: [{ title: "My Quotations — MegaHaus" }] }),
  component: QuotationsPage,
});

function QuotationsPage() {
  const { quotations, user } = useStore();
  const mine = quotations.filter((q) => q.customerEmail === user?.email);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="font-display text-xl font-bold">My Quotation Requests</h2>
        <p className="text-sm text-muted-foreground">{mine.length} requests</p>
      </div>
      {mine.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">No quotations yet. <Link to="/quotation" className="text-primary hover:underline">Request one</Link></div>
      ) : (
        <div className="divide-y divide-border">
          {mine.map((q) => (
            <div key={q.id} className="p-5 hover:bg-secondary">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">{q.id} · {formatDate(q.date)}</div>
                  <div className="mt-1 font-display text-lg font-bold">{q.productName}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Qty: {q.quantity} · {q.message.slice(0, 80)}{q.message.length > 80 ? "…" : ""}</div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={q.status === "Quoted" ? "border-success text-success" : q.status === "Accepted" ? "bg-success text-white" : ""}>{q.status}</Badge>
                  {q.quotedPrice && <div className="mt-2 font-display text-lg font-bold text-primary">{formatBDT(q.quotedPrice)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
