import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { products as seedProducts } from "@/data/products";
import { brands } from "@/data/brands";
import { categories } from "@/data/categories";
import { formatBDT } from "@/lib/format";
import { toast } from "sonner";
import type { Product } from "@/data/types";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Manage Products — Admin" }] }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()));

  const save = (data: Product) => {
    if (editing) {
      setProducts((ps) => ps.map((p) => (p.id === editing.id ? data : p)));
      toast.success("Product updated");
    } else {
      setProducts((ps) => [{ ...data, id: `new-${Date.now()}` }, ...ps]);
      toast.success("Product created");
    }
    setEditing(null);
    setOpen(false);
  };

  const remove = (id: string) => {
    setProducts((ps) => ps.filter((p) => p.id !== id));
    toast.success("Product deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} products in catalog</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button className="font-bold uppercase"><Plus className="size-4 mr-2" /> Add Product</Button></DialogTrigger>
          <ProductDialog editing={editing} onSave={save} />
        </Dialog>
      </div>

      <div className="border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="size-4 text-muted-foreground" />
          <Input placeholder="Search products by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} className="border-0 shadow-none focus-visible:ring-0" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Brand</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-secondary">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="size-10 object-cover bg-spec" />
                      <div>
                        <div className="font-medium line-clamp-1">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{categories.find((c) => c.id === p.categoryId)?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{brands.find((b) => b.id === p.brandId)?.name}</Badge></td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{formatBDT(p.price)}</td>
                  <td className="px-4 py-3 text-right">{p.stock}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Edit className="size-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="size-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductDialog({ editing, onSave }: { editing: Product | null; onSave: (p: Product) => void }) {
  const [form, setForm] = useState<Product>(editing ?? {
    id: "",
    name: "",
    brandId: brands[0].id,
    categoryId: categories[0].id,
    country: "Germany",
    price: 0,
    moq: 1,
    deliveryDays: "7-10 days",
    image: "https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=800&q=80",
    gallery: [],
    shortDescription: "",
    description: "",
    specs: [],
    supplierId: "bosch-de",
    stock: 0,
    sku: "",
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
      <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="SKU"><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
          <Field label="Brand">
            <select className="h-10 w-full border border-input bg-background px-3 text-sm" value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select className="h-10 w-full border border-input bg-background px-3 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Price (BDT)"><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
          <Field label="MOQ"><Input type="number" value={form.moq} onChange={(e) => setForm({ ...form, moq: Number(e.target.value) })} /></Field>
          <Field label="Stock"><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></Field>
          <Field label="Delivery"><Input value={form.deliveryDays} onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })} /></Field>
        </div>
        <Field label="Short description"><Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></Field>
        <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(form)} className="font-bold uppercase">{editing ? "Save Changes" : "Create Product"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block text-xs uppercase tracking-wider">{label}</Label>{children}</div>;
}
