import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { orders } from "@/data/orders";
import { formatBDT, formatDate } from "@/lib/format";

export const Route = createFileRoute("/portal/commissions")({
  component: CommissionsPage,
});

function CommissionsPage() {
  const rows = orders.map((o, i) => ({
    id: o.id,
    date: o.date,
    customer: o.customerName,
    base: o.total,
    rate: 4 + (i % 3),
    amount: Math.round(o.total * (4 + (i % 3)) / 100),
    status: o.status === "Delivered" ? "Paid" : o.status === "Shipped" ? "Pending" : "Accruing",
  }));
  const paid = rows.filter((r) => r.status === "Paid").reduce((s, r) => s + r.amount, 0);
  const pending = rows.filter((r) => r.status === "Pending").reduce((s, r) => s + r.amount, 0);
  const accruing = rows.filter((r) => r.status === "Accruing").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Commission Ledger</h1>
        <p className="text-sm text-muted-foreground">Payouts processed monthly via bKash, Nagad or bank transfer.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Paid (YTD)" value={formatBDT(paid)} tone="success" />
        <Stat label="Pending Payout" value={formatBDT(pending)} tone="primary" />
        <Stat label="Accruing" value={formatBDT(accruing)} tone="muted" />
      </div>
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-right">Order ৳</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Commission</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                <td className="px-4 py-3">{formatDate(r.date)}</td>
                <td className="px-4 py-3">{r.customer}</td>
                <td className="px-4 py-3 text-right">{formatBDT(r.base)}</td>
                <td className="px-4 py-3 text-right">{r.rate}%</td>
                <td className="px-4 py-3 text-right font-semibold text-success">{formatBDT(r.amount)}</td>
                <td className="px-4 py-3"><Badge variant="outline">{r.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "success" | "primary" | "muted" }) {
  const color = tone === "success" ? "text-success" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
