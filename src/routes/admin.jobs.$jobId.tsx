import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Download, Eye, Inbox, Search } from "lucide-react";
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
import { downloadCsv, readJobs, toCsv, type JobPosting } from "@/lib/jobs";

export const Route = createFileRoute("/admin/jobs/$jobId")({
  head: () => ({ meta: [{ title: "Job Details — MegaHaus Admin" }] }),
  component: JobDetailPage,
});

const STATUSES: ApplicationStatus[] = ["New", "Reviewed", "Shortlisted", "Rejected"];

const statusTone: Record<ApplicationStatus, string> = {
  New: "bg-primary/10 text-primary border-primary/30",
  Reviewed: "bg-accent/10 text-accent border-accent/30",
  Shortlisted: "bg-success/10 text-success border-success/30",
  Rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [items, setItems] = useState<CareerApplication[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | ApplicationStatus>("All");
  const [active, setActive] = useState<CareerApplication | null>(null);

  useEffect(() => {
    const found = readJobs().find((j) => j.id === jobId) ?? null;
    setJob(found);
    setItems(
      readApplications().filter(
        (a) => a.jobId === jobId || (!a.jobId && found && a.role === found.title),
      ),
    );
  }, [jobId]);

  const setStatus = (id: string, status: ApplicationStatus) => {
    setItems((cur) => cur.map((a) => (a.id === id ? { ...a, status } : a)));
    writeApplications(readApplications().map((a) => (a.id === id ? { ...a, status } : a)));
    setActive((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
  };

  const filtered = items
    .filter((a) => (filter === "All" ? true : (a.status ?? "New") === filter))
    .filter((a) =>
      q
        ? [a.name, a.email, a.phone, a.city, a.id].join(" ").toLowerCase().includes(q.toLowerCase())
        : true,
    )
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

  const exportCsv = () => {
    const rows = filtered.map((a) => ({
      "Application ID": a.id,
      Job: a.role,
      Status: a.status ?? "New",
      Name: a.name,
      Email: a.email,
      Phone: a.phone,
      City: a.city,
      NID: a.nid ?? "",
      "Trade Licence": a.tradeLicense ?? "",
      Experience: a.experience ?? "",
      Areas: a.areas ?? "",
      Message: a.message ?? "",
      Files: (a.files ?? []).join(" | "),
      Submitted: a.submittedAt,
    }));
    downloadCsv(`${job?.slug || "job"}-applicants.csv`, toCsv(rows));
  };

  return (
    <div className="space-y-6">
      <Link
        to="/admin/jobs"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> All jobs
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{job?.title ?? "Job not found"}</h1>
          <p className="text-sm text-muted-foreground">
            {job ? `${job.type || "—"} · ${job.location || "—"}` : "This job post no longer exists."}
          </p>
        </div>
        {job && (
          <Badge variant="outline" className={job.published ? statusTone.Shortlisted : ""}>
            {job.published ? "Visible on website" : "Hidden"}
          </Badge>
        )}
      </div>

      {job && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5 lg:col-span-3">
            <p className="text-sm">{job.description || job.summary}</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <List title="Responsibilities" items={job.responsibilities} />
              <List title="Requirements" items={job.requirements} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold">Applications ({items.length})</h2>
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
        <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="size-4 mr-1.5" /> Download CSV
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Ref</th>
              <th className="px-4 py-3 text-left">Applicant</th>
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
                <td colSpan={6} className="px-4 py-14 text-center text-muted-foreground">
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
                {active.experience && <Block label="Experience">{active.experience}</Block>}
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

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium break-words">{value}</div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <p className="mt-1 whitespace-pre-wrap text-sm">{children}</p>
    </div>
  );
}
