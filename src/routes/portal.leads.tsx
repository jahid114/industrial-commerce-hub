import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Mail, Plus, Pencil, Trash2, Search } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/leads")({
  component: CustomersPage,
});

type Stage = "New" | "Warm" | "Hot" | "Quoted" | "Closed Won";

interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email?: string;
  interest: string;
  stage: Stage;
  est: number;
  notes?: string;
}

const STAGES: Stage[] = ["New", "Warm", "Hot", "Quoted", "Closed Won"];

const stageColor: Record<Stage, string> = {
  Hot: "bg-destructive/10 text-destructive",
  Warm: "bg-accent/10 text-accent",
  Quoted: "bg-primary/10 text-primary",
  New: "bg-muted text-foreground",
  "Closed Won": "bg-success/10 text-success",
};

const seed: Customer[] = [
  { id: "C-1042", name: "Rahim Textile Mills", contact: "Md. Tarek", phone: "+8801711-902341", email: "tarek@rahimtex.bd", interest: "Bosch GBH 2-26 × 30", stage: "Hot", est: 855000 },
  { id: "C-1041", name: "Padma Spinning Ltd.", contact: "Sumon Hasan", phone: "+8801812-554021", email: "sumon@padma.bd", interest: "Siemens S7-1200 × 8", stage: "Quoted", est: 624000 },
  { id: "C-1040", name: "Bengal Auto Parts", contact: "Arif Mahmud", phone: "+8801913-330218", interest: "Makita GA9020 × 20", stage: "Warm", est: 316000 },
  { id: "C-1039", name: "Apex Garments", contact: "Nasrin Akter", phone: "+8801714-887701", email: "nasrin@apex.bd", interest: "ABB ACS580 × 4", stage: "New", est: 1240000 },
  { id: "C-1038", name: "Meghna Steel", contact: "Iqbal Hossain", phone: "+8801715-621199", interest: "Festo pneumatic kit", stage: "Closed Won", est: 482000 },
];

const KEY = "megahaus-agent-customers-v1";

const schema = z.object({
  name: z.string().min(2, "Company name required"),
  contact: z.string().min(2, "Contact name required"),
  phone: z.string().min(6, "Phone required"),
  email: z.string().email().optional().or(z.literal("")),
  interest: z.string().min(2, "Interest required"),
  stage: z.enum(["New", "Warm", "Hot", "Quoted", "Closed Won"]),
  est: z.number().min(0),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function CustomersPage() {
  const [items, setItems] = useState<Customer[]>(seed);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const filtered = items.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q) || c.interest.toLowerCase().includes(q);
  });

  const upsert = (values: FormValues, existing?: Customer) => {
    if (existing) {
      setItems((p) => p.map((x) => x.id === existing.id ? { ...existing, ...values } : x));
      toast.success("Customer updated");
    } else {
      const id = `C-${Math.floor(1000 + Math.random() * 9000)}`;
      setItems((p) => [{ id, ...values }, ...p]);
      toast.success("Customer added");
    }
  };

  const remove = (c: Customer) => {
    setItems((p) => p.filter((x) => x.id !== c.id));
    toast.success("Customer deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage buyers and prospects in your territory.</p>
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
                <Badge className={stageColor[c.stage]} variant="outline">{c.stage}</Badge>
              </div>
              <div className="font-display text-lg font-bold">{c.name}</div>
              <div className="text-sm text-muted-foreground">{c.contact} · {c.phone}{c.email ? ` · ${c.email}` : ""}</div>
              <div className="text-sm">Interest: <span className="font-medium">{c.interest}</span> · Est. value <span className="font-semibold text-primary">৳ {c.est.toLocaleString()}</span></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild><a href={`tel:${c.phone}`}><Phone className="size-4 mr-1.5" />Call</a></Button>
              {c.email && <Button size="sm" variant="outline" asChild><a href={`mailto:${c.email}`}><Mail className="size-4 mr-1.5" />Email</a></Button>}
              <Button size="sm" variant="outline" onClick={() => setEditing(c)}><Pencil className="size-4 mr-1.5" />Edit</Button>
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
  initial?: Customer;
  onSubmit: (v: FormValues) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: initial
      ? { name: initial.name, contact: initial.contact, phone: initial.phone, email: initial.email ?? "", interest: initial.interest, stage: initial.stage, est: initial.est, notes: initial.notes ?? "" }
      : { name: "", contact: "", phone: "", email: "", interest: "", stage: "New", est: 0, notes: "" },
  });

  const stage = form.watch("stage");

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
          <Field label="Interest" err={form.formState.errors.interest?.message}><Input placeholder="e.g. Bosch GBH 2-26 × 30" {...form.register("interest")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage">
              <Select value={stage} onValueChange={(v) => form.setValue("stage", v as Stage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Est. value (৳)" err={form.formState.errors.est?.message}><Input type="number" min={0} {...form.register("est")} /></Field>
          </div>
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

function Field({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 inline-block text-sm">{label}</Label>
      {children}
      {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
    </div>
  );
}
