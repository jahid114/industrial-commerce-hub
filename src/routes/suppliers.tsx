import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { suppliers } from "@/data/suppliers";
import { Star, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "Global Suppliers — MegaHaus Industrial Hub" },
      { name: "description", content: "MegaHaus partners with verified industrial suppliers from Germany, Japan, USA, Italy and Switzerland." },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  return (
    <PublicLayout>
      <section className="border-b border-border bg-secondary py-12">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="Global Network" title="Our Verified Suppliers" description="MegaHaus partners with factory-direct suppliers from leading industrial economies — backed by inspection, warranty and after-sales support." />
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-card p-5 hover:border-primary transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">{s.country}</div>
                  <h3 className="mt-1 font-display text-lg font-bold">{s.name}</h3>
                </div>
                <Badge variant="outline" className="gap-1"><Star className="size-3 fill-accent text-accent" /> {s.rating}</Badge>
              </div>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>Contact: <span className="text-foreground">{s.contactName}</span></p>
                <p>Products: <span className="text-foreground">{s.productsCount}</span></p>
                <p>Partner since: <span className="text-foreground">{new Date(s.since).getFullYear()}</span></p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 border border-border bg-industrial text-industrial-foreground p-10 text-center">
          <h2 className="font-display text-3xl font-bold">Become a MegaHaus Supplier</h2>
          <p className="mt-3 max-w-xl mx-auto text-white/70">Distribute your industrial products to Bangladesh's 180 million-strong market through our verified buyer network.</p>
          <Button asChild size="lg" className="mt-6 font-bold uppercase"><Link to="/contact">Apply as Supplier <ArrowRight className="size-4 ml-2" /></Link></Button>
        </div>
      </div>
    </PublicLayout>
  );
}
