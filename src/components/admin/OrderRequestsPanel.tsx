import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBDT, formatDate } from "@/lib/format";
import {
  ORDER_REQUEST_STATUS_COLOR,
  updateOrderRequestStatus,
  useOrderRequests,
  type OrderRequestStatus,
  type OrderRequestType,
} from "@/lib/order-requests";

const STATUSES: OrderRequestStatus[] = ["Requested", "Approved", "Rejected", "Completed"];

export function OrderRequestsPanel({ type }: { type: OrderRequestType }) {
  const all = useOrderRequests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-secondary align-top">
                <td className="px-4 py-3 font-semibold">{r.id}</td>
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
                  <div className="flex justify-end gap-1">
                    <Select value={r.status} onValueChange={(v) => updateOrderRequestStatus(r.id, v as OrderRequestStatus)}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/orders/$orderId" params={{ orderId: r.orderId }}>
                        <Eye className="size-3 mr-1" /> Order
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
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
    </div>
  );
}
