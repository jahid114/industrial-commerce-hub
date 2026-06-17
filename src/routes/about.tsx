import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Globe, Truck, ShieldCheck, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About MegaHaus Industrial Hub" },
      { name: "description", content: "MegaHaus is Bangladesh's first integrated industrial marketplace. A project of Protocol Cashmere Limited." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicLayout>
      <section className="bg-industrial text-industrial-foreground py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">A Project of Protocol Cashmere Limited</div>
          <h1 className="mt-5 font-display text-4xl font-bold md:text-6xl">Building Bangladesh's <br /><span className="text-primary">Industrial Supply Backbone</span></h1>
          <p className="mt-5 mx-auto max-w-2xl text-white/70">MegaHaus is Bangladesh's first integrated industrial marketplace, connecting global manufacturers with the factories, contractors and engineers shaping the country's future.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <SectionHeading eyebrow="Our Vision" title="A factory-floor revolution, delivered" description="From the textile lines of Ashulia to the marine yards of Chittagong, every industrial buyer in Bangladesh deserves direct access to the world's best machinery — without middlemen, opaque pricing, or weeks of email back-and-forth." />
            <p className="mt-4 text-muted-foreground">We're building the tools, the network, and the local muscle to make global sourcing as easy as ordering online.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: "180M+", l: "Customers reached", Icon: Globe },
              { n: "50+", l: "Global brands", Icon: ShieldCheck },
              { n: "1.2K+", l: "Industrial SKUs", Icon: Truck },
              { n: "30+", l: "Field agents", Icon: Users },
            ].map(({ n, l, Icon }) => (
              <div key={l} className="rounded-lg border border-border bg-card p-6">
                <Icon className="size-7 text-primary" />
                <div className="mt-3 font-display text-3xl font-bold">{n}</div>
                <div className="text-sm text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="Business Model" title="Four integrated platforms, one industrial network" align="center" />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Public Marketplace", d: "Browse, compare, request quotes and buy from a curated catalog of industrial products." },
              { t: "Customer Dashboard", d: "Track orders, manage RFQs, download invoices, and reorder favorite SKUs." },
              { t: "Admin Control Center", d: "Full inventory, supplier, order and agent management from a single command surface." },
              { t: "Agent & Partner Network", d: "Field agents drive sales; partners co-build distribution and infrastructure." },
            ].map((p) => (
              <div key={p.t} className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-display text-lg font-bold">{p.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold">Ready to source through MegaHaus?</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="font-bold uppercase"><Link to="/products">Browse Catalog <ArrowRight className="size-4 ml-2" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="font-bold uppercase"><Link to="/contact">Talk to Sales</Link></Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
