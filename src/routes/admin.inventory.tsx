import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, History, Boxes, AlertTriangle, RotateCcw, PackageX, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { products } from "@/data/products";
import { suppliers, getSupplier } from "@/data/suppliers";
import { formatBDT } from "@/lib/format";
import { toast } from "sonner";
import {
  useInventory,
  RETURN_REASONS,
  DAMAGE_REASONS,
  type ReturnReason,
  type ReturnCondition,
  type DamageReason,
  type MovementType,
} from "@/lib/inventory-store";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Admin" }] }),
  component: AdminInventoryPage,
});


const MOVEMENT_TYPES: MovementType[] = [
  "Adjustment", "Return", "Damage", "Restock", "Write-off", "Incoming", "Sale",
];

const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id;
const productSku = (id: string) => products.find((p) => p.id === id)?.sku ?? "—";
const productPrice = (id: string) => products.find((p) => p.id === id)?.price ?? 0;

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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function AdminInventoryPage() {
  const inv = useInventory();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("overview");
  const [movFilterProduct, setMovFilterProduct] = useState<string>("");
  const [movFilterType, setMovFilterType] = useState<string>("");

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState<string>(products[0]?.id ?? "");
  const [returnOpen, setReturnOpen] = useState(false);
  const [damagedOpen, setDamagedOpen] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .map((p) => {
        const rec = inv.records[p.id];
        const good = rec?.good ?? 0;
        const reserved = inv.reserved(p.id);
        const available = Math.max(0, good - reserved);
        const returned = rec?.returned ?? 0;
        const damaged = rec?.damaged ?? 0;
        const incoming = rec?.incoming ?? 0;
        const reorderLevel = rec?.reorderLevel ?? 0;
        let status: "In stock" | "Low" | "Out" = "In stock";
        if (available <= 0) status = "Out";
        else if (available <= reorderLevel) status = "Low";
        return { p, good, reserved, available, returned, damaged, incoming, reorderLevel, status };
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

  const movementsFiltered = useMemo(() => {
    return inv.movements.filter((m) => {
      if (movFilterProduct && m.productId !== movFilterProduct) return false;
      if (movFilterType && m.type !== movFilterType) return false;
      return true;
    });
  }, [inv.movements, movFilterProduct, movFilterType]);

  const openAdjustFor = (productId: string) => {
    setAdjustProductId(productId);
    setAdjustOpen(true);
  };

  const showHistoryFor = (productId: string) => {
    setMovFilterProduct(productId);
    setMovFilterType("");
    setTab("movements");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Track good stock, returns, damaged units and movements
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-lg">
                <RotateCcw className="size-4 mr-2" /> Log return
              </Button>
            </DialogTrigger>
            <LogReturnDialog onClose={() => setReturnOpen(false)} />
          </Dialog>
          <Dialog open={damagedOpen} onOpenChange={setDamagedOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-lg">
                <PackageX className="size-4 mr-2" /> Log damaged
              </Button>
            </DialogTrigger>
            <LogDamagedDialog onClose={() => setDamagedOpen(false)} />
          </Dialog>
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
        <Kpi label="Returns pending" value={kpis.pendingReturns.toString()} icon={<RotateCcw className="size-4" />} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-3">
        <TabsList className="rounded-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="damaged">Damaged</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-3">
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
                    <th className="px-3 py-3 text-right">Returned</th>
                    <th className="px-3 py-3 text-right">Damaged</th>
                    <th className="px-3 py-3 text-right">Incoming</th>
                    <th className="px-3 py-3 text-right">Reorder</th>
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
                      <td className="px-3 py-3 text-right">{r.returned}</td>
                      <td className="px-3 py-3 text-right">{r.damaged}</td>
                      <td className="px-3 py-3 text-right">{r.incoming}</td>
                      <td className="px-3 py-3 text-right">{r.reorderLevel}</td>
                      <td className="px-3 py-3">
                        <Badge
                          variant={r.status === "In stock" ? "outline" : "destructive"}
                          className={r.status === "Low" ? "bg-amber-500/15 text-amber-700 border-amber-500/30" : ""}
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right space-x-1 whitespace-nowrap">
                        <Button size="sm" className="rounded-lg" onClick={() => openAdjustFor(r.p.id)}>
                          <PackagePlus className="size-3.5 mr-1" /> Add stock
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => showHistoryFor(r.p.id)}>
                          <History className="size-3.5 mr-1" /> History
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No products match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* RETURNS */}
        <TabsContent value="returns">
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3 text-sm font-medium">
              Customer returns
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-left">Condition</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inv.returns.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary">
                      <td className="px-4 py-3 whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.orderId ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium line-clamp-1">{productName(r.productId)}</div>
                        <div className="text-xs text-muted-foreground font-mono">{productSku(r.productId)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">{r.quantity}</td>
                      <td className="px-4 py-3">{r.reason}</td>
                      <td className="px-4 py-3">{r.condition}</td>
                      <td className="px-4 py-3">
                        <Badge variant={r.status === "Pending" ? "outline" : "secondary"}>{r.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        {r.status === "Pending" ? (
                          <>
                            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => { inv.resolveReturn(r.id, "restock"); toast.success("Restocked to Good"); }}>
                              Restock
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => { inv.resolveReturn(r.id, "damage"); toast.success("Moved to Damaged"); }}>
                              Mark damaged
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => { inv.resolveReturn(r.id, "scrap"); toast.success("Scrapped"); }}>
                              Scrap
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {inv.returns.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No returns logged yet. Click <b>Log return</b> to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* DAMAGED */}
        <TabsContent value="damaged">
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3 text-sm font-medium">
              Damaged / bad stock
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-left">Notes</th>
                    <th className="px-4 py-3 text-left">Logged by</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inv.damaged.map((d) => (
                    <tr key={d.id} className="hover:bg-secondary">
                      <td className="px-4 py-3 whitespace-nowrap">{fmtDate(d.date)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium line-clamp-1">{productName(d.productId)}</div>
                        <div className="text-xs text-muted-foreground font-mono">{productSku(d.productId)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">{d.quantity}</td>
                      <td className="px-4 py-3">{d.reason}</td>
                      <td className="px-4 py-3 text-muted-foreground line-clamp-1">{d.note ?? "—"}</td>
                      <td className="px-4 py-3">{d.loggedBy}</td>
                      <td className="px-4 py-3">
                        <Badge variant={d.status === "Open" ? "outline" : "secondary"}>{d.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {d.status === "Open" ? (
                          <Button size="sm" variant="outline" className="rounded-lg" onClick={() => { inv.writeOffDamaged(d.id); toast.success("Wrote off damaged units"); }}>
                            Write off
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {inv.damaged.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No damaged stock logged. Click <b>Log damaged</b> to add an entry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* MOVEMENTS */}
        <TabsContent value="movements">
          <div className="rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
              <div className="text-sm font-medium mr-auto">Stock movements ({movementsFiltered.length})</div>
              <select className={selectCls() + " max-w-[220px]"} value={movFilterProduct} onChange={(e) => setMovFilterProduct(e.target.value)}>
                <option value="">All products</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className={selectCls() + " max-w-[180px]"} value={movFilterType} onChange={(e) => setMovFilterType(e.target.value)}>
                <option value="">All types</option>
                {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {(movFilterProduct || movFilterType) && (
                <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => { setMovFilterProduct(""); setMovFilterType(""); }}>
                  Clear
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-3 py-3 text-right">Δ Good</th>
                    <th className="px-3 py-3 text-right">Δ Returned</th>
                    <th className="px-3 py-3 text-right">Δ Damaged</th>
                    <th className="px-3 py-3 text-right">Δ Incoming</th>
                    <th className="px-4 py-3 text-left">Note</th>
                    <th className="px-4 py-3 text-left">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movementsFiltered.map((m) => (
                    <tr key={m.id} className="hover:bg-secondary">
                      <td className="px-4 py-3 whitespace-nowrap">{fmtDate(m.date)}</td>
                      <td className="px-4 py-3">
                        <div className="line-clamp-1">{productName(m.productId)}</div>
                        <div className="text-xs text-muted-foreground font-mono">{productSku(m.productId)}</div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline">{m.type}</Badge></td>
                      <td className={`px-3 py-3 text-right ${m.deltaGood ? "" : "text-muted-foreground"}`}>{deltaLabel(m.deltaGood)}</td>
                      <td className={`px-3 py-3 text-right ${m.deltaReturned ? "" : "text-muted-foreground"}`}>{deltaLabel(m.deltaReturned)}</td>
                      <td className={`px-3 py-3 text-right ${m.deltaDamaged ? "" : "text-muted-foreground"}`}>{deltaLabel(m.deltaDamaged)}</td>
                      <td className={`px-3 py-3 text-right ${m.deltaIncoming ? "" : "text-muted-foreground"}`}>{deltaLabel(m.deltaIncoming)}</td>
                      <td className="px-4 py-3 text-muted-foreground line-clamp-1">{m.note ?? "—"}</td>
                      <td className="px-4 py-3">{m.user}</td>
                    </tr>
                  ))}
                  {movementsFiltered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No movements recorded{movFilterProduct || movFilterType ? " for this filter." : " yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function deltaLabel(n: number) {
  if (!n) return "—";
  return n > 0 ? `+${n}` : `${n}`;
}

function Kpi({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone?: "warn" }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${tone === "warn" ? "" : ""}`}>
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className={tone === "warn" ? "text-amber-600" : "text-primary"}>{icon}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

/* ---------- Dialogs ---------- */

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

  const rec = inv.records[productId];
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
          <Field label="Reference / PO # (optional)">
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="PO-2026-…" />
          </Field>
        </div>
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

function Bucket({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-spec px-2 py-1.5 text-center">
      <div className="uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function LogReturnDialog({ onClose }: { onClose: () => void }) {
  const inv = useInventory();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<ReturnReason>(RETURN_REASONS[0]);
  const [condition, setCondition] = useState<ReturnCondition>("Inspect");
  const [orderId, setOrderId] = useState("");
  const [note, setNote] = useState("");

  const submit = () => {
    if (quantity <= 0) return toast.error("Quantity must be at least 1");
    inv.logReturn({
      productId,
      quantity,
      reason,
      condition,
      orderId: orderId.trim() || undefined,
      note: note || undefined,
    });
    toast.success("Return logged");
    setQuantity(1); setOrderId(""); setNote("");
    onClose();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Log a return</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <Field label="Product">
          <select className={selectCls()} value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </Field>
          <Field label="Order # (optional)">
            <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="MH-2026-…" />
          </Field>
          <Field label="Reason">
            <select className={selectCls()} value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)}>
              {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Condition">
            <select className={selectCls()} value={condition} onChange={(e) => setCondition(e.target.value as ReturnCondition)}>
              <option value="Resellable">Resellable</option>
              <option value="Inspect">Needs inspection</option>
              <option value="Damaged">Damaged</option>
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <p className="text-xs text-muted-foreground">
          Logging a return adds <b>{quantity || 0}</b> unit(s) to the <b>Returned</b> bucket for {productName(productId)}.
          Estimated value: {formatBDT((quantity || 0) * productPrice(productId))}.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" className="rounded-lg" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} className="rounded-lg font-bold uppercase">Log return</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function LogDamagedDialog({ onClose }: { onClose: () => void }) {
  const inv = useInventory();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
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
        <Field label="Product">
          <select className={selectCls()} value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </Field>
          <Field label="Reason">
            <select className={selectCls()} value={reason} onChange={(e) => setReason(e.target.value as DamageReason)}>
              {DAMAGE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <p className="text-xs text-muted-foreground">
          Moves <b>{quantity || 0}</b> unit(s) of {productName(productId)} from <b>Good</b> to <b>Damaged</b>.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" className="rounded-lg" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} className="rounded-lg font-bold uppercase">Log damaged</Button>
      </DialogFooter>
    </DialogContent>
  );
}
