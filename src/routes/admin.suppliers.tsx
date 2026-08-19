import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Trash2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDirectory } from "@/lib/directory-store";
import type { Country, Supplier } from "@/data/types";

export const Route = createFileRoute("/admin/suppliers")({
  head: () => ({ meta: [{ title: "Manage Suppliers — Admin" }] }),
  component: AdminSuppliersPage,
});

const COUNTRIES: Country[] = ["Germany", "Japan", "China", "USA", "Italy", "Switzerland"];
const STATUSES: Supplier["status"][] = ["Active", "Pending", "Suspended"];

type FormState = Omit<Supplier, "id" | "productsCount">;

const emptyForm: FormState = {
  name: "",
  country: "Germany",
  contactName: "",
  email: "",
  phone: "",
  since: new Date().toISOString().slice(0, 10),
  status: "Pending",
};

function statusClass(s: Supplier["status"]) {
  if (s === "Active") return "bg-success/20 text-success";
  if (s === "Pending") return "bg-accent/20 text-accent-foreground";
  return "bg-muted";
}

function AdminSuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useDirectory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Supplier["status"] | "all">("all");

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesName = s.name.toLowerCase().includes(nameQuery.trim().toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesName && matchesStatus;
  });

  const hasFilters = nameQuery.trim() !== "" || statusFilter !== "all";
  const clearFilters = () => { setNameQuery(""); setStatusFilter("all"); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    const { id: _id, productsCount: _pc, ...rest } = s;
    void _id; void _pc;
    setForm(rest);
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.contactName.trim() || !form.email.trim()) {
      toast.error("Name, contact and email are required");
      return;
    }
    if (editing) {
      updateSupplier(editing.id, { ...form, productsCount: editing.productsCount });
      toast.success("Supplier updated");
    } else {
      addSupplier({ ...form, productsCount: 0 });
      toast.success("Supplier added");
    }
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteSupplier(deleteId);
    toast.success("Supplier deleted");
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            {filteredSuppliers.length} of {suppliers.length} verified suppliers
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="size-4" /> Add supplier</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by supplier name..."
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Supplier["status"] | "all")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="outline" size="icon" onClick={clearFilters} title="Clear filters">
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-right">Products</th>
              <th className="px-4 py-3 text-right">Since</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-secondary">
                <td className="px-4 py-3 font-semibold">{s.name}</td>
                <td className="px-4 py-3"><Badge className={statusClass(s.status)}>{s.status}</Badge></td>
                <td className="px-4 py-3"><Badge variant="outline">{s.country}</Badge></td>
                <td className="px-4 py-3">{s.contactName}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.phone}</td>
                <td className="px-4 py-3 text-right">{s.productsCount}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{new Date(s.since).getFullYear()}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(s)} className="text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(s.id)} className="text-destructive hover:bg-destructive/20 hover:text-destructive"><Trash2 className="size-4" /></Button>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No suppliers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit supplier" : "Add supplier"}</DialogTitle>
            <DialogDescription>Manage supplier directory information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Company name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Country</Label>
                <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v as Country })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Supplier["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Partner since</Label>
                <Input type="date" value={form.since} onChange={(e) => setForm({ ...form, since: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Contact name</Label>
              <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Contact number</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add supplier"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the supplier from your directory. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
