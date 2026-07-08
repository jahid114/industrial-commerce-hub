import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Eye, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { generateInvoice, generateOrdersReport } from "@/lib/pdf";
import { ALL_ORDER_STATUSES, derivePaymentStatus } from "@/lib/order-workflow";
import { resolveAgentInfo } from "@/data/agents";
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
  const [sourceFilter, setSourceFilter] = useState<"all" | "agent" | "direct">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (payFilter !== "all" && derivePaymentStatus(o) !== payFilter) return false;
    if (sourceFilter === "agent" && !o.agentId) return false;
    if (sourceFilter === "direct" && o.agentId) return false;
    if (search && !`${o.id} ${o.customerName}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [orders, statusFilter, payFilter, sourceFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { setPage(1); }, [search, statusFilter, payFilter, sourceFilter, pageSize]);
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const paged = filtered.slice(startIdx, startIdx + pageSize);

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
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as typeof sourceFilter)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="agent">Agent Orders</SelectItem>
            <SelectItem value="direct">Direct Orders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Payment</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.map((o) => {
              const pay = derivePaymentStatus(o);
              const agentInfo = resolveAgentInfo(o.agentId);
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
                  <td className="px-4 py-3">
                    {agentInfo ? (
                      <div>
                        <Badge className="bg-accent/20 text-accent-foreground border-accent/40" variant="outline">
                          <UserCheck className="size-3 mr-1" /> Agent
                        </Badge>
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-1">{agentInfo.name}</div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Direct</Badge>
                    )}
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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="ml-2">
            {filtered.length === 0 ? "0" : `${startIdx + 1}–${Math.min(startIdx + pageSize, filtered.length)}`} of {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(1)}>« First</Button>
          <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
          <span className="px-3 text-xs text-muted-foreground">Page {currentPage} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>Last »</Button>
        </div>
      </div>
    </div>
  );
}
