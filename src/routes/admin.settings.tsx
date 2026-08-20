import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Tag, GitBranch, Award, Globe } from "lucide-react";
import { BrandsTab, CountriesTab } from "@/components/admin/TaxonomyTabs";
import { TableSearchBar, TablePagination, paginate } from "@/components/admin/TableToolbar";


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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure catalog taxonomy and other administrative preferences.</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="rounded-full h-auto p-1.5">
          <TabsTrigger value="categories" className="rounded-full px-5 py-2 gap-2">
            <Tag className="size-4" /> Categories
          </TabsTrigger>
          <TabsTrigger value="subcategories" className="rounded-full px-5 py-2 gap-2">
            <GitBranch className="size-4" /> Sub-categories
          </TabsTrigger>
          <TabsTrigger value="brands" className="rounded-full px-5 py-2 gap-2">
            <Award className="size-4" /> Brands
          </TabsTrigger>
          <TabsTrigger value="countries" className="rounded-full px-5 py-2 gap-2">
            <Globe className="size-4" /> Countries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-0">
          <CategoriesTab cats={cats} setCats={setCats} />
        </TabsContent>

        <TabsContent value="subcategories" className="mt-0">
          <SubcategoriesTab cats={cats} setCats={setCats} />
        </TabsContent>

        <TabsContent value="brands" className="mt-0">
          <BrandsTab />
        </TabsContent>

        <TabsContent value="countries" className="mt-0">
          <CountriesTab />
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(
    () => cats.filter((c) => `${c.name} ${c.slug}`.toLowerCase().includes(search.toLowerCase())),
    [cats, search],
  );
  useEffect(() => { setPage(1); }, [search, pageSize]);
  const paged = paginate(filtered, page, pageSize);


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

      <TableSearchBar value={search} onChange={setSearch} placeholder="Search by category name or slug…" />

      <div className="rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-right">Sub-categories</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3 text-right">{c.subcategories.length}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }} className="rounded-lg text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"><Pencil className="size-3.5 mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setCatToDelete(c)} className="rounded-lg text-destructive hover:bg-destructive/20 hover:text-destructive"><Trash2 className="size-3.5 mr-1" /> Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">No categories match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />


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
    editing ?? { id: "", name: "", slug: "", subcategories: [], description: "" },
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
  const [filterId, setFilterId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ catId: string; index: number } | null>(null);
  const [formValue, setFormValue] = useState("");
  const [formCatId, setFormCatId] = useState<string>(cats[0]?.id ?? "");
  const [subToDelete, setSubToDelete] = useState<{ catId: string; index: number; name: string } | null>(null);

  useEffect(() => {
    if (filterId !== "all" && !cats.some((c) => c.id === filterId)) setFilterId("all");
  }, [cats, filterId]);

  const updateSubs = (catId: string, subs: string[]) => {
    setCats((cs) => cs.map((c) => (c.id === catId ? { ...c, subcategories: subs } : c)));
  };

  const openAdd = () => {
    setEditing(null);
    setFormValue("");
    setFormCatId(filterId !== "all" ? filterId : cats[0]?.id ?? "");
    setDialogOpen(true);
  };
  const openEdit = (catId: string, index: number, name: string) => {
    setEditing({ catId, index });
    setFormValue(name);
    setFormCatId(catId);
    setDialogOpen(true);
  };

  const submitForm = () => {
    const v = formValue.trim();
    if (!v) { toast.error("Name is required"); return; }
    const target = cats.find((c) => c.id === formCatId);
    if (!target) { toast.error("Select a category"); return; }
    const dup = target.subcategories.some(
      (sub, i) => sub.toLowerCase() === v.toLowerCase() && !(editing && editing.catId === formCatId && editing.index === i),
    );
    if (dup) { toast.error("Sub-category already exists"); return; }

    if (!editing) {
      updateSubs(target.id, [...target.subcategories, v]);
      toast.success("Sub-category added");
    } else if (editing.catId === formCatId) {
      updateSubs(target.id, target.subcategories.map((sub, i) => (i === editing.index ? v : sub)));
      toast.success("Sub-category updated");
    } else {
      const from = cats.find((c) => c.id === editing.catId);
      setCats((cs) => cs.map((c) => {
        if (c.id === editing.catId) return { ...c, subcategories: c.subcategories.filter((_, i) => i !== editing.index) };
        if (c.id === formCatId) return { ...c, subcategories: [...c.subcategories, v] };
        return c;
      }));
      void from;
      toast.success("Sub-category moved");
    }
    setDialogOpen(false);
    setEditing(null);
    setFormValue("");
  };

  const removeSub = (catId: string, index: number) => {
    const cat = cats.find((c) => c.id === catId);
    if (!cat) return;
    updateSubs(catId, cat.subcategories.filter((_, i) => i !== index));
    toast.success("Sub-category deleted");
  };

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return cats
      .filter((c) => filterId === "all" || c.id === filterId)
      .flatMap((c) => c.subcategories.map((sub, i) => ({ catId: c.id, catName: c.name, sub, index: i })))
      .filter((r) => !q || r.sub.toLowerCase().includes(q));
  }, [cats, filterId, search]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => { setPage(1); }, [search, pageSize, filterId]);
  const pagedSubs = paginate(rows, page, pageSize);

  return (
    <div className="space-y-3">
      <TableSearchBar value={search} onChange={setSearch} placeholder="Search sub-categories…">
        <Select value={filterId} onValueChange={setFilterId}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={openAdd} disabled={cats.length === 0} className="ml-auto rounded-lg h-9 font-bold uppercase">
          <Plus className="size-4 mr-1" /> Add Sub-category
        </Button>
      </TableSearchBar>

      <div className="rounded-lg border border-border bg-card">
        <ul className="divide-y divide-border">
          {pagedSubs.map((r) => (
            <li key={`${r.catId}-${r.index}`} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex-1 truncate text-sm">{r.sub}</span>
              <Badge variant="secondary" className="rounded-md shrink-0">{r.catName}</Badge>
              <Button size="sm" variant="outline" onClick={() => openEdit(r.catId, r.index, r.sub)} className="rounded-lg h-8 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700">
                <Pencil className="size-3.5 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSubToDelete({ catId: r.catId, index: r.index, name: r.sub })} className="rounded-lg h-8 text-destructive hover:bg-destructive/20 hover:text-destructive">
                <Trash2 className="size-3.5 mr-1" /> Delete
              </Button>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">No sub-categories found.</li>
          )}
        </ul>
      </div>

      <TablePagination total={rows.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setFormValue(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing === null ? "Add Sub-category" : "Edit Sub-category"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 px-1 py-1">
            <Field label="Category">
              <Select value={formCatId} onValueChange={setFormCatId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
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
              {editing === null ? "Create Sub-category" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!subToDelete} onOpenChange={(v) => { if (!v) setSubToDelete(null); }}>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sub-category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <b>{subToDelete?.name}</b> from its category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSubToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (subToDelete) { removeSub(subToDelete.catId, subToDelete.index); setSubToDelete(null); } }}
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
