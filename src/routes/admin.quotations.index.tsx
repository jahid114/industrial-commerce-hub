import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { ALL_QUOTATION_STATUSES, QUOTATION_STATUS_COLOR } from "@/lib/quotation-workflow";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/quotations/")({
  head: () => ({
    meta: [
      { title: "Manage Quotations — Admin" },
      { name: "description", content: "Review, quote, and track all customer RFQs across products." },
    ],
  }),
  component: AdminQuotationsPage,
});

const PAGE_SIZE = 10;

function AdminQuotationsPage() {
  const { quotations, dispatch } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const safeQuotations = useMemo(
    () => quotations.filter((q) => q && Array.isArray(q.items)),
    [quotations],
  );

  const customers = useMemo(() => {
    const map = new Map<string, string>();
    safeQuotations.forEach((r) => {
      const email = r.customerEmail?.trim();
      if (email && !map.has(email)) map.set(email, r.customerName ?? email);
    });
    return Array.from(map.entries())
      .map(([email, name]) => ({ email, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [safeQuotations]);


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return safeQuotations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (customerFilter !== "all" && r.customerEmail !== customerFilter) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        (r.customerName ?? "").toLowerCase().includes(q) ||
        (r.customerEmail ?? "").toLowerCase().includes(q) ||
        (r.company?.toLowerCase().includes(q) ?? false) ||
        r.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    });
  }, [safeQuotations, search, statusFilter, customerFilter, dateFrom, dateTo]);


  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (customerFilter !== "all" ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const resetFilters = () => {
    setStatusFilter("all");
    setCustomerFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const confirmDelete = () => {
    if (!pendingDelete) return;
    dispatch({ type: "UPDATE_QUOTATION", id: pendingDelete, patch: { status: "Rejected" } });
    // Soft-delete via status; if you need a hard delete, extend the reducer.
    toast.success("RFQ marked rejected");
    setPendingDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Quotation Requests</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {quotations.length} RFQs
            {activeFilterCount > 0 && <> · {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active</>}
          </p>
        </div>
        {activeFilterCount > 0 && (
          <Button size="sm" variant="outline" onClick={resetFilters}>
            <X className="mr-1.5 size-4" /> Clear filters
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_180px_220px_160px_160px]">
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="RFQ, customer, product…" className="pl-9" />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ALL_QUOTATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Customer</Label>
            <Select value={customerFilter} onValueChange={(v) => { setCustomerFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All customers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.email} value={c.email}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">From</Label>
            <Input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">To</Label>
            <Input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">RFQ</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Quoted total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.map((q) => {
              const first = q.items[0]?.productName ?? "—";
              const totalQty = q.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <tr key={q.id} className="hover:bg-secondary/50">
                  <td className="px-4 py-3 font-semibold">{q.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(q.date)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{q.customerName}</div>
                    <div className="text-xs text-muted-foreground">{q.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-[240px] truncate">{first}</div>
                    <div className="text-xs text-muted-foreground">
                      {q.items.length} product{q.items.length !== 1 ? "s" : ""} · {totalQty} units
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={QUOTATION_STATUS_COLOR[q.status]}>{q.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {q.quotedTotal ? formatBDT(q.quotedTotal) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="hover:text-primary" onClick={() => navigate({ to: "/admin/quotations/$rfqId", params: { rfqId: q.id } })}>
                        <Eye className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="hover:text-destructive" onClick={() => setPendingDelete(q.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No quotations match the filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {currentPage} of {pageCount}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this RFQ?</AlertDialogTitle>
            <AlertDialogDescription>This will move the request to Rejected status. You can still view it later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
