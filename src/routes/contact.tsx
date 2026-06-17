import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Mail, Phone, MapPin } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact MegaHaus Industrial Hub" },
      { name: "description", content: "Reach the MegaHaus team for sourcing, partnerships, support and demos. Halishahar Housing Estate, Chittagong." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [done, setDone] = useState(false);
  return (
    <PublicLayout>
      <section className="border-b border-border bg-secondary py-12">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="Get in Touch" title="Contact MegaHaus" description="Sourcing inquiries, partnerships, demos and customer support." />
        </div>
      </section>

      <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <ContactRow icon={MapPin} title="Head Office">
            House No. 12, Road No. 1, Lane No. 3,<br />Halishahar Housing Estate, Chittagong, Bangladesh
          </ContactRow>
          <ContactRow icon={Phone} title="Phone">+880 1978 981818</ContactRow>
          <ContactRow icon={Mail} title="Email">info@megahaus.com<br />sales@megahaus.com</ContactRow>
          <div className="aspect-video border border-border bg-spec industrial-grid flex items-center justify-center text-muted-foreground text-sm">Map placeholder · Chittagong, Bangladesh</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          {done ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10"><Check className="size-8 text-success" /></div>
              <h3 className="mt-4 font-display text-2xl font-bold">Message sent</h3>
              <p className="mt-2 text-muted-foreground">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4">
              <h3 className="font-display text-xl font-bold border-b border-border pb-3">Send us a message</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="mb-1.5 block text-sm">Name</Label><Input required /></div>
                <div><Label className="mb-1.5 block text-sm">Email</Label><Input type="email" required /></div>
              </div>
              <div><Label className="mb-1.5 block text-sm">Subject</Label><Input required /></div>
              <div><Label className="mb-1.5 block text-sm">Message</Label><Textarea rows={5} required /></div>
              <Button type="submit" size="lg" className="w-full font-bold uppercase">Send Message</Button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

function ContactRow({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex size-10 shrink-0 items-center justify-center bg-primary text-primary-foreground"><Icon className="size-5" /></div>
      <div>
        <div className="font-display text-base font-bold">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
