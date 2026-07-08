import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Plus, Search, Trash2, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { ALL_ORDER_STATUSES } from "@/lib/order-workflow";
import type { Order, OrderStatus } from "@/data/types";
import { toast } from "sonner";
import { NewOrderDialog } from "@/components/agent/NewOrderDialog";
import { OrderDetailDialog } from "@/components/agent/OrderDetailDialog";

export const Route = createFileRoute("/portal/orders")({
  component: PortalOrdersPage,
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

function PortalOrdersPage() {
  const { orders, dispatch } = useStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [viewing, setViewing] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
    });
  }, [orders, query, statusFilter]);

  const remove = (o: Order) => {
    dispatch({ type: "REMOVE_ORDER", id: o.id });
    toast.success(`Order ${o.id} deleted`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My Orders</h1>
          <p className="text-sm text-muted-foreground">Orders placed on behalf of customers. Status is updated by admin.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="size-4 mr-1.5" />New Order</Button>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order ID or customer…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}>
          <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ALL_ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Commission</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No orders match.</td></tr>
            ) : filtered.map((o) => (
              <tr key={o.id} className="hover:bg-secondary/50">
                <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                <td className="px-4 py-3">{formatDate(o.date)}</td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3"><Badge className={statusColor[o.status]}>{o.status}</Badge></td>
                <td className="px-4 py-3 text-right">{formatBDT(o.total)}</td>
                <td className="px-4 py-3 text-right font-semibold text-success">{formatBDT(Math.round(o.total * 0.04))}</td>
                <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                  <Button size="icon" variant="ghost" onClick={() => setViewing(o)} className="text-primary hover:bg-primary/10 hover:text-primary" aria-label="View"><Eye className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleting(o)} className="text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label="Delete"><Trash2 className="size-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && orders.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <ShoppingBag className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
          <Button className="mt-3" onClick={() => setCreating(true)}><Plus className="size-4 mr-1.5" />Create your first order</Button>
        </div>
      )}

      <NewOrderDialog open={creating} onOpenChange={setCreating} />
      <OrderDetailDialog order={viewing} onOpenChange={(v) => { if (!v) setViewing(null); }} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently remove <strong>{deleting?.id}</strong> for {deleting?.customerName}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleting) remove(deleting); setDeleting(null); }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
