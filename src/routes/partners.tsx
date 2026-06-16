import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, TrendingUp, Handshake, Building2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  company: z.string().min(2),
  interest: z.enum(["Partnership", "Investment", "Both"]),
  amount: z.string().optional(),
  message: z.string().min(10),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partnership & Investment — MegaHaus" },
      { name: "description", content: "Partner with or invest in MegaHaus Industrial Hub — Bangladesh's first integrated industrial marketplace." },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const [done, setDone] = useState(false);
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { interest: "Partnership" } });

  return (
    <PublicLayout>
      <section className="bg-industrial text-industrial-foreground py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="Partnership & Investment" title="Grow with MegaHaus" description="Join the team building Bangladesh's industrial supply infrastructure for the next decade." />
          <div className="mt-10 grid gap-px bg-white/10 md:grid-cols-3">
            {[
              { Icon: Handshake, title: "Strategic Partnership", desc: "Co-develop sourcing categories, exclusive brand deals, and operational integrations." },
              { Icon: TrendingUp, title: "Investment Opportunities", desc: "Equity participation in the next phase of marketplace and logistics expansion." },
              { Icon: Building2, title: "Joint Ventures", desc: "Build warehouse, distribution and after-sales infrastructure across Bangladesh." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="bg-industrial p-6">
                <Icon className="size-8 text-accent" />
                <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm text-white/70">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold">Why MegaHaus?</h2>
            <ul className="mt-6 space-y-4">
              {[
                "180M+ addressable customers in South Asia's fastest-growing industrial economy",
                "First-mover advantage as Bangladesh's first integrated industrial marketplace",
                "Operational platform across 4 surfaces: Public, Customer, Admin, Agent & Partner",
                "Established supplier relationships with Bosch, Siemens, ABB, Makita, Festo, Hilti and more",
                "Project of Protocol Cashmere Limited — proven leadership and capital backing",
              ].map((t) => (
                <li key={t} className="flex gap-3"><Check className="size-5 text-success shrink-0 mt-0.5" /><span>{t}</span></li>
              ))}
            </ul>
          </div>

          <div className="border border-border bg-card p-6">
            {done ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10"><Check className="size-8 text-success" /></div>
                <h3 className="mt-4 font-display text-2xl font-bold">Inquiry received</h3>
                <p className="mt-2 text-muted-foreground">Our partnership team will reach out within 48 hours.</p>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(() => setDone(true))} className="space-y-4">
                <h3 className="font-display text-xl font-bold border-b border-border pb-3">Talk to Us</h3>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Name" err={form.formState.errors.name?.message}><Input {...form.register("name")} /></F>
                  <F label="Company" err={form.formState.errors.company?.message}><Input {...form.register("company")} /></F>
                  <F label="Email" err={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></F>
                  <F label="Phone" err={form.formState.errors.phone?.message}><Input {...form.register("phone")} /></F>
                </div>
                <F label="Interest">
                  <select {...form.register("interest")} className="h-10 w-full border border-input bg-background px-3 text-sm">
                    <option>Partnership</option><option>Investment</option><option>Both</option>
                  </select>
                </F>
                <F label="Indicative amount (optional)"><Input {...form.register("amount")} placeholder="e.g. USD 500K" /></F>
                <F label="Message" err={form.formState.errors.message?.message}><Textarea rows={4} {...form.register("message")} /></F>
                <Button type="submit" size="lg" className="w-full font-bold uppercase">Submit Inquiry</Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function F({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 inline-block text-sm">{label}</Label>
      {children}
      {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
    </div>
  );
}
