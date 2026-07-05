import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);

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
                    <Button size="sm" variant="outline" onClick={() => setCatToDelete(c)} className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3.5 mr-1" /> Delete</Button>
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

      <AlertDialog open={!!catToDelete} onOpenChange={(v) => { if (!v) setCatToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <b>{catToDelete?.name}</b> and all of its sub-categories. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCatToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (catToDelete) { removeCategory(catToDelete.id); setCatToDelete(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const [selectedId, setSelectedId] = useState<string>(cats[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [formValue, setFormValue] = useState("");
  const [subToDelete, setSubToDelete] = useState<{ index: number; name: string } | null>(null);

  useEffect(() => {
    if (!cats.some((c) => c.id === selectedId)) setSelectedId(cats[0]?.id ?? "");
  }, [cats, selectedId]);

  const selected = cats.find((c) => c.id === selectedId) ?? null;

  const updateSubs = (subs: string[]) => {
    if (!selected) return;
    setCats((cs) => cs.map((c) => (c.id === selected.id ? { ...c, subcategories: subs } : c)));
  };

  const openAdd = () => { setEditIdx(null); setFormValue(""); setDialogOpen(true); };
  const openEdit = (i: number) => { setEditIdx(i); setFormValue(selected?.subcategories[i] ?? ""); setDialogOpen(true); };

  const submitForm = () => {
    if (!selected) return;
    const v = formValue.trim();
    if (!v) { toast.error("Name is required"); return; }
    const dup = selected.subcategories.some((s, i) => i !== editIdx && s.toLowerCase() === v.toLowerCase());
    if (dup) { toast.error("Sub-category already exists"); return; }
    if (editIdx === null) {
      updateSubs([...selected.subcategories, v]);
      toast.success("Sub-category added");
    } else {
      updateSubs(selected.subcategories.map((s, i) => (i === editIdx ? v : s)));
      toast.success("Sub-category updated");
    }
    setDialogOpen(false);
    setEditIdx(null);
    setFormValue("");
  };

  const removeSub = (i: number) => {
    if (!selected) return;
    updateSubs(selected.subcategories.filter((_, idx) => idx !== i));
    toast.success("Sub-category deleted");
  };

  const filteredSubs = selected
    ? selected.subcategories
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Categories
        </div>
        <div className="max-h-[520px] overflow-auto">
          {cats.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedId(c.id); setSubToDelete(null); }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm border-b border-border last:border-0 transition-colors ${
                  active ? "bg-primary/10 text-foreground" : "hover:bg-muted/60"
                }`}
              >
                <span className="truncate font-medium">{c.name}</span>
                <Badge variant={active ? "default" : "secondary"} className="shrink-0 rounded-md">
                  {c.subcategories.length}
                </Badge>
              </button>
            );
          })}
          {cats.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No categories.</div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {selected ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <div className="font-semibold">{selected.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selected.subcategories.length} sub-categories
                </div>
              </div>
              <Button size="sm" onClick={openAdd} className="rounded-lg h-9 font-bold uppercase">
                <Plus className="size-4 mr-1" /> Add Sub-category
              </Button>
            </div>

            <div className="border-b border-border px-4 py-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sub-categories…"
                className="border-0 shadow-none focus-visible:ring-0 px-0"
              />
            </div>

            <ul className="divide-y divide-border">
              {filteredSubs.map(({ s, i }) => (
                <li key={`${s}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1 truncate text-sm">{s}</span>
                  <Button size="sm" variant="outline" onClick={() => openEdit(i)} className="rounded-lg h-8">
                    <Pencil className="size-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSubToDelete({ index: i, name: s })} className="rounded-lg h-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="size-3.5 mr-1" /> Delete
                  </Button>
                </li>
              ))}
              {filteredSubs.length === 0 && (
                <li className="p-8 text-center text-sm text-muted-foreground">
                  {selected.subcategories.length === 0 ? "No sub-categories yet. Click Add Sub-category to create one." : "No sub-categories match your search."}
                </li>
              )}
            </ul>
          </>
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">Select a category to manage its sub-categories.</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditIdx(null); setFormValue(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editIdx === null ? "Add Sub-category" : "Edit Sub-category"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 px-1 py-1">
            <div className="text-xs text-muted-foreground">
              Under <span className="font-medium text-foreground">{selected?.name}</span>
            </div>
            <Field label="Name">
              <Input
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitForm(); }}
                placeholder="e.g. Drills"
                autoFocus
              />
            </Field>
          </div>
          <DialogFooter>
            <Button onClick={submitForm} className="rounded-lg font-bold uppercase">
              {editIdx === null ? "Create Sub-category" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!subToDelete} onOpenChange={(v) => { if (!v) setSubToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sub-category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <b>{subToDelete?.name}</b> from <b>{selected?.name}</b>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSubToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (subToDelete) { removeSub(subToDelete.index); setSubToDelete(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
