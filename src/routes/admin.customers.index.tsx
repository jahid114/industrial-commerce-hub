import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Eye, Ban, CheckCircle2, Trash2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCustomers, type RegisteredCustomer } from "@/lib/customers-store";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/customers/")({
  head: () => ({ meta: [{ title: "Customers — Admin" }] }),
  component: AdminCustomersPage,
});


type FormState = { name: string; email: string; phone: string; company: string; address: string; city: string; notes: string };
const emptyForm: FormState = { name: "", email: "", phone: "", company: "", address: "", city: "", notes: "" };

function AdminCustomersPage() {
  const { customers, add, update, remove, suspend, reinstate } = useCustomers();
  const { orders } = useStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Suspended">("All");
  const [viewing, setViewing] = useState<RegisteredCustomer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RegisteredCustomer | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<RegisteredCustomer | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Order stats per customer email
  const statsByEmail = useMemo(() => {
    const map = new Map<string, { count: number; total: number; last?: string }>();
    for (const o of orders) {
      const key = o.customerEmail.toLowerCase();
      const cur = map.get(key) ?? { count: 0, total: 0, last: undefined };
      cur.count += 1;
      if (o.status !== "Cancelled") cur.total += o.total;
      if (!cur.last || new Date(o.date) > new Date(cur.last)) cur.last = o.date;
      map.set(key, cur);
    }
    return map;
  }, [orders]);

  const filtered = customers.filter((c) => {
    if (statusFilter !== "All" && c.status !== statusFilter) return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company ?? "").toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);


  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: RegisteredCustomer) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone ?? "", company: c.company ?? "", address: c.address ?? "", city: c.city ?? "", notes: c.notes ?? "" });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error("Name and email are required"); return; }
    if (editing) {
      update(editing.id, form);
      toast.success("Customer updated");
    } else {
      add(form);
      toast.success("Customer added");
    }
    setDialogOpen(false);
  };

  const confirmSuspend = () => {
    if (!suspendTarget) return;
    if (!suspendReason.trim()) { toast.error("Reason is required"); return; }
    suspend(suspendTarget.id, suspendReason.trim());
    toast.success(`${suspendTarget.name} suspended`);
    setSuspendTarget(null);
    setSuspendReason("");
  };

  const viewingStats = viewing ? statsByEmail.get(viewing.email.toLowerCase()) : undefined;
  const viewingOrders = viewing ? orders.filter((o) => o.customerEmail.toLowerCase() === viewing.email.toLowerCase()) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Registered Customers</h1>
          <p className="text-sm text-muted-foreground">All customers who have signed up on MegaHaus.</p>
        </div>
        <Button onClick={openAdd} className="font-semibold"><Plus className="size-4 mr-2" /> Add Customer</Button>
      </div>




      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, email, company, ID…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-left px-4 py-3">Registered</th>
                <th className="text-left px-4 py-3">Orders</th>
                <th className="text-left px-4 py-3">Spent</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((c) => {
                const s = statsByEmail.get(c.email.toLowerCase());
                return (
                  <tr key={c.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.id} · {c.company ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{c.email}</div>
                      <div className="text-xs text-muted-foreground">{c.phone ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3">{formatDate(c.registeredAt)}</td>
                    <td className="px-4 py-3 font-semibold">{s?.count ?? 0}</td>
                    <td className="px-4 py-3">{s ? formatBDT(s.total) : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className={c.status === "Active" ? "bg-success/20 text-success hover:bg-success/20" : "bg-destructive/20 text-destructive hover:bg-destructive/20"}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewing(c)} className="hover:text-primary" aria-label="View"><Eye className="size-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="hover:text-primary" aria-label="Edit"><Pencil className="size-4" /></Button>
                        {c.status === "Active" ? (
                          <Button variant="ghost" size="icon" onClick={() => { setSuspendTarget(c); setSuspendReason(""); }} className="hover:text-destructive" aria-label="Suspend"><Ban className="size-4" /></Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => { reinstate(c.id); toast.success(`${c.name} reinstated`); }} className="hover:text-success" aria-label="Reinstate"><CheckCircle2 className="size-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)} className="hover:text-destructive" aria-label="Delete"><Trash2 className="size-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">Page {currentPage} of {totalPages} · {filtered.length} customers</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {viewing.name}
                  <Badge className={viewing.status === "Active" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}>{viewing.status}</Badge>
                </DialogTitle>
                <DialogDescription>{viewing.id} · Registered {formatDate(viewing.registeredAt)}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Email" value={viewing.email} />
                <InfoCard label="Phone" value={viewing.phone ?? "—"} />
                <InfoCard label="Company" value={viewing.company ?? "—"} />
                <InfoCard label="City" value={viewing.city ?? "—"} />
                <InfoCard label="Address" value={viewing.address ?? "—"} className="md:col-span-2" />
                {viewing.status === "Suspended" && viewing.suspendReason && (
                  <InfoCard label="Suspend Reason" value={viewing.suspendReason} className="md:col-span-2 text-destructive" />
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3 mt-2">
                <StatBox label="Total Orders" value={(viewingStats?.count ?? 0).toString()} />
                <StatBox label="Total Spent" value={viewingStats ? formatBDT(viewingStats.total) : "৳0"} />
                <StatBox label="Last Order" value={viewingStats?.last ? formatDate(viewingStats.last) : "—"} />
              </div>

              <div>
                <h3 className="font-display font-bold mt-2 mb-2">Order History</h3>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary text-xs uppercase">
                      <tr>
                        <th className="text-left px-3 py-2">Order</th>
                        <th className="text-left px-3 py-2">Date</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-right px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {viewingOrders.length === 0 && (<tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">No orders yet.</td></tr>)}
                      {viewingOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="px-3 py-2 font-semibold">{o.id}</td>
                          <td className="px-3 py-2">{formatDate(o.date)}</td>
                          <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{o.status}</Badge></td>
                          <td className="px-3 py-2 text-right font-semibold">{formatBDT(o.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <DialogFooter className="gap-2">
                {viewing.status === "Active" ? (
                  <Button variant="destructive" onClick={() => { setSuspendTarget(viewing); setSuspendReason(""); setViewing(null); }}><Ban className="size-4 mr-2" /> Suspend</Button>
                ) : (
                  <Button variant="outline" onClick={() => { reinstate(viewing.id); toast.success("Reinstated"); setViewing(null); }}><CheckCircle2 className="size-4 mr-2" /> Reinstate</Button>
                )}
                <Button onClick={() => { openEdit(viewing); setViewing(null); }}><Pencil className="size-4 mr-2" /> Edit</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
            <DialogDescription>Registered customer details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
            <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Address" className="sm:col-span-2"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="Notes" className="sm:col-span-2"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save Changes" : "Add Customer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Customer</DialogTitle>
            <DialogDescription>Provide a reason for suspending {suspendTarget?.name}. They will be blocked from placing new orders.</DialogDescription>
          </DialogHeader>
          <Field label="Reason *">
            <Textarea rows={3} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="e.g. Fraudulent activity, repeated chargebacks…" />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmSuspend}>Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the customer record. Their existing orders remain.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { remove(deleteId); toast.success("Customer deleted"); setDeleteId(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function InfoCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-secondary/40 p-3 ${className ?? ""}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold break-words">{value}</div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg font-bold">{value}</div>
    </div>
  );
}
