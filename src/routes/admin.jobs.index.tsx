import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Pencil, Trash2, Download, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { readApplications } from "@/lib/inbox";
import {
  downloadCsv,
  newJobId,
  readJobs,
  slugify,
  toCsv,
  writeJobs,
  type JobPosting,
} from "@/lib/jobs";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/jobs/")({
  head: () => ({ meta: [{ title: "Jobs & Applications — MegaHaus Admin" }] }),
  component: JobsPage,
});

const emptyJob = (): JobPosting => ({
  id: newJobId(),
  slug: "",
  title: "",
  type: "",
  location: "",
  summary: "",
  description: "",
  responsibilities: [],
  requirements: [],
  published: false,
  postedAt: new Date().toISOString(),
});

function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState(() => [] as ReturnType<typeof readApplications>);
  const [editing, setEditing] = useState<JobPosting | null>(null);
  const [removing, setRemoving] = useState<JobPosting | null>(null);

  useEffect(() => {
    setJobs(readJobs());
    setApplications(readApplications());
  }, []);

  const persist = (next: JobPosting[]) => {
    setJobs(next);
    writeJobs(next);
  };

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of applications) {
      const key = a.jobId ?? "unassigned";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [applications]);

  const save = (job: JobPosting) => {
    if (!job.title.trim()) {
      toast.error("Job title is required");
      return;
    }
    const withSlug = { ...job, slug: job.slug.trim() || slugify(job.title) };
    const exists = jobs.some((j) => j.id === withSlug.id);
    persist(exists ? jobs.map((j) => (j.id === withSlug.id ? withSlug : j)) : [...jobs, withSlug]);
    setEditing(null);
    toast.success(exists ? "Job updated" : "Job created");
  };

  const togglePublished = (id: string, published: boolean) => {
    persist(jobs.map((j) => (j.id === id ? { ...j, published } : j)));
    toast.success(published ? "Job is visible on the website" : "Job hidden from the website");
  };

  const exportAll = () => {
    const rows = applications.map((a) => ({
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
    if (rows.length === 0) {
      toast.error("No applications to export");
      return;
    }
    downloadCsv("all-applicants.csv", toCsv(rows));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Jobs & Applications</h1>
          <p className="text-sm text-muted-foreground">
            Create job posts, control their visibility on the public website, and review applicants.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAll}>
            <Download className="size-4 mr-1.5" /> Export all applicants
          </Button>
          <Button onClick={() => setEditing(emptyJob())}>
            <Plus className="size-4 mr-1.5" /> New Job
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Job</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Posted</th>
              <th className="px-4 py-3 text-left">Applicants</th>
              <th className="px-4 py-3 text-left">Visible on site</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((j) => (
              <tr key={j.id} className="hover:bg-secondary/50">
                <td className="px-4 py-3">
                  <Link
                    to="/admin/jobs/$jobId"
                    params={{ jobId: j.id }}
                    className="font-semibold hover:text-primary"
                  >
                    {j.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">{j.type || "—"}</div>
                </td>
                <td className="px-4 py-3">{j.location || "—"}</td>
                <td className="px-4 py-3">{formatDate(j.postedAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{counts[j.id] ?? 0}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={j.published}
                    onCheckedChange={(v) => togglePublished(j.id, v)}
                    aria-label="Toggle visibility"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin/jobs/$jobId" params={{ jobId: j.id }}>
                        <Eye className="size-4 mr-1.5" /> View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(j)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setRemoving(j)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-muted-foreground">
                  <Briefcase className="mx-auto mb-3 size-8 opacity-40" />
                  No job posts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <JobDialog job={editing} onClose={() => setEditing(null)} onSave={save} />

      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete job post</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete “{removing?.title}”? Applications already received are kept.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removing) persist(jobs.filter((j) => j.id !== removing.id));
                setRemoving(null);
                toast.success("Job deleted");
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobDialog({
  job,
  onClose,
  onSave,
}: {
  job: JobPosting | null;
  onClose: () => void;
  onSave: (job: JobPosting) => void;
}) {
  const [draft, setDraft] = useState<JobPosting | null>(job);
  useEffect(() => setDraft(job), [job]);
  if (!draft) return null;

  const set = <K extends keyof JobPosting>(key: K, value: JobPosting[K]) =>
    setDraft({ ...draft, [key]: value });

  return (
    <Dialog open={!!job} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job && job.title ? "Edit Job" : "New Job"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Job Title">
            <Input value={draft.title} onChange={(e) => set("title", e.target.value)} />
          </Row>
          <Row label="URL Slug (optional)">
            <Input
              value={draft.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder={slugify(draft.title) || "field-agent"}
            />
          </Row>
          <Row label="Type">
            <Input
              value={draft.type}
              onChange={(e) => set("type", e.target.value)}
              placeholder="Full-time · Office role"
            />
          </Row>
          <Row label="Location">
            <Input
              value={draft.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Dhaka, Bangladesh"
            />
          </Row>
          <div className="sm:col-span-2 space-y-4">
            <Row label="Short Summary">
              <Textarea
                rows={2}
                value={draft.summary}
                onChange={(e) => set("summary", e.target.value)}
              />
            </Row>
            <Row label="About the Role">
              <Textarea
                rows={4}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Row>
            <Row label="Responsibilities (one per line)">
              <Textarea
                rows={4}
                value={draft.responsibilities.join("\n")}
                onChange={(e) =>
                  set("responsibilities", e.target.value.split("\n").filter((l) => l.trim()))
                }
              />
            </Row>
            <Row label="Requirements (one per line)">
              <Textarea
                rows={4}
                value={draft.requirements.join("\n")}
                onChange={(e) =>
                  set("requirements", e.target.value.split("\n").filter((l) => l.trim()))
                }
              />
            </Row>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2">
              <Switch
                checked={draft.published}
                onCheckedChange={(v) => set("published", v)}
                id="published"
              />
              <Label htmlFor="published" className="text-sm">
                Show this job on the public website
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)}>Save Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 inline-block text-sm">{label}</Label>
      {children}
    </div>
  );
}
