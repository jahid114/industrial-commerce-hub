import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { setCats(loadCategories()); }, []);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cats)); } catch {}
  }, [cats]);

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

  const updateSubs = (id: string, subs: string[]) => {
    setCats((cs) => cs.map((c) => (c.id === id ? { ...c, subcategories: subs } : c)));
  };

  const resetDefaults = () => {
    setCats(seedCategories);
    toast.success("Categories reset to defaults");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage categories and sub-categories used across the catalog.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetDefaults} className="rounded-lg">Reset defaults</Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="rounded-lg font-bold uppercase"><Plus className="size-4 mr-2" /> Add Category</Button>
            </DialogTrigger>
            <CategoryDialog editing={editing} onSave={saveCategory} existingIds={cats.map((c) => c.id)} />
          </Dialog>
        </div>
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
        <div className="divide-y divide-border">
          {filtered.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              onEdit={() => { setEditing(c); setOpen(true); }}
              onDelete={() => removeCategory(c.id)}
              onSubsChange={(subs) => updateSubs(c.id, subs)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No categories match your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  category, onEdit, onDelete, onSubsChange,
}: {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
  onSubsChange: (subs: string[]) => void;
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
    onSubsChange([...category.subcategories, v]);
    setNewSub("");
  };

  const removeSub = (i: number) => {
    onSubsChange(category.subcategories.filter((_, idx) => idx !== i));
  };

  const commitEdit = () => {
    if (editIdx === null) return;
    const v = editValue.trim();
    if (!v) return;
    onSubsChange(category.subcategories.map((s, i) => (i === editIdx ? v : s)));
    setEditIdx(null);
    setEditValue("");
  };

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{category.name}</div>
          <div className="text-xs text-muted-foreground">/{category.slug} · {category.subcategories.length} sub-categories</div>
          {category.description && <div className="mt-1 text-sm text-muted-foreground">{category.description}</div>}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} className="rounded-lg"><Pencil className="size-3.5 mr-1" /> Edit</Button>
          <Button size="sm" variant="outline" onClick={onDelete} className="rounded-lg text-destructive hover:text-destructive"><Trash2 className="size-3.5 mr-1" /> Delete</Button>
        </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
