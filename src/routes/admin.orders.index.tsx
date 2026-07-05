import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { generateInvoice, generateOrdersReport } from "@/lib/pdf";
import { ALL_ORDER_STATUSES, derivePaymentStatus } from "@/lib/order-workflow";
import type { OrderStatus, PaymentStatus } from "@/data/types";

export const Route = createFileRoute("/admin/orders/")({
  head: () => ({ meta: [{ title: "Manage Orders — Admin" }] }),
  component: AdminOrdersPage,
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

function AdminOrdersPage() {
  const { orders } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payFilter, setPayFilter] = useState<string>("all");

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (payFilter !== "all" && derivePaymentStatus(o) !== payFilter) return false;
    if (search && !`${o.id} ${o.customerName}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {orders.length} orders</p>
        </div>
        <Button onClick={() => generateOrdersReport(filtered, "Orders Report")} className="font-bold uppercase">
          <FileText className="size-4 mr-2" /> Export PDF
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
        <Input placeholder="Search by Order ID or customer…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={payFilter} onValueChange={setPayFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            {["Unpaid", "Partial", "Paid", "Refunded"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
            {filtered.map((o) => {
              const pay = derivePaymentStatus(o);
              return (
                <tr key={o.id} className="hover:bg-secondary">
                  <td className="px-4 py-3">
                    <Link to="/admin/orders/$orderId" params={{ orderId: o.id }} className="font-semibold text-primary hover:underline">
                      {o.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{o.customerName}</div>
                    <div className="text-xs text-muted-foreground">{o.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(o.date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="w-fit">{o.paymentMethod}</Badge>
                      <Badge className={`w-fit ${paymentColor[pay]}`}>{pay}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusColor[o.status]}>{o.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-display font-bold text-primary">{formatBDT(o.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/admin/orders/$orderId" params={{ orderId: o.id }}>
                          <Eye className="size-3 mr-1" /> View
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => generateInvoice(o)}>
                        <Download className="size-3 mr-1" /> Invoice
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
