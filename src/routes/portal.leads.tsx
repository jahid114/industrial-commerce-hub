import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Plus, Pencil, Trash2, Search, Eye, ShoppingBag, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import { NewOrderDialog } from "@/components/agent/NewOrderDialog";
import { useAgentCustomers, newCustomerId, type AgentCustomer } from "@/lib/agent-customers";

export const Route = createFileRoute("/portal/leads")({
  component: CustomersPage,
});

const schema = z.object({
  name: z.string().min(2, "Company name required"),
  contact: z.string().min(2, "Contact name required"),
  phone: z.string().min(6, "Phone required"),
  email: z.string().email().optional().or(z.literal("")),
  interest: z.string().min(2, "Interest required"),
  address: z.string().min(4, "Delivery address required"),
  est: z.number().min(0),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function CustomersPage() {
  const [items, setItems] = useAgentCustomers();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AgentCustomer | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AgentCustomer | null>(null);
  const [viewing, setViewing] = useState<AgentCustomer | null>(null);
  const [ordering, setOrdering] = useState<AgentCustomer | null>(null);

  const filtered = items.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q) || c.interest.toLowerCase().includes(q);
  });

  const upsert = (values: FormValues, existing?: AgentCustomer) => {
    if (existing) {
      setItems((p) => p.map((x) => x.id === existing.id ? { ...existing, ...values } : x));
      toast.success("Customer updated");
    } else {
      setItems((p) => [{ id: newCustomerId(), ...values }, ...p]);
      toast.success("Customer added");
    }
  };

  const remove = (c: AgentCustomer) => {
    setItems((p) => p.filter((x) => x.id !== c.id));
    toast.success("Customer deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage buyers and place orders on their behalf.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="size-4 mr-1.5" />Add Customer</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" className="pl-9" />
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No customers found.
          </div>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
              </div>
              <div className="font-display text-lg font-bold">{c.name}</div>
              <div className="text-sm text-muted-foreground">{c.contact} · {c.phone}{c.email ? ` · ${c.email}` : ""}</div>
              <div className="text-sm text-muted-foreground">📍 {c.address}</div>
              <div className="text-sm">Interest: <span className="font-medium">{c.interest}</span> · Est. value <span className="font-semibold text-primary">৳ {c.est.toLocaleString()}</span></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setViewing(c)}><Eye className="size-4 mr-1.5" />View</Button>
              {c.email && <Button size="sm" variant="outline" asChild><a href={`mailto:${c.email}`}><Mail className="size-4 mr-1.5" />Email</a></Button>}
              <Button size="sm" variant="outline" onClick={() => setEditing(c)}><Pencil className="size-4 mr-1.5" />Edit</Button>
              <Button size="sm" onClick={() => setOrdering(c)}><ShoppingBag className="size-4 mr-1.5" />New Order</Button>
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleting(c)}><Trash2 className="size-4 mr-1.5" />Delete</Button>
            </div>
          </div>
        ))}
      </div>

      <CustomerFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={(v) => { upsert(v); setCreating(false); }}
      />
      <CustomerFormDialog
        open={!!editing}
        onOpenChange={(v) => { if (!v) setEditing(null); }}
        initial={editing ?? undefined}
        onSubmit={(v) => { if (editing) upsert(v, editing); setEditing(null); }}
      />

      <CustomerDetailDialog
        customer={viewing}
        onOpenChange={(v) => { if (!v) setViewing(null); }}
        onNewOrder={(c) => { setViewing(null); setOrdering(c); }}
      />

      <NewOrderDialog
        open={!!ordering}
        onOpenChange={(v) => { if (!v) setOrdering(null); }}
        presetCustomer={ordering}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => { if (!v) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleting?.name}</strong> from your list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleting) remove(deleting); setDeleting(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CustomerFormDialog({
  open, onOpenChange, initial, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: AgentCustomer;
  onSubmit: (v: FormValues) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: initial
      ? { name: initial.name, contact: initial.contact, phone: initial.phone, email: initial.email ?? "", interest: initial.interest, address: initial.address ?? "", est: initial.est, notes: initial.notes ?? "" }
      : { name: "", contact: "", phone: "", email: "", interest: "", address: "", est: 0, notes: "" },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>{initial ? "Update customer details." : "Track a new buyer or prospect."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => onSubmit(v))} className="space-y-3">
          <Field label="Company" err={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact person" err={form.formState.errors.contact?.message}><Input {...form.register("contact")} /></Field>
            <Field label="Phone" err={form.formState.errors.phone?.message}><Input {...form.register("phone")} /></Field>
          </div>
          <Field label="Email (optional)" err={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></Field>
          <Field label="Delivery address" err={form.formState.errors.address?.message}><Textarea rows={2} placeholder="Street, area, city" {...form.register("address")} /></Field>
          <Field label="Interest" err={form.formState.errors.interest?.message}><Input placeholder="e.g. Bosch GBH 2-26 × 30" {...form.register("interest")} /></Field>
          <Field label="Est. value (৳)" err={form.formState.errors.est?.message}><Input type="number" min={0} {...form.register("est", { valueAsNumber: true })} /></Field>
          <Field label="Notes (optional)"><Textarea rows={2} {...form.register("notes")} /></Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{initial ? "Save changes" : "Add customer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CustomerDetailDialog({
  customer, onOpenChange, onNewOrder,
}: {
  customer: AgentCustomer | null;
  onOpenChange: (v: boolean) => void;
  onNewOrder: (c: AgentCustomer) => void;
}) {
  const { orders } = useStore();
  const custOrders = useMemo(() => {
    if (!customer) return [];
    return orders.filter((o) =>
      o.customerName.toLowerCase() === customer.name.toLowerCase() ||
      (customer.email && o.customerEmail?.toLowerCase() === customer.email.toLowerCase())
    );
  }, [orders, customer]);

  return (
    <Dialog open={!!customer} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{customer?.name}</DialogTitle>
          <DialogDescription className="font-mono text-xs">{customer?.id}</DialogDescription>
        </DialogHeader>
        {customer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary/30 p-4 text-sm">
              <Info label="Contact" value={customer.contact} />
              <Info label="Phone" value={customer.phone} />
              {customer.email && <Info label="Email" value={customer.email} />}
              <Info label="Est. value" value={`৳ ${customer.est.toLocaleString()}`} />
              <div className="col-span-2"><Info label="Delivery address" value={customer.address} /></div>
              <div className="col-span-2"><Info label="Interest" value={customer.interest} /></div>
              {customer.notes && <div className="col-span-2"><Info label="Notes" value={customer.notes} /></div>}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">Orders ({custOrders.length})</h3>
                <Button size="sm" onClick={() => onNewOrder(customer)}>
                  <ShoppingBag className="size-4 mr-1.5" />New Order
                </Button>
              </div>
              {custOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  <Package className="mx-auto mb-2 size-8 opacity-50" />
                  No orders yet for this customer.
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-spec text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Order</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {custOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="px-3 py-2 font-mono text-xs">{o.id}</td>
                          <td className="px-3 py-2">{formatDate(o.date)}</td>
                          <td className="px-3 py-2"><Badge variant="outline">{o.status}</Badge></td>
                          <td className="px-3 py-2 text-right font-semibold">{formatBDT(o.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Field({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 inline-block text-sm">{label}</Label>
      {children}
      {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
    </div>
  );
}
