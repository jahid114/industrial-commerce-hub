import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatBDT, formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { appendEvent, nowIso } from "@/lib/order-workflow";
import {
  REFUND_NEXT,
  REFUND_STATUS_COLOR,
  patchRefundRequest,
  useRefundRequests,
  type RefundRequest,
  type RefundStatus,
} from "@/lib/refund-requests";

const STATUSES: RefundStatus[] = ["Pending", "Processing", "Complete", "Rejected"];

export function RefundsPanel() {
  const all = useRefundRequests();
  const { orders, dispatch, user } = useStore();
  const actor = user?.name ?? user?.email ?? "Admin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const nameOf = (r: RefundRequest) => orders.find((o) => o.id === r.orderId)?.customerName ?? r.customerName ?? r.customerEmail;
  const rows = useMemo(
    () =>
      all.filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        return !search || `${r.id} ${r.orderId} ${nameOf(r)}`.toLowerCase().includes(search.toLowerCase());
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, orders, statusFilter, search],
  );

  const logOnOrder = (orderId: string, message: string, extra: object = {}) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const timeline = appendEvent(order, { at: nowIso(), by: actor, type: "payment", message });
    dispatch({ type: "UPDATE_ORDER", id: orderId, patch: { ...extra, timeline } });
  };

  const advance = (r: RefundRequest) => {
    const next = REFUND_NEXT[r.status];
    if (!next) return;
    patchRefundRequest(r.id, { status: next });
    if (next === "Complete") {
      logOnOrder(r.orderId, `Refund ${r.id} completed (${formatBDT(r.amount)} via ${r.account.method})`, { paymentStatus: "Refunded" });
    } else {
      logOnOrder(r.orderId, `Refund ${r.id} processing started`);
    }
  };

  const reject = (r: RefundRequest, reason: string) => {
    patchRefundRequest(r.id, { status: "Rejected", rejectionReason: reason });
    logOnOrder(r.orderId, `Refund ${r.id} rejected: ${reason}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
        <Input
          placeholder="Search refunds by request, order or customer…"
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
              <th className="px-4 py-3 text-left">Receive Via</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const a = r.account;
              const next = REFUND_NEXT[r.status];
              return (
                <tr key={r.id} className="hover:bg-secondary align-top">
                  <td className="px-4 py-3 font-semibold">{r.id}</td>
                  <td className="px-4 py-3">
                    <Link to="/admin/orders/$orderId" params={{ orderId: r.orderId }} className="font-semibold text-primary hover:underline">
                      {r.orderId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {nameOf(r)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-semibold text-sm">{a.method}</div>
                    {a.method === "Bank" ? (
                      <div className="text-muted-foreground">
                        {a.bankName}, {a.branchName}
                        <br />Routing {a.routingNumber} · A/C {a.accountNumber}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">{a.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-display font-bold text-primary">{formatBDT(r.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge className={REFUND_STATUS_COLOR[r.status]}>{r.status}</Badge>
                    {r.rejectionReason && <div className="mt-1 max-w-[12rem] text-xs text-destructive">{r.rejectionReason}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {next && (
                        <Button size="sm" className="rounded-lg" onClick={() => advance(r)}>
                          {r.status === "Pending" ? "Start Processing" : "Complete"}
                        </Button>
                      )}
                      {(r.status === "Pending" || r.status === "Processing") && (
                        <RejectDialog cancel={r.status === "Processing"} onConfirm={(reason) => reject(r, reason)} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No refund requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RejectDialog({ onConfirm, cancel }: { onConfirm: (reason: string) => void; cancel?: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <AlertDialog onOpenChange={(open) => { if (!open) setReason(""); }}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive">
          {cancel ? "Cancel" : "Reject"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{cancel ? "Cancel this refund?" : "Reject this refund request?"}</AlertDialogTitle>
          <AlertDialogDescription>Provide a reason — this will be visible to the customer.</AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        <AlertDialogFooter>
          <AlertDialogCancel>Back</AlertDialogCancel>
          <AlertDialogAction
            disabled={reason.trim().length < 3}
            onClick={() => onConfirm(reason.trim())}
            className="bg-destructive text-destructive-foreground"
          >
            {cancel ? "Cancel refund" : "Reject refund"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
