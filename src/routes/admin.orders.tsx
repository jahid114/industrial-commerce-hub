import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { generateInvoice, generateOrdersReport } from "@/lib/pdf";
import type { OrderStatus } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Manage Orders — Admin" }] }),
  component: AdminOrdersPage,
});

const STATUSES: OrderStatus[] = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

function AdminOrdersPage() {
  const { orders, dispatch } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search && !`${o.id} ${o.customerName}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const updateStatus = (id: string, status: OrderStatus) => {
    dispatch({ type: "UPDATE_ORDER", id, patch: { status } });
    toast.success("Order updated");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {orders.length} orders</p>
        </div>
        <Button onClick={() => generateOrdersReport(filtered, "Orders Report")} className="font-bold uppercase"><FileText className="size-4 mr-2" /> Export PDF</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
        <Input placeholder="Search by Order ID or customer…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Payment</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-secondary">
                <td className="px-4 py-3 font-semibold">{o.id}</td>
                <td className="px-4 py-3">
                  <div>{o.customerName}</div>
                  <div className="text-xs text-muted-foreground">{o.customerEmail}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(o.date)}</td>
                <td className="px-4 py-3"><Badge variant="outline">{o.paymentMethod}</Badge></td>
                <td className="px-4 py-3">
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-right font-display font-bold text-primary">{formatBDT(o.total)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => generateInvoice(o)}><Download className="size-3 mr-1" /> Invoice</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
