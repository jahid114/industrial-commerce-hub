import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Briefcase, Users, TrendingUp, ArrowRight, Clock } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { readJobs, type JobPosting } from "@/lib/jobs";

export const Route = createFileRoute("/careers/")({
  head: () => ({
    meta: [
      { title: "Careers at MegaHaus — Join Bangladesh's Industrial Marketplace" },
      {
        name: "description",
        content:
          "Explore open roles at MegaHaus. We are hiring Field Agents across Bangladesh to connect factories, contractors and suppliers.",
      },
      { property: "og:title", content: "Careers at MegaHaus" },
      {
        property: "og:description",
        content:
          "Explore open roles at MegaHaus. We are hiring Field Agents across Bangladesh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
  const [openings, setOpenings] = useState<JobPosting[]>([]);
  useEffect(() => {
    setOpenings(readJobs().filter((j) => j.published));
  }, []);

  return (
    <PublicLayout>
      <section className="bg-industrial text-industrial-foreground py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="font-['Archivo'] text-4xl font-extrabold uppercase md:text-5xl lg:text-6xl">
              Careers at MegaHaus
            </h1>
            <p className="mt-5 text-lg text-white/80">
              MegaHaus is building Bangladesh's industrial marketplace. Join a team that connects
              manufacturers, suppliers and contractors across the country.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: MapPin, title: "Work in Your Area", desc: "Represent MegaHaus in your own district or industrial zone." },
              { Icon: Briefcase, title: "Flexible Engagement", desc: "Commission-based field roles with performance incentives." },
              { Icon: Users, title: "Build Relationships", desc: "Connect factories, suppliers, contractors and maintenance teams." },
              { Icon: TrendingUp, title: "Grow With Us", desc: "Progress into agent, partner, and leadership roles." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-white p-6 transition-colors hover:border-accent">
                <Icon className="size-8 text-accent" />
                <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="Current Opportunities"
            title="Open Positions"
            description="Browse our open roles and apply online. Each listing has full details and an application form."
          />
          <div className="mt-8 space-y-4">
            {openings.length === 0 && (
              <p className="text-muted-foreground">
                No open positions right now. Please check back soon.
              </p>
            )}
            {openings.map((job) => (
              <article
                key={job.id}
                className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md md:flex md:items-center md:justify-between md:gap-6"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-2xl font-bold">{job.title}</h2>
                    <Badge variant="secondary" className="text-xs">Open now</Badge>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{job.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {job.location}</span>
                    <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {job.type}</span>
                  </div>
                </div>
                <Button asChild size="lg" className="mt-5 w-full gap-2 font-bold uppercase md:mt-0 md:w-auto">
                  <Link to="/careers/$slug" params={{ slug: job.slug }}>
                    Apply Now <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
