import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { products, getProduct } from "@/data/products";
import { useStore } from "@/lib/store";
import { newRfqId } from "@/lib/format";
import type { Quotation } from "@/data/types";

const searchSchema = z.object({ productId: z.string().optional() });

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  company: z.string().optional(),
  productId: z.string().min(1, "Select a product"),
  quantity: z.number().int().min(1),
  message: z.string().min(10, "Tell us about your requirement"),
});
type FormData = z.infer<typeof formSchema>;

export const Route = createFileRoute("/quotation")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Request a Quotation — MegaHaus" },
      { name: "description", content: "Get a custom quote for bulk industrial orders. Our team responds within 24 hours with CIF pricing." },
    ],
  }),
  component: QuotationPage,
});

function QuotationPage() {
  const search = Route.useSearch();
  const { dispatch, user } = useStore();
  const [submitted, setSubmitted] = useState<Quotation | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      company: user?.company ?? "",
      productId: search.productId ?? "",
      quantity: 1,
      message: "",
    },
  });

  const onSubmit = (data: FormData) => {
    const product = getProduct(data.productId);
    const rfq: Quotation = {
      id: newRfqId(),
      productId: data.productId,
      productName: product?.name ?? data.productId,
      customerName: data.name,
      customerEmail: data.email,
      company: data.company,
      quantity: data.quantity,
      message: data.message,
      date: new Date().toISOString().slice(0, 10),
      status: "Open",
    };
    dispatch({ type: "ADD_QUOTATION", quotation: rfq });
    setSubmitted(rfq);
  };

  if (submitted) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-xl px-4 py-16 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent/20">
            <Check className="size-10 text-accent-foreground" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold">Quotation Submitted</h1>
          <p className="mt-2 text-muted-foreground">Reference: <strong>{submitted.id}</strong></p>
          <p className="mt-4 text-sm text-muted-foreground">Our procurement team will review your request and respond with detailed pricing within 24 hours.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild><Link to="/products">Browse More</Link></Button>
            <Button variant="outline" asChild><Link to="/account/quotations">My Quotations</Link></Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-10">
          <div className="text-xs text-muted-foreground"><Link to="/" className="hover:text-primary">Home</Link> / Request Quotation</div>
          <h1 className="mt-2 font-display text-4xl font-bold">Request a Quotation</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">For bulk industrial orders, custom configurations, or special CIF/CFR pricing — tell us what you need and our procurement team will respond within 24 hours.</p>
        </div>
      </div>

      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 rounded-lg border border-border bg-card p-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
            <Field label="Company"><Input {...form.register("company")} /></Field>
            <Field label="Email" error={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></Field>
            <Field label="Phone" error={form.formState.errors.phone?.message}><Input {...form.register("phone")} /></Field>
          </div>
          <Field label="Product" error={form.formState.errors.productId?.message}>
            <select {...form.register("productId")} className="h-10 w-full border border-input bg-background px-3 text-sm">
              <option value="">Select a product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Required quantity" error={form.formState.errors.quantity?.message}>
            <Input type="number" min={1} {...form.register("quantity", { valueAsNumber: true })} />
          </Field>
          <Field label="Message / requirements" error={form.formState.errors.message?.message}>
            <Textarea rows={5} {...form.register("message")} placeholder="Specs, delivery location, payment preference, certifications needed…" />
          </Field>
          <Button type="submit" size="lg" className="w-full font-bold uppercase"><FileText className="size-4 mr-2" /> Submit Quotation Request</Button>
        </form>

        <aside className="space-y-4">
          <div className="border border-border bg-industrial text-industrial-foreground p-5">
            <h3 className="font-display text-lg font-bold">Why request through MegaHaus?</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Direct factory pricing on bulk orders",
                "CIF / CFR Chittagong-Dhaka quotes",
                "Customs & duties advisory included",
                "Multi-supplier RFQ comparison",
                "Local Bangla support throughout",
              ].map((t) => <li key={t} className="flex gap-2"><Check className="size-4 text-accent shrink-0 mt-0.5" /> {t}</li>)}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 text-sm">
            <h3 className="font-display text-base font-bold">Need help?</h3>
            <p className="mt-1 text-muted-foreground">Call our procurement desk:</p>
            <p className="mt-2 font-semibold text-primary">+880 1978 981818</p>
          </div>
        </aside>
      </div>
    </PublicLayout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 inline-block text-sm">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
