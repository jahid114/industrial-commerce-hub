import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  MapPin,
  Upload,
  X,
  Briefcase,
  Users,
  TrendingUp,
  Clock,
  Award,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const schema = z.object({
  name: z.string().trim().min(2, "Full name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(8, "Phone is required").max(30),
  city: z.string().trim().min(2, "City/District is required").max(100),
  experience: z.string().trim().max(50).optional(),
  areas: z.string().trim().max(300).optional(),
  message: z.string().trim().max(1000).optional(),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Field Agent | MegaHaus" },
      {
        name: "description",
        content:
          "Join MegaHaus as a Field Agent. Help build Bangladesh's industrial marketplace across the country.",
      },
      { property: "og:title", content: "Careers — Field Agent | MegaHaus" },
      {
        property: "og:description",
        content:
          "Join MegaHaus as a Field Agent. Help build Bangladesh's industrial marketplace across the country.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
  const [done, setDone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      city: "",
      experience: "",
      areas: "",
      message: "",
    },
  });

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...list].slice(0, 3));
    e.target.value = "";
  };
  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const onSubmit = (data: FormData) => {
    // Local-only application capture; in production this should be sent to a server.
    const payload = {
      ...data,
      files: files.map((f) => f.name),
      submittedAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("career-applications") || "[]");
    localStorage.setItem("career-applications", JSON.stringify([...existing, payload]));
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-industrial text-industrial-foreground py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge className="bg-accent text-industrial hover:bg-accent/90 rounded-none px-3 py-1 text-xs font-bold uppercase tracking-widest">
              Always Hiring
            </Badge>
            <h1 className="mt-5 font-['Archivo'] text-4xl font-extrabold uppercase md:text-5xl lg:text-6xl">
              Join as a Field Agent
            </h1>
            <p className="mt-5 text-lg text-white/80">
              MegaHaus is building Bangladesh's industrial marketplace across the country. We are always looking for motivated Field Agents who want to grow with us, connect local businesses, and represent global-quality industrial products in their region.
            </p>
          </div>
        </div>
      </section>

      {/* Role highlights */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: MapPin,
                title: "Work in Your Area",
                desc: "Represent MegaHaus in your own district or industrial zone.",
              },
              {
                Icon: Briefcase,
                title: "Flexible Engagement",
                desc: "Commission-based field role with performance incentives.",
              },
              {
                Icon: Users,
                title: "Build Relationships",
                desc: "Connect factories, suppliers, contractors and maintenance teams.",
              },
              {
                Icon: TrendingUp,
                title: "Grow With Us",
                desc: "Progress into agent, partner, and leadership roles.",
              },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="border border-slate-200 bg-white p-6 hover:border-accent transition-colors"
              >
                <Icon className="size-8 text-accent" />
                <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role details + form */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Open Position"
              title="Field Agent"
              description="This role is permanently open. If you understand the local industrial market and enjoy meeting people, we want to hear from you."
            />
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Clock className="size-5 text-accent" /> What You Will Do
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {[
                    "Visit factories, workshops, and contractors to introduce MegaHaus products",
                    "Identify new customers and understand their machinery, tool, and maintenance needs",
                    "Support customers with product information and connect them to the right supplier",
                    "Collect market feedback and share leads with the MegaHaus team",
                    "Help promote the MegaHaus brand in your assigned area",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Award className="size-5 text-accent" /> What We Look For
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {[
                    "Local knowledge of industrial areas, factories, or trade zones",
                    "Strong communication skills in Bangla and basic English",
                    "Self-motivated, reliable, and comfortable visiting sites independently",
                    "Existing network in manufacturing, engineering, or construction is a plus",
                    "No previous sales experience required — we provide guidance",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 md:p-8">
            {done ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10">
                  <Check className="size-8 text-success" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold">Application received</h3>
                <p className="mt-2 text-muted-foreground">
                  Thank you for your interest. Our team will review your application and contact you soon.
                </p>
                <Button
                  className="mt-6"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setFiles([]);
                    setDone(false);
                  }}
                >
                  Apply Again
                </Button>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <h3 className="font-display text-xl font-bold border-b border-border pb-3">
                  Apply for Field Agent
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <F label="Full Name" err={form.formState.errors.name?.message}>
                    <Input {...form.register("name")} />
                  </F>
                  <F label="Email" err={form.formState.errors.email?.message}>
                    <Input type="email" {...form.register("email")} />
                  </F>
                  <F label="Phone" err={form.formState.errors.phone?.message}>
                    <Input {...form.register("phone")} />
                  </F>
                  <F label="City / District" err={form.formState.errors.city?.message}>
                    <Input {...form.register("city")} />
                  </F>
                  <F label="Experience (optional)" err={form.formState.errors.experience?.message}>
                    <Input
                      {...form.register("experience")}
                      placeholder="e.g. 2 years in sales"
                    />
                  </F>
                  <F label="Preferred Work Areas (optional)" err={form.formState.errors.areas?.message}>
                    <Input
                      {...form.register("areas")}
                      placeholder="e.g. Chattogram, Dhaka"
                    />
                  </F>
                </div>

                <F label="Why do you want to join? (optional)" err={form.formState.errors.message?.message}>
                  <Textarea
                    rows={4}
                    {...form.register("message")}
                    placeholder="Tell us about your background and what motivates you..."
                  />
                </F>

                <F label="Resume / CV Upload (optional)">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background px-3 py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                    <Upload className="size-4" />
                    <span>Click to upload resume or portfolio (PDF/JPG/PNG)</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={onFiles}
                    />
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {files.map((f, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs"
                        >
                          <span className="truncate">
                            {f.name}{" "}
                            <span className="text-muted-foreground">
                              ({(f.size / 1024).toFixed(1)} KB)
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </F>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold uppercase"
                >
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

function F({
  label,
  err,
  children,
}: {
  label: string;
  err?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 inline-block text-sm">{label}</Label>
      {children}
      {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
    </div>
  );
}
