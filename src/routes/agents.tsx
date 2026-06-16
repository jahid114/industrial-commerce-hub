import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Users, TrendingUp, MapPin } from "lucide-react";
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
  area: z.string().min(2),
  experience: z.string().min(2),
  message: z.string().optional(),
});

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agent Program — Earn with MegaHaus" },
      { name: "description", content: "Become a MegaHaus field agent. Earn commissions by connecting industrial buyers with the products they need." },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const [done, setDone] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  return (
    <PublicLayout>
      <section className="bg-industrial text-industrial-foreground py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="Agent Program" title="Earn with MegaHaus" description="Be a part of Bangladesh's industrial revolution. Earn commissions on every order you bring to MegaHaus from your area." />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { Icon: TrendingUp, title: "Up to 6% commission", desc: "On every order successfully delivered through your referral." },
              { Icon: Users, title: "Dedicated support", desc: "Bangla-speaking back-office, product training and lead routing." },
              { Icon: MapPin, title: "Protected territory", desc: "Exclusive area assignment — no agent-on-agent overlap." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="border border-white/10 bg-white/5 p-6">
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
            <h2 className="font-display text-3xl font-bold">How it works</h2>
            <ol className="mt-6 space-y-5">
              {[
                ["Apply", "Submit the registration form with your area and experience."],
                ["Onboard", "Get trained on the product catalog, MegaHaus app, and pricing."],
                ["Refer", "Bring industrial buyers in your area to MegaHaus — drop a lead or place orders directly."],
                ["Earn", "Receive commission on every shipped order, paid monthly via bKash, Nagad or bank."],
              ].map(([title, desc], i) => (
                <li key={title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center bg-primary text-primary-foreground font-display text-lg font-bold">{i + 1}</div>
                  <div>
                    <div className="font-display text-lg font-bold">{title}</div>
                    <div className="text-sm text-muted-foreground">{desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="border border-border bg-card p-6">
            {done ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10"><Check className="size-8 text-success" /></div>
                <h3 className="mt-4 font-display text-2xl font-bold">Application received</h3>
                <p className="mt-2 text-muted-foreground">Our agent team will call you within 3 business days.</p>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(() => setDone(true))} className="space-y-4">
                <h3 className="font-display text-xl font-bold border-b border-border pb-3">Agent Registration</h3>
                <F label="Full name" err={form.formState.errors.name?.message}><Input {...form.register("name")} /></F>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Email" err={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></F>
                  <F label="Phone" err={form.formState.errors.phone?.message}><Input {...form.register("phone")} /></F>
                </div>
                <F label="Area / Region" err={form.formState.errors.area?.message}><Input placeholder="e.g. Chittagong EPZ" {...form.register("area")} /></F>
                <F label="Industry experience" err={form.formState.errors.experience?.message}><Input placeholder="e.g. 5 years in textile machinery sales" {...form.register("experience")} /></F>
                <F label="Why MegaHaus? (optional)"><Textarea rows={3} {...form.register("message")} /></F>
                <Button type="submit" size="lg" className="w-full font-bold uppercase">Apply Now</Button>
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
