import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Search, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import {
  readApplications,
  writeApplications,
  type ApplicationStatus,
  type CareerApplication,
} from "@/lib/inbox";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ title: "Career Applications — MegaHaus Admin" }] }),
  component: ApplicationsPage,
});

const STATUSES: ApplicationStatus[] = ["New", "Reviewed", "Shortlisted", "Rejected"];

const statusTone: Record<ApplicationStatus, string> = {
  New: "bg-primary/10 text-primary border-primary/30",
  Reviewed: "bg-accent/10 text-accent border-accent/30",
  Shortlisted: "bg-success/10 text-success border-success/30",
  Rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

function ApplicationsPage() {
  const [items, setItems] = useState<CareerApplication[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | ApplicationStatus>("All");
  const [active, setActive] = useState<CareerApplication | null>(null);

  useEffect(() => {
    setItems(readApplications());
  }, []);

  const persist = (next: CareerApplication[]) => {
    setItems(next);
    writeApplications(next);
  };

  const setStatus = (id: string, status: ApplicationStatus) => {
    const next = items.map((a) => (a.id === id ? { ...a, status } : a));
    persist(next);
    setActive((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
  };

  const filtered = items
    .filter((a) => (filter === "All" ? true : (a.status ?? "New") === filter))
    .filter((a) =>
      q
        ? [a.name, a.email, a.phone, a.city, a.id]
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase())
        : true,
    )
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Career Applications</h1>
        <p className="text-sm text-muted-foreground">
          Applications submitted through the public careers page.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone, city"
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Ref</th>
              <th className="px-4 py-3 text-left">Applicant</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">City</th>
              <th className="px-4 py-3 text-left">Submitted</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-secondary/50">
                <td className="px-4 py-3 font-mono text-xs">{a.id}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.email} · {a.phone}
                  </div>
                </td>
                <td className="px-4 py-3">{a.role}</td>
                <td className="px-4 py-3">{a.city}</td>
                <td className="px-4 py-3">{formatDate(a.submittedAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={statusTone[a.status ?? "New"]}>
                    {a.status ?? "New"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => setActive(a)}>
                    <Eye className="size-4 mr-1.5" /> View
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-muted-foreground">
                  <Inbox className="mx-auto mb-3 size-8 opacity-40" />
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {active.name} · <span className="font-mono text-sm">{active.id}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Role" value={active.role} />
                  <Field label="Submitted" value={formatDate(active.submittedAt)} />
                  <Field label="Email" value={active.email} />
                  <Field label="Phone" value={active.phone} />
                  <Field label="City" value={active.city} />
                  <Field label="NID Number" value={active.nid || "—"} />
                  <Field label="Trade Licence" value={active.tradeLicense || "—"} />
                  <Field label="Coverage Areas" value={active.areas || "—"} />
                </div>
                {active.experience && (
                  <Block label="Experience">{active.experience}</Block>
                )}
                {active.message && <Block label="Message">{active.message}</Block>}
                {active.files && active.files.length > 0 && (
                  <Block label="Attachments">{active.files.join(", ")}</Block>
                )}
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <span className="text-sm font-semibold">Status</span>
                  <Select
                    value={active.status ?? "New"}
                    onValueChange={(v) => setStatus(active.id, v as ApplicationStatus)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium break-words">{value}</div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm">{children}</p>
    </div>
  );
}
