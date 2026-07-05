import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { categories as seedCategories } from "@/data/categories";
import type { Category } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MegaHaus Admin" },
      { name: "description", content: "Manage catalog categories and sub-categories." },
    ],
  }),
  component: SettingsPage,
});

const STORAGE_KEY = "mh_admin_categories_v1";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function loadCategories(): Category[] {
  if (typeof window === "undefined") return seedCategories;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Category[];
  } catch {}
  return seedCategories;
}

function SettingsPage() {
  const [cats, setCats] = useState<Category[]>(seedCategories);

  useEffect(() => { setCats(loadCategories()); }, []);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cats)); } catch {}
  }, [cats]);

  const resetDefaults = () => {
    setCats(seedCategories);
    toast.success("Settings reset to defaults");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure catalog taxonomy and other administrative preferences.</p>
        </div>
        <Button variant="outline" onClick={resetDefaults} className="rounded-lg">Reset defaults</Button>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Sub-categories</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-0">
          <CategoriesTab cats={cats} setCats={setCats} />
        </TabsContent>

        <TabsContent value="subcategories" className="mt-0">
          <SubcategoriesTab cats={cats} setCats={setCats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================ Categories tab ============================ */

function CategoriesTab({
  cats, setCats,
}: {
  cats: Category[];
  setCats: React.Dispatch<React.SetStateAction<Category[]>>;
}) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => cats.filter((c) => `${c.name} ${c.slug}`.toLowerCase().includes(search.toLowerCase())),
    [cats, search],
  );

  const saveCategory = (data: Category) => {
    setCats((cs) => {
      const exists = cs.some((c) => c.id === data.id);
      return exists ? cs.map((c) => (c.id === data.id ? data : c)) : [...cs, data];
    });
    toast.success(editing ? "Category updated" : "Category created");
    setEditing(null);
    setOpen(false);
  };

  const removeCategory = (id: string) => {
    setCats((cs) => cs.filter((c) => c.id !== id));
    toast.success("Category deleted");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Top-level catalog categories.</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="rounded-lg font-bold uppercase"><Plus className="size-4 mr-2" /> Add Category</Button>
          </DialogTrigger>
          <CategoryDialog editing={editing} onSave={saveCategory} existingIds={cats.map((c) => c.id)} />
        </Dialog>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Input
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Icon</th>
              <th className="px-4 py-3 text-right">Sub-categories</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3 text-xs">{c.icon}</td>
                <td className="px-4 py-3 text-right">{c.subcategories.length}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }} className="rounded-lg"><Pencil className="size-3.5 mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => removeCategory(c.id)} className="rounded-lg text-destructive hover:text-destructive"><Trash2 className="size-3.5 mr-1" /> Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No categories match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryDialog({
  editing, onSave, existingIds,
}: {
  editing: Category | null;
  onSave: (c: Category) => void;
  existingIds: string[];
}) {
  const [form, setForm] = useState<Category>(
    editing ?? { id: "", name: "", slug: "", icon: "Package", subcategories: [], description: "" },
  );

  const submit = () => {
    const name = form.name.trim();
    if (!name) { toast.error("Name is required"); return; }
    const slug = form.slug.trim() ? slugify(form.slug) : slugify(name);
    const id = editing ? editing.id : slug;
    if (!editing && existingIds.includes(id)) { toast.error("A category with this slug already exists"); return; }
    onSave({ ...form, id, name, slug });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
      <div className="grid gap-3 px-1 py-1">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} />
        </Field>
        <Field label="Slug">
          <Input value={form.slug} placeholder="auto-generated from name" onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </Field>
        <Field label="Icon (lucide name)">
          <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        </Field>
        <Field label="Description">
          <Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
      </div>
      <DialogFooter>
        <Button onClick={submit} className="rounded-lg font-bold uppercase">{editing ? "Save Changes" : "Create Category"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ========================== Sub-categories tab ========================== */

function SubcategoriesTab({
  cats, setCats,
}: {
  cats: Category[];
  setCats: React.Dispatch<React.SetStateAction<Category[]>>;
}) {
  const [filterId, setFilterId] = useState<string>("__all");

  const updateSubs = (id: string, subs: string[]) => {
    setCats((cs) => cs.map((c) => (c.id === id ? { ...c, subcategories: subs } : c)));
  };

  const visible = filterId === "__all" ? cats : cats.filter((c) => c.id === filterId);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Manage sub-categories under each top-level category.</p>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filter</label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
          >
            <option value="__all">All categories</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {visible.map((c) => (
          <SubcategoryRow key={c.id} category={c} onChange={(subs) => updateSubs(c.id, subs)} />
        ))}
        {visible.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No categories to show.</div>
        )}
      </div>
    </div>
  );
}

function SubcategoryRow({
  category, onChange,
}: {
  category: Category;
  onChange: (subs: string[]) => void;
}) {
  const [newSub, setNewSub] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const addSub = () => {
    const v = newSub.trim();
    if (!v) return;
    if (category.subcategories.some((s) => s.toLowerCase() === v.toLowerCase())) {
      toast.error("Sub-category already exists");
      return;
    }
    onChange([...category.subcategories, v]);
    setNewSub("");
  };

  const removeSub = (i: number) => {
    onChange(category.subcategories.filter((_, idx) => idx !== i));
  };

  const commitEdit = () => {
    if (editIdx === null) return;
    const v = editValue.trim();
    if (!v) return;
    onChange(category.subcategories.map((s, i) => (i === editIdx ? v : s)));
    setEditIdx(null);
    setEditValue("");
  };

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold">{category.name}</div>
        <div className="text-xs text-muted-foreground">{category.subcategories.length} sub-categories</div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {category.subcategories.map((s, i) => (
          <div key={`${s}-${i}`}>
            {editIdx === i ? (
              <div className="flex items-center gap-1 rounded-md border border-input bg-background px-1.5 py-0.5">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditIdx(null); setEditValue(""); } }}
                  className="h-7 w-32 border-0 shadow-none focus-visible:ring-0 px-1"
                  autoFocus
                />
                <button className="text-primary" onClick={commitEdit} aria-label="Save"><Check className="size-3.5" /></button>
                <button className="text-muted-foreground" onClick={() => { setEditIdx(null); setEditValue(""); }} aria-label="Cancel"><X className="size-3.5" /></button>
              </div>
            ) : (
              <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                <button className="hover:underline" onClick={() => { setEditIdx(i); setEditValue(s); }}>{s}</button>
                <button onClick={() => removeSub(i)} aria-label={`Remove ${s}`} className="ml-1 rounded-sm hover:bg-muted p-0.5"><X className="size-3" /></button>
              </Badge>
            )}
          </div>
        ))}
        <div className="flex items-center gap-1">
          <Input
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addSub(); }}
            placeholder="Add sub-category"
            className="h-8 w-44"
          />
          <Button size="sm" variant="outline" className="rounded-lg h-8" onClick={addSub}><Plus className="size-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
