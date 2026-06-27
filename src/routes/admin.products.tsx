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
import { suppliers } from "@/data/suppliers";
import { formatBDT } from "@/lib/format";
import { toast } from "sonner";
import { useInventory } from "@/lib/inventory-store";
import type { Product, Country, ProductSpec } from "@/data/types";

const COUNTRIES: Country[] = ["Germany", "Japan", "China", "USA", "Italy", "Switzerland"];

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Manage Products — Admin" }] }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const inv = useInventory();
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()));

  const save = (data: Product) => {
    if (editing) {
      setProducts((ps) => ps.map((p) => (p.id === editing.id ? data : p)));
      toast.success("Product updated — adjust stock from Inventory");
    } else {
      const id = `new-${Date.now()}`;
      setProducts((ps) => [{ ...data, id }, ...ps]);
      inv.registerProduct(id, data.stock);
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

      <div className="rounded-lg border border-border bg-card">
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
                <th className="px-4 py-3 text-right">Customer ৳</th>
                <th className="px-4 py-3 text-right">Agent ৳</th>
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
                  <td className="px-4 py-3 text-right text-accent-foreground"><span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">{formatBDT(p.agentPrice ?? Math.round(p.price * 0.92))}</span></td>
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
    agentPrice: undefined,
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
    tags: [],
    slug: "",
    subcategory: "",
  });
  const [tagInput, setTagInput] = useState((editing?.tags ?? []).join(", "));

  const suggestedAgent = Math.round((form.price || 0) * 0.92);
  const activeCategory = categories.find((c) => c.id === form.categoryId);

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleImageUpload = async (files: FileList | null, target: "image" | "gallery") => {
    if (!files || files.length === 0) return;
    const readers = Array.from(files).map(
      (f) =>
        new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(f);
        }),
    );
    const urls = await Promise.all(readers);
    if (target === "image") {
      setForm((f) => ({ ...f, image: urls[0], gallery: [...urls.slice(1), ...f.gallery] }));
    } else {
      setForm((f) => ({ ...f, gallery: [...f.gallery, ...urls] }));
    }
  };

  const submit = () => {
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    const slug = form.slug?.trim() ? slugify(form.slug) : slugify(form.name);
    const specs = form.specs.filter((s) => s.label.trim() && s.value.trim());
    onSave({ ...form, tags, slug, specs });
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
      <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} /></Field>
          <Field label="SKU"><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
          <Field label="Slug"><Input value={form.slug ?? ""} placeholder="auto-generated from name" onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
          <Field label="Brand">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value, subcategory: "" })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Sub-category">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.subcategory ?? ""} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}>
              <option value="">— Select —</option>
              {(activeCategory?.subcategories ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Country of origin">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value as Country })}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Supplier">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Customer Price (BDT)"><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
          <Field label={`Agent Price (BDT) — suggested ${suggestedAgent}`}>
            <Input
              type="number"
              placeholder={`auto: ${suggestedAgent}`}
              value={form.agentPrice ?? ""}
              onChange={(e) => setForm({ ...form, agentPrice: e.target.value === "" ? undefined : Number(e.target.value) })}
            />
          </Field>
          <Field label="MOQ"><Input type="number" value={form.moq} onChange={(e) => setForm({ ...form, moq: Number(e.target.value) })} /></Field>
          <Field label="Stock"><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></Field>
          <Field label="Delivery"><Input value={form.deliveryDays} onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })} /></Field>
          <Field label="Featured">
            <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm cursor-pointer">
              <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              <span className="text-muted-foreground">Show on homepage & featured rails</span>
            </label>
          </Field>
        </div>

        <Field label="Tags (comma separated)">
          <Input value={tagInput} placeholder="e.g. cordless, 18V, professional" onChange={(e) => setTagInput(e.target.value)} />
          {tagInput.trim() && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tagInput.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
        </Field>

        <Field label="Short description"><Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></Field>
        <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>

        <Field label="Primary image">
          <div className="flex items-center gap-3">
            {form.image && <img src={form.image} alt="" className="size-16 rounded-md object-cover bg-spec border border-border" />}
            <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-secondary">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files, "image")} />
              Upload image
            </label>
          </div>
        </Field>

        <Field label="Gallery images">
          <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-secondary">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e.target.files, "gallery")} />
            Upload gallery images
          </label>
          {form.gallery.length > 0 && (
            <div className="mt-2 grid grid-cols-5 gap-2">
              {form.gallery.map((g, i) => (
                <div key={i} className="relative group">
                  <img src={g} alt="" className="aspect-square w-full rounded-md object-cover bg-spec border border-border" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, gallery: f.gallery.filter((_, idx) => idx !== i) }))}
                    className="absolute top-0.5 right-0.5 rounded bg-background/90 p-0.5 opacity-0 group-hover:opacity-100 transition"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>

        <Field label="Specifications">
          <div className="space-y-2">
            {form.specs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input placeholder="Label (e.g. Voltage)" value={s.label} onChange={(e) => setForm((f) => ({ ...f, specs: f.specs.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x) }))} />
                <Input placeholder="Value (e.g. 18V)" value={s.value} onChange={(e) => setForm((f) => ({ ...f, specs: f.specs.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x) }))} />
                <Button type="button" size="icon" variant="ghost" onClick={() => setForm((f) => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i) }))}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setForm((f) => ({ ...f, specs: [...f.specs, { label: "", value: "" } as ProductSpec] }))}>
              <Plus className="size-3.5 mr-1.5" /> Add specification
            </Button>
          </div>
        </Field>
      </div>
      <DialogFooter>
        <Button onClick={submit} className="font-bold uppercase">{editing ? "Save Changes" : "Create Product"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block text-xs uppercase tracking-wider">{label}</Label>{children}</div>;
}
