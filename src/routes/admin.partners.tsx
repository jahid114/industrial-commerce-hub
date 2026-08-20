import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Eye, Search, Inbox, Plus, Pencil, Trash2, Check, Circle, Ban, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import {
  PARTNER_STAGES,
  PARTNER_STATUSES,
  PARTNER_TYPES,
  isTerminalPartner,
  nextPartnerAction,
  partnerStageIndex,
  readPartnerRequests,
  writePartnerRequests,
  type PartnerRequest,
  type PartnerStatus,
  type PartnerType,
} from "@/lib/partner-requests";

export const Route = createFileRoute("/admin/partners")({
  head: () => ({ meta: [{ title: "Partners & Investors — MegaHaus Admin" }] }),
  component: PartnersAdminPage,
});

const statusTone: Record<PartnerStatus, string> = {
  New: "bg-primary/10 text-primary border-primary/30",
  "In Review": "bg-accent/10 text-accent border-accent/30",
  "Meeting Scheduled": "bg-amber-100 text-amber-800 border-amber-300",
  Approved: "bg-success/10 text-success border-success/30",
  Rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

type Draft = {
  name: string;
  company: string;
  email: string;
  phone: string;
  type: PartnerType;
  passportNumber: string;
  address: string;
  shopLocation: string;
  website: string;
  tradeLicense: string;
  cityCorpCert: string;
  chamberCert: string;
  amount: string;
  message: string;
  internalNotes: string;
  status: PartnerStatus;
};

const emptyDraft: Draft = {
  name: "",
  company: "",
  email: "",
  phone: "",
  type: "Partnership",
  passportNumber: "",
  address: "",
  shopLocation: "",
  website: "",
  tradeLicense: "",
  cityCorpCert: "",
  chamberCert: "",
  amount: "",
  message: "",
  internalNotes: "",
  status: "New",
};

function PartnersAdminPage() {
  const [items, setItems] = useState<PartnerRequest[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | PartnerStatus>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | PartnerType>("All");
  const [active, setActive] = useState<PartnerRequest | null>(null);
  const [editing, setEditing] = useState<PartnerRequest | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tab, setTab] = useState<"requests" | "records">("requests");

  useEffect(() => {
    setItems(readPartnerRequests());
  }, []);

  const persist = (next: PartnerRequest[]) => {
    setItems(next);
    writePartnerRequests(next);
  };

  const setStatus = (id: string, status: PartnerStatus) => {
    persist(items.map((p) => (p.id === id ? { ...p, status } : p)));
    setActive((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
  };

  const openAdd = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setFormOpen(true);
  };

  const openEdit = (p: PartnerRequest) => {
    setEditing(p);
    setDraft({
      ...emptyDraft,
      ...p,
      passportNumber: p.passportNumber ?? "",
      address: p.address ?? "",
      shopLocation: p.shopLocation ?? "",
      website: p.website ?? "",
      tradeLicense: p.tradeLicense ?? "",
      cityCorpCert: p.cityCorpCert ?? "",
      chamberCert: p.chamberCert ?? "",
      amount: p.amount ?? "",
      message: p.message ?? "",
      internalNotes: p.internalNotes ?? "",
    });
    setFormOpen(true);
  };

  const save = () => {
    if (!draft.name.trim() || !draft.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (editing) {
      persist(items.map((p) => (p.id === editing.id ? { ...p, ...draft } : p)));
      toast.success("Request updated");
    } else {
      const item: PartnerRequest = {
        ...draft,
        id: `PRT-${Date.now().toString(36).toUpperCase()}`,
        source: "Manual",
        submittedAt: new Date().toISOString(),
      };
      persist([...items, item]);
      toast.success("Request added");
    }
    setFormOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    persist(items.filter((p) => p.id !== deleteId));
    setDeleteId(null);
    setActive(null);
    toast.success("Request deleted");
  };

  const counts = useMemo(
    () => ({
      requests: items.filter((p) => (p.source ?? "Public") === "Public").length,
      records: items.filter((p) => p.source === "Manual").length,
    }),
    [items],
  );

  const filtered = useMemo(
    () =>
      items
        .filter((p) =>
          tab === "requests" ? (p.source ?? "Public") === "Public" : p.source === "Manual",
        )
        .filter((p) => (statusFilter === "All" ? true : p.status === statusFilter))
        .filter((p) => (typeFilter === "All" ? true : p.type === typeFilter))
        .filter((p) =>
          q
            ? [p.name, p.company, p.email, p.phone, p.id]
                .join(" ")
                .toLowerCase()
                .includes(q.toLowerCase())
            : true,
        )
        .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1)),
    [items, statusFilter, typeFilter, q, tab],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Partners & Investors</h1>
          <p className="text-sm text-muted-foreground">
            {tab === "requests"
              ? "Partnership and investment requests submitted from the public website."
              : "Partner and investor records you manage manually."}
          </p>
        </div>
        {tab === "records" && (
          <Button onClick={openAdd} className="font-bold uppercase">
            <Plus className="size-4 mr-2" /> Add Record
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="requests">Public Requests ({counts.requests})</TabsTrigger>
          <TabsTrigger value="records">Partners & Investors ({counts.records})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, company, email, phone"
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All types</SelectItem>
            {PARTNER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            {PARTNER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Ref</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Submitted</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-secondary/50">
                <td className="px-4 py-3 font-mono text-xs">{p.id}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.email} · {p.phone}</div>
                </td>
                <td className="px-4 py-3">{p.company || "—"}</td>
                <td className="px-4 py-3">{p.type}</td>
                <td className="px-4 py-3">{p.amount || "—"}</td>
                <td className="px-4 py-3">{formatDate(p.submittedAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={statusTone[p.status]}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => setActive(p)}>
                      <Eye className="size-3.5 mr-1" /> View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center text-muted-foreground">
                  <Inbox className="mx-auto mb-3 size-8 opacity-40" />
                  No partner or investor requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {active.name} · <span className="font-mono text-sm">{active.id}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Type" value={active.type} />
                  <Field label="Submitted" value={formatDate(active.submittedAt)} />
                  <Field label="Company" value={active.company || "—"} />
                  <Field label="Email" value={active.email} />
                  <Field label="Phone" value={active.phone} />
                  <Field label="Passport Number" value={active.passportNumber || "—"} />
                  <Field label="Website" value={active.website || "—"} />
                  <Field label="Shop Location" value={active.shopLocation || "—"} />
                  <Field label="Trade License" value={active.tradeLicense || "—"} />
                  <Field label="City Corp. Certificate" value={active.cityCorpCert || "—"} />
                  <Field label="Chamber Certificate" value={active.chamberCert || "—"} />
                  <Field label="Indicative Amount" value={active.amount || "—"} />
                </div>
                {active.address && <Block label="Address">{active.address}</Block>}
                {active.message && <Block label="Message">{active.message}</Block>}
                {active.files && active.files.length > 0 && (
                  <Block label="Attachments">{active.files.join(", ")}</Block>
                )}
                {active.internalNotes && <Block label="Internal Notes">{active.internalNotes}</Block>}
                {/* Stage stepper */}
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="grid grid-cols-4 gap-2">
                    {PARTNER_STAGES.map((s, i) => {
                      const idx = partnerStageIndex(active.status);
                      const rejected = active.status === "Rejected";
                      const done = !rejected && idx > i;
                      const isActive = !rejected && idx === i;
                      return (
                        <div key={s.key} className="flex flex-col items-center text-center">
                          <div
                            className={`flex size-8 items-center justify-center rounded-full border-2 ${
                              done
                                ? "border-success bg-success text-white"
                                : isActive
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-muted-foreground"
                            }`}
                          >
                            {done ? <Check className="size-4" /> : <Circle className="size-3 fill-current" />}
                          </div>
                          <div
                            className={`mt-2 text-xs font-semibold ${
                              isActive ? "text-primary" : done ? "text-success" : "text-muted-foreground"
                            }`}
                          >
                            {s.label}
                          </div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground">{s.description}</div>
                        </div>
                      );
                    })}
                  </div>
                  {active.status === "Rejected" && (
                    <p className="mt-3 text-center text-xs font-semibold text-destructive">
                      This request was rejected.
                    </p>
                  )}
                </div>

                {/* Workflow actions */}
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  {(() => {
                    const na = nextPartnerAction(active.status);
                    return na ? (
                      <Button size="sm" className="font-semibold" onClick={() => setStatus(active.id, na.next)}>
                        <Check className="mr-1 size-4" /> {na.label}
                      </Button>
                    ) : null;
                  })()}
                  {!isTerminalPartner(active.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setStatus(active.id, "Rejected")}
                    >
                      <Ban className="mr-1 size-4" /> Reject
                    </Button>
                  )}
                  <Select value={active.status} onValueChange={(v) => setStatus(active.id, v as PartnerStatus)}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PARTNER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="ml-auto" onClick={() => { openEdit(active); setActive(null); }}>
                    <Pencil className="size-4 mr-1.5" /> Edit
                  </Button>
                </div>

                {/* Activity timeline */}
                <div className="border-t border-border pt-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Clock className="size-4" /> Activity
                  </div>
                  {active.timeline && active.timeline.length > 0 ? (
                    <ol className="relative border-l border-border pl-4">
                      {[...active.timeline].reverse().map((ev, i) => (
                        <li key={i} className="mb-4 last:mb-0">
                          <div className="absolute -left-1.5 size-3 rounded-full bg-primary" />
                          <div className="text-sm font-medium">{ev.message}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(ev.at).toLocaleString()} · {ev.by} · {ev.type}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Record" : "Add Partner / Investor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <DField label="Name *"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></DField>
            <DField label="Company"><Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></DField>
            <DField label="Email *"><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></DField>
            <DField label="Phone"><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></DField>
            <DField label="Type">
              <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as PartnerType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PARTNER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </DField>
            <DField label="Status">
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as PartnerStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PARTNER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </DField>
            <DField label="Passport Number"><Input value={draft.passportNumber} onChange={(e) => setDraft({ ...draft, passportNumber: e.target.value })} /></DField>
            <DField label="Website"><Input value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} placeholder="https://" /></DField>
            <DField label="Shop Location"><Input value={draft.shopLocation} onChange={(e) => setDraft({ ...draft, shopLocation: e.target.value })} /></DField>
            <DField label="Indicative Amount"><Input value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="e.g. USD 500K" /></DField>
            <DField label="Trade License No."><Input value={draft.tradeLicense} onChange={(e) => setDraft({ ...draft, tradeLicense: e.target.value })} /></DField>
            <DField label="City Corp. Certificate No."><Input value={draft.cityCorpCert} onChange={(e) => setDraft({ ...draft, cityCorpCert: e.target.value })} /></DField>
            <DField label="Chamber Certificate No."><Input value={draft.chamberCert} onChange={(e) => setDraft({ ...draft, chamberCert: e.target.value })} /></DField>
          </div>
          <DField label="Address"><Textarea rows={2} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></DField>
          <DField label="Message"><Textarea rows={3} value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} /></DField>
          <DField label="Internal Notes"><Textarea rows={2} value={draft.internalNotes} onChange={(e) => setDraft({ ...draft, internalNotes: e.target.value })} /></DField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} className="font-bold uppercase">{editing ? "Save Changes" : "Add Record"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>This partner/investor request will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <p className="mt-1 whitespace-pre-wrap text-sm">{children}</p>
    </div>
  );
}

function DField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 inline-block text-sm">{label}</Label>
      {children}
    </div>
  );
}
