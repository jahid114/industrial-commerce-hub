import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, PackageX, Boxes, Undo2, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TablePagination, paginate } from "@/components/admin/TableToolbar";
import { getProduct } from "@/data/products";
import { toast } from "sonner";
import {
  useInventory,
  DAMAGE_REASONS,
  type DamageReason,
  type MovementType,
} from "@/lib/inventory-store";

export const Route = createFileRoute("/admin/inventory/$productId")({
  loader: ({ params }) => {
    const product = getProduct(params.productId);
    if (!product) throw notFound();
    return { product };
  },
  head: () => ({ meta: [{ title: "Product Inventory History — Admin" }] }),
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <h1 className="font-display text-2xl font-bold">Product not found</h1>
      <Link to="/admin/inventory" className="mt-4 inline-block text-primary hover:underline">Back to inventory</Link>
    </div>
  ),
  component: ProductInventoryHistory,
});

const MOVEMENT_TYPES: MovementType[] = [
  "Reserve", "Release", "Fulfill", "ReturnReceived",
  "ReturnRestock", "ReturnDamage", "ReturnScrap", "DamageLogged", "Adjustment",
];

function selectCls() {
  return "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function ProductInventoryHistory() {
  const { productId } = Route.useParams();
  const { product } = Route.useLoaderData();
  const inv = useInventory();

  const rec = inv.records[productId];
  const good = rec?.good ?? 0;
  const reserved = inv.reserved(productId);
  const available = Math.max(0, good - reserved);
  const sold = rec?.sold ?? 0;
  const returned = rec?.returned ?? 0;
  const damaged = rec?.damaged ?? 0;

  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [damagedOpen, setDamagedOpen] = useState(false);
  const [correctOpen, setCorrectOpen] = useState(false);

  const movements = useMemo(() => {
    return inv.movements.filter((m) => {
      if (m.productId !== productId) return false;
      if (typeFilter && m.type !== typeFilter) return false;
      if (fromDate && m.date < fromDate) return false;
      if (toDate && m.date > `${toDate}T23:59:59`) return false;
      return true;
    });
  }, [inv.movements, productId, typeFilter, fromDate, toDate]);

  const pageRows = paginate(movements, page, pageSize);

  const productReturns = inv.returns.filter((r) => r.productId === productId);

  const openDamaged = inv.damaged.filter((d) => d.productId === productId && d.status === "Open");

  return (
    <div className="space-y-4">
      <div>
        <Link to="/admin/inventory" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-3.5 mr-1" /> Back to inventory
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold">{product.name}</h1>
          <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Good" value={good} />
        <Stat label="Reserved" value={reserved} />
        <Stat label="Available" value={available} highlight />
        <Stat label="Sold" value={sold} />
        <Stat label="Returned" value={returned} />
        <Stat label="Damaged" value={damaged} />
      </div>

      {openDamaged.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-medium">Open damaged entries</div>
            <div className="flex gap-2">
            <Dialog open={damagedOpen} onOpenChange={setDamagedOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-lg">
                  <PackageX className="size-3.5 mr-1.5" /> Log damaged
                </Button>
              </DialogTrigger>
              <LogDamagedDialog productId={productId} productName={product.name} onClose={() => setDamagedOpen(false)} />
            </Dialog>
          <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-lg">
                <Eraser className="size-3.5 mr-1.5" /> Correct wrong entry
              </Button>
            </DialogTrigger>
            <CorrectEntryDialog productId={productId} productName={product.name} available={available} onClose={() => setCorrectOpen(false)} />
          </Dialog>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-left">Logged by</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {openDamaged.map((d) => (
                  <tr key={d.id} className="hover:bg-secondary">
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(d.date)}</td>
                    <td className="px-4 py-3 text-right">{d.quantity}</td>
                    <td className="px-4 py-3">{d.reason}</td>
                    <td className="px-4 py-3 text-muted-foreground line-clamp-1">{d.note ?? "—"}</td>
                    <td className="px-4 py-3">{d.loggedBy}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => { inv.writeOffDamaged(d.id); toast.success("Wrote off damaged units"); }}>
                        Write off
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openDamaged.length === 0 && (
        <div className="flex justify-end gap-2">
          <Dialog open={damagedOpen} onOpenChange={setDamagedOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-lg">
                <PackageX className="size-3.5 mr-1.5" /> Log damaged
              </Button>
            </DialogTrigger>
            <LogDamagedDialog productId={productId} productName={product.name} onClose={() => setDamagedOpen(false)} />
          </Dialog>
          <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-lg">
                <Eraser className="size-3.5 mr-1.5" /> Correct wrong entry
              </Button>
            </DialogTrigger>
            <CorrectEntryDialog productId={productId} productName={product.name} available={available} onClose={() => setCorrectOpen(false)} />
          </Dialog>
        </div>
      )}

      {productReturns.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 text-sm font-medium">
            <Undo2 className="size-4 text-primary" /> Received returns ({productReturns.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Received</th>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Condition</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary">
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.orderId ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{r.quantity}</td>
                    <td className="px-4 py-3">{r.reason}</td>
                    <td className="px-4 py-3">{r.condition}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{r.status}</Badge></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      {r.status === "Pending" && (
                        <>
                          <Button size="sm" className="rounded-lg" onClick={() => { inv.resolveReturn(r.id, "restock"); toast.success("Restocked"); }}>Restock</Button>
                          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => { inv.resolveReturn(r.id, "damage"); toast.success("Marked damaged"); }}>Mark Damaged</Button>
                          <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => { inv.resolveReturn(r.id, "scrap"); toast.success("Scrapped"); }}>Scrap</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="text-sm font-medium mr-auto inline-flex items-center gap-1.5">
            <Boxes className="size-4 text-primary" /> Movement history ({movements.length})
          </div>
          <select className={selectCls() + " max-w-[180px]"} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All types</option>
            {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Input type="date" className="w-auto" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" className="w-auto" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
          {(typeFilter || fromDate || toDate) && (
            <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => { setTypeFilter(""); setFromDate(""); setToDate(""); setPage(1); }}>
              Clear
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">From → To</th>
                <th className="px-3 py-3 text-right">Units</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((m) => (
                <tr key={m.id} className="hover:bg-secondary">
                  <td className="px-4 py-3 whitespace-nowrap">{fmtDate(m.date)}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{m.type}</Badge></td>
                  <td className="px-4 py-3 whitespace-nowrap">{m.fromState} → {m.toState}</td>
                  <td className="px-3 py-3 text-right font-semibold">{m.quantity}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {m.reference ? (
                      m.reference.startsWith("MH-") ? (
                        <Link to="/admin/orders/$orderId" params={{ orderId: m.reference }} className="text-primary hover:underline">
                          {m.reference}
                        </Link>
                      ) : m.reference
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground line-clamp-1">{m.note ?? "—"}</td>
                  <td className="px-4 py-3">{m.user}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No movements recorded{typeFilter || fromDate || toDate ? " for this filter." : " yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {movements.length > 0 && (
          <div className="border-t border-border">
            <TablePagination total={movements.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}

function LogDamagedDialog({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) {
  const inv = useInventory();
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<DamageReason>(DAMAGE_REASONS[0]);
  const [note, setNote] = useState("");

  const submit = () => {
    if (quantity <= 0) return toast.error("Quantity must be at least 1");
    inv.logDamaged({ productId, quantity, reason, note: note || undefined });
    toast.success("Damaged stock logged");
    setQuantity(1); setNote("");
    onClose();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Log damaged stock</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div>
          <Label className="mb-1.5 block text-xs uppercase tracking-wider">Product</Label>
          <Input value={productName} disabled />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">Quantity</Label>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider">Reason</Label>
            <select className={selectCls()} value={reason} onChange={(e) => setReason(e.target.value as DamageReason)}>
              {DAMAGE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs uppercase tracking-wider">Notes</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">
          Moves <b>{quantity || 0}</b> unit(s) of {productName} from <b>Good</b> to <b>Damaged</b>.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" className="rounded-lg" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} className="rounded-lg font-bold uppercase">Log damaged</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CorrectEntryDialog({ productId, productName, available, onClose }: { productId: string; productName: string; available: number; onClose: () => void }) {
  const inv = useInventory();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  const submit = () => {
    if (!Number.isInteger(quantity) || quantity <= 0) return toast.error("Enter a whole number of at least 1");
    // Capped at available so units reserved for open orders are never removed.
    if (quantity > available) return toast.error(`Only ${available} unit(s) are available to remove (the rest are reserved for orders)`);
    if (note.trim().length < 3) return toast.error("Please explain what was entered wrong");
    inv.adjust({ productId, bucket: "good", delta: -quantity, note: `Wrong entry correction: ${note.trim()}` });
    toast.success(`Removed ${quantity} unit(s) from Good stock`);
    setQuantity(1); setNote("");
    onClose();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Correct wrong entry</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div>
          <Label className="mb-1.5 block text-xs uppercase tracking-wider">Product</Label>
          <Input value={productName} disabled />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs uppercase tracking-wider">Extra quantity to remove</Label>
          <Input type="number" min={1} max={available} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs uppercase tracking-wider">What was entered wrong?</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Typed 100 instead of 10 when adding stock" />
        </div>
        <p className="text-xs text-muted-foreground">
          Removes <b>{quantity || 0}</b> unit(s) from <b>Good</b> stock ({available} available). Logged in Movement history as an Adjustment.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" className="rounded-lg" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} className="rounded-lg font-bold uppercase">Remove stock</Button>
      </DialogFooter>
    </DialogContent>
  );
}
