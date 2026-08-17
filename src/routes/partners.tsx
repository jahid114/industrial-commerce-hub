import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, TrendingUp, Handshake, Building2, Upload, X } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addPartnerRequest } from "@/lib/partner-requests";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(8, "Phone is required").max(30),
  company: z.string().trim().min(2, "Company is required").max(150),
  type: z.enum(["Partnership", "Exclusive Partnership", "Product Servicing Agent"]),
  passportNumber: z.string().trim().min(4, "Passport number is required").max(50),
  address: z.string().trim().min(5, "Address is required").max(500),
  shopLocation: z.string().trim().min(2, "Shop location is required").max(300),
  website: z
    .string()
    .trim()
    .max(255)
    .optional()
    .refine((v) => !v || /^https?:\/\/.+\..+/.test(v), "Enter a valid URL (https://...)"),
  tradeLicense: z.string().trim().max(100).optional(),
  cityCorpCert: z.string().trim().max(100).optional(),
  chamberCert: z.string().trim().max(100).optional(),
  amount: z.string().trim().max(50).optional(),
  message: z.string().trim().min(10, "Please add a short message").max(1000),
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
  const [files, setFiles] = useState<File[]>([]);
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { type: "Partnership" } });

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...list].slice(0, 10));
    e.target.value = "";
  };
  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  return (
    <PublicLayout>
      <section className="bg-industrial text-industrial-foreground py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="Partnership & Investment" title="Grow with MegaHaus" description="Join the team building Bangladesh's industrial supply infrastructure for the next decade." />
          <div className="mt-10 grid gap-px bg-white/10 md:grid-cols-3">
            {[
              { Icon: Handshake, title: "Strategic Partnership", desc: "Co-develop sourcing categories, exclusive brand deals, and operational integrations." },
              { Icon: TrendingUp, title: "Exclusive Partnership", desc: "Share-buyer model — invest in equity and unlock exclusive category rights." },
              { Icon: Building2, title: "Product Servicing Agent", desc: "Become an authorized servicing agent for MegaHaus product lines across your region." },
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

          <div className="rounded-lg border border-border bg-card p-6">
            {done ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10"><Check className="size-8 text-success" /></div>
                <h3 className="mt-4 font-display text-2xl font-bold">Inquiry received</h3>
                <p className="mt-2 text-muted-foreground">Our partnership team will reach out within 48 hours.</p>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit((values) => { addPartnerRequest({ ...values, files: files.map((f) => f.name) }); setDone(true); })} className="space-y-4">
                <h3 className="font-display text-xl font-bold border-b border-border pb-3">Talk to Us</h3>

                <F label="Partnership Type">
                  <select {...form.register("type")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="Partnership">Partnership</option>
                    <option value="Exclusive Partnership">Exclusive Partnership (Share Buyer)</option>
                    <option value="Product Servicing Agent">Product Servicing Agent (Request Form)</option>
                  </select>
                </F>

                <div className="grid grid-cols-2 gap-3">
                  <F label="Name" err={form.formState.errors.name?.message}><Input {...form.register("name")} /></F>
                  <F label="Company" err={form.formState.errors.company?.message}><Input {...form.register("company")} /></F>
                  <F label="Email" err={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></F>
                  <F label="Phone" err={form.formState.errors.phone?.message}><Input {...form.register("phone")} /></F>
                  <F label="Passport Number" err={form.formState.errors.passportNumber?.message}><Input {...form.register("passportNumber")} /></F>
                  <F label="Website (optional)" err={form.formState.errors.website?.message}><Input {...form.register("website")} placeholder="https://" /></F>
                </div>

                <F label="Address" err={form.formState.errors.address?.message}>
                  <Textarea rows={2} {...form.register("address")} />
                </F>
                <F label="Shop Location" err={form.formState.errors.shopLocation?.message}>
                  <Input {...form.register("shopLocation")} placeholder="e.g. Nawabpur Road, Dhaka" />
                </F>

                <div className="grid grid-cols-1 gap-3 border-t border-border pt-4">
                  <p className="text-sm font-medium text-muted-foreground">Business Documents (optional)</p>
                  <F label="Trade License No."><Input {...form.register("tradeLicense")} /></F>
                  <F label="City Corporation Certificate No."><Input {...form.register("cityCorpCert")} /></F>
                  <F label="Chamber of Commerce Certificate No."><Input {...form.register("chamberCert")} /></F>
                </div>

                <F label="Document Upload">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background px-3 py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                    <Upload className="size-4" />
                    <span>Click to upload licenses, certificates, or passport copy (PDF/JPG/PNG)</span>
                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onFiles} />
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {files.map((f, i) => (
                        <li key={i} className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs">
                          <span className="truncate">{f.name} <span className="text-muted-foreground">({(f.size / 1024).toFixed(1)} KB)</span></span>
                          <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive"><X className="size-3.5" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
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
