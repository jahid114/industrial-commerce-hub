import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, MapPin, Briefcase, ChevronLeft, Clock, Award } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { readApplications, writeApplications } from "@/lib/inbox";
import { readJobs, type JobPosting } from "@/lib/jobs";

export const Route = createFileRoute("/careers/$slug")({
  head: () => ({
    meta: [
      { title: "Job Opening — MegaHaus Careers" },
      {
        name: "description",
        content:
          "View the full job description and apply online to join MegaHaus, Bangladesh's industrial marketplace.",
      },
      { property: "og:title", content: "Job Opening — MegaHaus Careers" },
      {
        property: "og:description",
        content: "View the full job description and apply online to join MegaHaus.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobPage,
});

function JobPage() {
  const { slug } = Route.useParams();
  const [job, setJob] = useState<JobPosting | null | undefined>(undefined);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    nid: "",
    tradeLicense: "",
    experience: "",
    areas: "",
    message: "",
  });

  useEffect(() => {
    setJob(readJobs().find((j) => j.slug === slug && j.published) ?? null);
  }, [slug]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    writeApplications([
      ...readApplications(),
      {
        id: `APP-${Date.now().toString(36).toUpperCase()}`,
        jobId: job.id,
        role: job.title,
        status: "New" as const,
        ...form,
        submittedAt: new Date().toISOString(),
      },
    ]);
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (job === undefined) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
          Loading job…
        </div>
      </PublicLayout>
    );
  }

  if (job === null) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-bold">Position not available</h1>
          <p className="mt-3 text-muted-foreground">
            This job posting is no longer open or has been removed.
          </p>
          <Button asChild className="mt-6">
            <Link to="/careers">View all openings</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="bg-industrial text-industrial-foreground py-14 md:py-20">
        <div className="container mx-auto px-4">
          <Link
            to="/careers"
            className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
          >
            <ChevronLeft className="size-4" /> All openings
          </Link>
          <h1 className="mt-4 font-['Archivo'] text-4xl font-extrabold uppercase md:text-5xl">
            {job.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/80">
            <Badge className="bg-accent text-industrial hover:bg-accent/90">Open now</Badge>
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {job.location}
              </span>
            )}
            {job.type && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="size-4" /> {job.type}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold">About the role</h2>
            <p className="mt-3 text-slate-700">{job.description || job.summary}</p>
            <div className="mt-8 space-y-6">
              {job.responsibilities.length > 0 && (
                <Bullets Icon={Clock} title="What You Will Do" items={job.responsibilities} />
              )}
              {job.requirements.length > 0 && (
                <Bullets Icon={Award} title="What We Look For" items={job.requirements} />
              )}
            </div>
          </div>

          <div id="apply" className="rounded-lg border border-border bg-card p-6 md:p-8">
            {done ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10">
                  <Check className="size-8 text-success" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold">Application received</h3>
                <p className="mt-2 text-muted-foreground">
                  Thank you for your interest. Our team will review your application and contact you
                  soon.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h2 className="border-b border-border pb-3 font-display text-xl font-bold">
                  Apply for {job.title}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <F label="Full Name">
                    <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </F>
                  <F label="Email">
                    <Input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </F>
                  <F label="Phone">
                    <Input required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                  </F>
                  <F label="City / District">
                    <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
                  </F>
                  <F label="NID Number">
                    <Input required value={form.nid} onChange={(e) => set("nid", e.target.value)} />
                  </F>
                  <F label="Trade Licence No. (optional)">
                    <Input
                      value={form.tradeLicense}
                      onChange={(e) => set("tradeLicense", e.target.value)}
                    />
                  </F>
                  <F label="Experience (optional)">
                    <Input
                      value={form.experience}
                      onChange={(e) => set("experience", e.target.value)}
                    />
                  </F>
                  <F label="Preferred Work Areas (optional)">
                    <Input value={form.areas} onChange={(e) => set("areas", e.target.value)} />
                  </F>
                </div>
                <F label="Why do you want to join? (optional)">
                  <Textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                  />
                </F>
                <Button type="submit" size="lg" className="w-full font-bold uppercase">
                  Submit Application
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function Bullets({
  Icon,
  title,
  items,
}: {
  Icon: typeof Clock;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
        <Icon className="size-5 text-accent" /> {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 inline-block text-sm">{label}</Label>
      {children}
    </div>
  );
}
