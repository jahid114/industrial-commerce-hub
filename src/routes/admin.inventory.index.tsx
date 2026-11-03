import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, History, Boxes, AlertTriangle, PackageX, PackagePlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { products } from "@/data/products";
import { suppliers, getSupplier } from "@/data/suppliers";
import { formatBDT } from "@/lib/format";
import { toast } from "sonner";
import { useInventory } from "@/lib/inventory-store";

export const Route = createFileRoute("/admin/inventory/")({
  head: () => ({ meta: [{ title: "Inventory — Admin" }] }),
  component: AdminInventoryPage,
});

function selectCls() {
  return "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

function AdminInventoryPage() {
  const inv = useInventory();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState<string>(products[0]?.id ?? "");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .map((p) => {
        const rec = inv.records[p.id];
        const good = rec?.good ?? 0;
        const reserved = inv.reserved(p.id);
        const available = Math.max(0, good - reserved);
        const sold = rec?.sold ?? 0;
        const returned = rec?.returned ?? 0;
        const damaged = rec?.damaged ?? 0;
        const reorderLevel = rec?.reorderLevel ?? 0;
        let status: "In stock" | "Low" | "Out" = "In stock";
        if (available <= 0) status = "Out";
        else if (available <= reorderLevel) status = "Low";
        return { p, good, reserved, available, sold, returned, damaged, reorderLevel, status };
      })
      .filter((r) =>
        q ? `${r.p.name} ${r.p.sku}`.toLowerCase().includes(q) : true,
      );
  }, [inv, search]);

  const kpis = useMemo(() => {
    let goodValue = 0;
    let lowCount = 0;
    let damagedUnits = 0;
    for (const r of rows) {
      goodValue += r.good * r.p.price;
      if (r.status === "Low" || r.status === "Out") lowCount++;
      damagedUnits += r.damaged;
    }
    const pendingReturns = inv.returns.filter((r) => r.status === "Pending").length;
    return { goodValue, lowCount, damagedUnits, pendingReturns };
  }, [rows, inv.returns]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Good stock, reservations and sold units — open a product's History for its full movement ledger
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg font-bold uppercase">
                <Plus className="size-4 mr-2" /> Add stock
              </Button>
            </DialogTrigger>
            <AddStockDialog
              productId={adjustProductId}
              onProductChange={setAdjustProductId}
              onClose={() => setAdjustOpen(false)}
            />
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Total SKUs" value={products.length.toString()} icon={<Boxes className="size-4" />} />
        <Kpi label="Good stock value" value={formatBDT(kpis.goodValue)} icon={<Boxes className="size-4" />} />
        <Kpi label="Low / Out SKUs" value={kpis.lowCount.toString()} icon={<AlertTriangle className="size-4" />} tone="warn" />
        <Kpi label="Damaged units" value={kpis.damagedUnits.toString()} icon={<PackageX className="size-4" />} tone="warn" />
        <Kpi label="Returns pending" value={kpis.pendingReturns.toString()} icon={<CheckCircle2 className="size-4" />} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-3 py-3 text-right">Good</th>
                <th className="px-3 py-3 text-right">Reserved</th>
                <th className="px-3 py-3 text-right">Available</th>
                <th className="px-3 py-3 text-right">Sold</th>
                <th className="px-3 py-3 text-right">Returned</th>
                <th className="px-3 py-3 text-right">Damaged</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.p.id} className="hover:bg-secondary">
                  <td className="px-4 py-3">
                    <div className="font-medium line-clamp-1">{r.p.name}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.p.sku}</td>
                  <td className="px-3 py-3 text-right">{r.good}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">{r.reserved}</td>
                  <td className="px-3 py-3 text-right font-semibold">{r.available}</td>
                  <td className="px-3 py-3 text-right">{r.sold}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">{r.returned}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">{r.damaged}</td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={r.status === "In stock" ? "outline" : "destructive"}
                      className={r.status === "Low" ? "bg-amber-500/15 text-amber-700 border-amber-500/30" : ""}
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right space-x-1 whitespace-nowrap">
                    <Button size="sm" className="rounded-lg" onClick={() => { setAdjustProductId(r.p.id); setAdjustOpen(true); }}>
                      <PackagePlus className="size-3.5 mr-1" /> Add stock
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg"
                      onClick={() => navigate({ to: "/admin/inventory/$productId", params: { productId: r.p.id } })}
                    >
                      <History className="size-3.5 mr-1" /> History
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No products match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone?: "warn" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className={tone === "warn" ? "text-amber-600" : "text-primary"}>{icon}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function AddStockDialog({ productId, onProductChange, onClose }: {
  productId: string;
  onProductChange: (id: string) => void;
  onClose: () => void;
}) {
  const inv = useInventory();
  const product = products.find((p) => p.id === productId);
  const defaultSupplier = product?.supplierId ?? suppliers[0]?.id ?? "";
  const [supplierId, setSupplierId] = useState(defaultSupplier);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<string>("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const supplier = getSupplier(supplierId);
  const cost = Number(unitCost) || 0;
  const total = cost * (quantity || 0);

  const submit = () => {
    const qty = Math.abs(Math.floor(quantity || 0));
    if (!qty) return toast.error("Enter a quantity of at least 1");
    if (!supplierId) return toast.error("Select a supplier");
    const parts = [`Supplier: ${supplier?.name ?? supplierId}`];
    if (reference.trim()) parts.push(`Ref: ${reference.trim()}`);
    if (cost > 0) parts.push(`Unit cost: ${formatBDT(cost)}`);
    if (note.trim()) parts.push(note.trim());
    inv.adjust({
      productId,
      bucket: "good",
      delta: qty,
      note: parts.join(" • "),
    });
    toast.success(`Added ${qty} unit(s) to Good stock`);
    setQuantity(1); setUnitCost(""); setReference(""); setNote("");
    onClose();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Add stock</DialogTitle></DialogHeader>
      <div className="grid gap-4">
        <Field label="Product">
          <select
            className={selectCls()}
            value={productId}
            onChange={(e) => {
              onProductChange(e.target.value);
              const next = products.find((p) => p.id === e.target.value);
              if (next?.supplierId) setSupplierId(next.supplierId);
            }}
          >
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
        </Field>
        <Field label="Supplier">
          <select className={selectCls()} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Select supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {s.country}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </Field>
          <Field label="Unit cost (৳, optional)">
            <Input type="number" min={0} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field label="Reference / PO # (optional)">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="PO-2026-…" />
        </Field>
        <Field label="Notes">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. shipment received at warehouse A" />
        </Field>
        {total > 0 && (
          <p className="text-xs text-muted-foreground">
            Total received value: <b>{formatBDT(total)}</b>
          </p>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" className="rounded-lg" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} className="rounded-lg font-bold uppercase">Add stock</Button>
      </DialogFooter>
    </DialogContent>
  );
}
