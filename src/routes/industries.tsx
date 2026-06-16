import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/SectionHeading";
import { ArrowRight } from "lucide-react";

const industries = [
  { id: "textile", name: "Textile & Garments", img: "1532601224476-15c79f2f7a51", desc: "Cutting tables, sewing automation, dyeing line spares, compressed air systems for RMG factories.", solutions: ["Pneumatic Systems", "Cutting Tools", "Dyeing Line Spares", "Air Compressors"] },
  { id: "marine", name: "Marine & Shipping", img: "1605281317010-fe5ffe798166", desc: "Port equipment, ship maintenance, repair tools and high-pressure cleaning systems.", solutions: ["Pressure Washers", "Marine Pumps", "Welding Equipment", "Lifting Gear"] },
  { id: "construction", name: "Construction & Infrastructure", img: "1581094288338-2314dddb7ece", desc: "Concrete tools, lasers, fastening systems, scaffolding and heavy equipment.", solutions: ["Rotary Hammers", "Line Lasers", "Skid Steers", "Fastening Tools"] },
  { id: "automation", name: "Power & Automation", img: "1581092160562-40aa08e78837", desc: "PLCs, drives, contactors, switchgear and instrumentation for industrial automation.", solutions: ["PLCs (Siemens)", "VFDs (ABB)", "Pneumatic Valves (Festo)", "Industrial Robots"] },
  { id: "automotive", name: "Automotive Service", img: "1530124566582-a618bc2615dc", desc: "Garage tools, diagnostic equipment, vehicle lifts and lubrication systems.", solutions: ["Diagnostic Tools", "Lifts", "Compressors", "Detailing Systems"] },
];

export const Route = createFileRoute("/industries")({
  head: () => ({
    meta: [
      { title: "Industrial Solutions by Sector — MegaHaus" },
      { name: "description", content: "Tailored sourcing programs for Textile, Marine, Construction, Power & Automotive sectors in Bangladesh." },
    ],
  }),
  component: IndustriesPage,
});

function IndustriesPage() {
  return (
    <PublicLayout>
      <section className="border-b border-border bg-industrial text-industrial-foreground py-16">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="Industrial Solutions" title="Built for Every Industry" description="From textile floors in Ashulia to marine yards in Chittagong — we equip the sectors that drive Bangladesh." />
        </div>
      </section>

      <div className="container mx-auto space-y-16 px-4 py-16">
        {industries.map((ind, i) => (
          <div key={ind.id} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""}`}>
            <div className="aspect-[4/3] overflow-hidden">
              <img src={`https://images.unsplash.com/photo-${ind.img}?w=900&q=80&auto=format&fit=crop`} alt={ind.name} className="size-full object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2"><span className="h-0.5 w-8 bg-primary" /><span className="text-xs font-bold uppercase tracking-widest text-primary">Industry</span></div>
              <h2 className="mt-3 font-display text-3xl font-bold">{ind.name}</h2>
              <p className="mt-3 text-muted-foreground">{ind.desc}</p>
              <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {ind.solutions.map((s) => <li key={s} className="border border-border bg-card px-3 py-2 font-medium">{s}</li>)}
              </ul>
              <Button asChild className="mt-6 font-semibold"><Link to="/products">Explore Products <ArrowRight className="size-4 ml-2" /></Link></Button>
            </div>
          </div>
        ))}
      </div>
    </PublicLayout>
  );
}
