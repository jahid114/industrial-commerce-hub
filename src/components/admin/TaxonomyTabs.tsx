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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrandsAdmin, useCountriesAdmin, slugifyId, type BusinessCountry } from "@/lib/taxonomy-store";
import { TableSearchBar, TablePagination, paginate } from "@/components/admin/TableToolbar";
import type { Brand, Country } from "@/data/types";
import { toast } from "sonner";


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/* ============================== Brands ============================== */

export function BrandsTab() {
  const { brands, save, remove } = useBrandsAdmin();
  const { countries } = useCountriesAdmin();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Brand | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Brand | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(
    () => brands.filter((b) => `${b.name} ${b.country}`.toLowerCase().includes(search.toLowerCase())),
    [brands, search],
  );
  useEffect(() => { setPage(1); }, [search, pageSize]);
  const paged = paginate(filtered, page, pageSize);

  const countryNames = countries.map((c) => c.name);


  return (
    <div className="space-y-3">
      <TableSearchBar value={search} onChange={setSearch} placeholder="Search by brand name or country…">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="ml-auto rounded-lg h-9 font-bold uppercase"><Plus className="size-4 mr-1" /> Add Brand</Button>
          </DialogTrigger>
          <BrandDialog
            key={editing?.id ?? "new"}
            editing={editing}
            countryNames={countryNames}
            existingIds={brands.map((b) => b.id)}
            onSave={(b) => { save(b); toast.success(editing ? "Brand updated" : "Brand created"); setEditing(null); setOpen(false); }}
          />
        </Dialog>
      </TableSearchBar>


      <div className="rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Brand</th>
              <th className="px-4 py-3 text-left">Logo text</th>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{b.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{b.id}</div>
                </td>
                <td className="px-4 py-3">{b.logoText}</td>
                <td className="px-4 py-3"><Badge variant="outline">{b.country}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(b); setOpen(true); }} className="rounded-lg text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"><Pencil className="size-3.5 mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setToDelete(b)} className="rounded-lg text-destructive hover:bg-destructive/20 hover:text-destructive"><Trash2 className="size-3.5 mr-1" /> Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">No brands match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />


      <AlertDialog open={!!toDelete} onOpenChange={(v) => { if (!v) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brand?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <b>{toDelete?.name}</b> from the brand list. Products already referencing it are not changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (toDelete) { remove(toDelete.id); toast.success("Brand deleted"); setToDelete(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BrandDialog({
  editing, onSave, existingIds, countryNames,
}: {
  editing: Brand | null;
  onSave: (b: Brand) => void;
  existingIds: string[];
  countryNames: string[];
}) {
  const [form, setForm] = useState<Brand>(
    editing ?? { id: "", name: "", country: (countryNames[0] as Country) ?? "Germany", logoText: "" },
  );

  const submit = () => {
    const name = form.name.trim();
    if (!name) { toast.error("Brand name is required"); return; }
    if (name.length > 60) { toast.error("Brand name must be under 60 characters"); return; }
    if (!form.country) { toast.error("Country is required"); return; }
    const id = editing ? editing.id : slugifyId(name);
    if (!editing && existingIds.includes(id)) { toast.error("A brand with this name already exists"); return; }
    onSave({ ...form, id, name, logoText: form.logoText.trim() || name.toUpperCase() });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>{editing ? "Edit Brand" : "Add Brand"}</DialogTitle></DialogHeader>
      <div className="grid gap-3 px-1 py-1">
        <Field label="Name">
          <Input value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Logo text">
          <Input value={form.logoText} maxLength={30} placeholder="Defaults to the brand name" onChange={(e) => setForm({ ...form, logoText: e.target.value })} />
        </Field>
        <Field label="Country">
          <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v as Country })}>
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              {countryNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <DialogFooter>
        <Button onClick={submit} className="rounded-lg font-bold uppercase">{editing ? "Save Changes" : "Create Brand"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ============================= Countries ============================= */

export function CountriesTab() {
  const { countries, save, remove } = useCountriesAdmin();
  const { brands } = useBrandsAdmin();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<BusinessCountry | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<BusinessCountry | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(
    () => countries.filter((c) => `${c.name} ${c.code}`.toLowerCase().includes(search.toLowerCase())),
    [countries, search],
  );
  useEffect(() => { setPage(1); }, [search, pageSize]);
  const paged = paginate(filtered, page, pageSize);


  return (
    <div className="space-y-3">
      <TableSearchBar value={search} onChange={setSearch} placeholder="Search by country name or code…">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="ml-auto rounded-lg h-9 font-bold uppercase"><Plus className="size-4 mr-1" /> Add Country</Button>
          </DialogTrigger>
          <CountryDialog
            key={editing?.id ?? "new"}
            editing={editing}
            existingIds={countries.map((c) => c.id)}
            onSave={(c) => { save(c); toast.success(editing ? "Country updated" : "Country created"); setEditing(null); setOpen(false); }}
          />
        </Dialog>
      </TableSearchBar>


      <div className="rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-right">Brands</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                <td className="px-4 py-3 text-right">{brands.filter((b) => b.country === c.name).length}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }} className="rounded-lg text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"><Pencil className="size-3.5 mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setToDelete(c)} className="rounded-lg text-destructive hover:bg-destructive/20 hover:text-destructive"><Trash2 className="size-3.5 mr-1" /> Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">No countries match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />


      <AlertDialog open={!!toDelete} onOpenChange={(v) => { if (!v) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete country?</AlertDialogTitle>
            <AlertDialogDescription>
              <b>{toDelete?.name}</b> will no longer be selectable for brands and suppliers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (toDelete) { remove(toDelete.id); toast.success("Country deleted"); setToDelete(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CountryDialog({
  editing, onSave, existingIds,
}: {
  editing: BusinessCountry | null;
  onSave: (c: BusinessCountry) => void;
  existingIds: string[];
}) {
  const [form, setForm] = useState<BusinessCountry>(
    editing ?? { id: "", name: "", code: "" },
  );

  const submit = () => {
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name) { toast.error("Country name is required"); return; }
    if (name.length > 60) { toast.error("Country name must be under 60 characters"); return; }
    if (!/^[A-Z]{2,3}$/.test(code)) { toast.error("Country code must be 2–3 letters (e.g. DE)"); return; }
    const id = editing ? editing.id : slugifyId(name);
    if (!editing && existingIds.includes(id)) { toast.error("This country already exists"); return; }
    onSave({ ...form, id, name, code });
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>{editing ? "Edit Country" : "Add Country"}</DialogTitle></DialogHeader>
      <div className="grid gap-3 px-1 py-1">
        <Field label="Name">
          <Input value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="ISO code">
          <Input value={form.code} maxLength={3} placeholder="DE" onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        </Field>
      </div>
      <DialogFooter>
        <Button onClick={submit} className="rounded-lg font-bold uppercase">{editing ? "Save Changes" : "Create Country"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
