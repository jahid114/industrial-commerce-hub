import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import type { QuotationStatus } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/quotations")({
  head: () => ({ meta: [{ title: "Manage Quotations — Admin" }] }),
  component: AdminQuotationsPage,
});

const STATUSES: QuotationStatus[] = ["Open", "Quoted", "Accepted", "Closed"];

function AdminQuotationsPage() {
  const { quotations, dispatch } = useStore();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  const filtered = quotations.filter((q) => statusFilter === "all" || q.status === statusFilter);

  const updateStatus = (id: string, status: QuotationStatus) => {
    dispatch({ type: "UPDATE_QUOTATION", id, patch: { status } });
    toast.success("RFQ updated");
  };

  const sendQuote = (id: string) => {
    const price = Number(priceInputs[id]);
    if (!price) return toast.error("Enter a price");
    dispatch({ type: "UPDATE_QUOTATION", id, patch: { status: "Quoted", quotedPrice: price } });
    toast.success("Quotation sent");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Quotation Requests</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {quotations.length} RFQs</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((q) => (
          <div key={q.id} className="border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-muted-foreground">{q.id} · {formatDate(q.date)}</div>
                <div className="mt-1 font-display text-lg font-bold">{q.productName}</div>
                <div className="mt-2 text-sm">From <strong>{q.customerName}</strong> {q.company && <span className="text-muted-foreground">({q.company})</span>} · <span className="text-muted-foreground">{q.customerEmail}</span></div>
                <div className="mt-1 text-sm">Quantity: <strong>{q.quantity}</strong></div>
                <p className="mt-3 rounded bg-secondary p-3 text-sm text-muted-foreground">"{q.message}"</p>
              </div>
              <div className="flex flex-col items-end gap-3 min-w-[240px]">
                <Badge className={q.status === "Quoted" ? "bg-accent text-accent-foreground" : q.status === "Accepted" ? "bg-success text-white" : ""}>{q.status}</Badge>
                {q.quotedPrice && <div className="font-display text-xl font-bold text-primary">{formatBDT(q.quotedPrice)}</div>}
                {q.status === "Open" && (
                  <div className="flex gap-2 w-full">
                    <Input type="number" placeholder="Quoted price" value={priceInputs[q.id] ?? ""} onChange={(e) => setPriceInputs({ ...priceInputs, [q.id]: e.target.value })} />
                    <Button onClick={() => sendQuote(q.id)} className="shrink-0 font-semibold">Send Quote</Button>
                  </div>
                )}
                <Select value={q.status} onValueChange={(v) => updateStatus(q.id, v as QuotationStatus)}>
                  <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
