import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Check, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { products, getProduct } from "@/data/products";
import { useStore } from "@/lib/store";
import { newRfqId } from "@/lib/format";
import { nowIso } from "@/lib/quotation-workflow";
import type { Quotation, QuotationItem } from "@/data/types";
import { toast } from "sonner";

const searchSchema = z.object({ productId: z.string().optional() });

interface DraftLine {
  productId: string;
  quantity: number;
  targetPrice?: number;
  notes?: string;
}

export const Route = createFileRoute("/quotation")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Request a Quotation — MegaHaus" },
      { name: "description", content: "Get a custom quote on multiple products in one request. Our team responds within 24 hours with CIF pricing." },
    ],
  }),
  component: QuotationPage,
});

function QuotationPage() {
  const search = Route.useSearch();
  const { dispatch, user } = useStore();
  const [submitted, setSubmitted] = useState<Quotation | null>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [message, setMessage] = useState("");
  const [lines, setLines] = useState<DraftLine[]>(() => [
    { productId: search.productId ?? "", quantity: 1 },
  ]);

  const updateLine = (idx: number, patch: Partial<DraftLine>) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, { productId: "", quantity: 1 }]);
  const removeLine = (idx: number) => setLines((ls) => ls.length === 1 ? ls : ls.filter((_, i) => i !== idx));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Full name is required");
    if (!/.+@.+\..+/.test(email)) return toast.error("Valid email required");
    if (phone.trim().length < 8) return toast.error("Phone number required");
    if (message.trim().length < 10) return toast.error("Please describe your requirement");
    if (lines.some((l) => !l.productId)) return toast.error("Pick a product for every line");
    if (lines.some((l) => !l.quantity || l.quantity < 1)) return toast.error("Quantity must be at least 1");

    const items: QuotationItem[] = lines.map((l) => {
      const p = getProduct(l.productId);
      return {
        productId: l.productId,
        productName: p?.name ?? l.productId,
        quantity: l.quantity,
        targetPrice: l.targetPrice,
        notes: l.notes,
      };
    });

    const rfq: Quotation = {
      id: newRfqId(),
      customerName: name.trim(),
      customerEmail: email.trim(),
      customerPhone: phone.trim(),
      company: company.trim() || undefined,
      date: new Date().toISOString().slice(0, 10),
      items,
      message: message.trim(),
      status: "New",
      timeline: [
        { at: nowIso(), by: name.trim() || "Customer", type: "created", message: `RFQ submitted with ${items.length} product${items.length !== 1 ? "s" : ""}` },
      ],
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
          <p className="mt-1 text-sm text-muted-foreground">{submitted.items.length} product{submitted.items.length !== 1 ? "s" : ""} included</p>
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
          <p className="mt-2 max-w-2xl text-muted-foreground">Add one or more products to your RFQ. Our procurement team will respond with a consolidated quote within 24 hours.</p>
        </div>
      </div>

      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="space-y-6 rounded-lg border border-border bg-card p-6">
          <div>
            <h2 className="font-display text-lg font-bold">Contact details</h2>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Field label="Full Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Company (optional)"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
              <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Products <span className="ml-2 text-sm font-normal text-muted-foreground">({lines.length})</span></h2>
              <Button type="button" size="sm" variant="outline" onClick={addLine}><Plus className="mr-1 size-4" /> Add product</Button>
            </div>
            <div className="mt-3 space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="rounded-md border border-border p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_100px_140px_auto]">
                    <div>
                      <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Product</Label>
                      <select
                        value={line.productId}
                        onChange={(e) => updateLine(idx, { productId: e.target.value })}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Select a product…</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Qty</Label>
                      <Input type="number" min={1} value={line.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Target ৳ (opt)</Label>
                      <Input type="number" min={0} placeholder="—" value={line.targetPrice ?? ""} onChange={(e) => updateLine(idx, { targetPrice: e.target.value ? Number(e.target.value) : undefined })} />
                    </div>
                    <div className="flex items-end">
                      <Button type="button" size="icon" variant="ghost" className="hover:text-destructive" disabled={lines.length === 1} onClick={() => removeLine(idx)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">Line notes (optional)</Label>
                    <Input placeholder="Specs, brand preference…" value={line.notes ?? ""} onChange={(e) => updateLine(idx, { notes: e.target.value })} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Field label="Overall requirements">
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Delivery location, payment preference, certifications, timeline…" />
          </Field>

          <Button type="submit" size="lg" className="w-full font-bold uppercase">
            <FileText className="mr-2 size-4" /> Submit Quotation Request
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="border border-border bg-industrial text-industrial-foreground p-5">
            <h3 className="font-display text-lg font-bold">Why request through MegaHaus?</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "One RFQ for many products",
                "Direct factory pricing on bulk orders",
                "CIF / CFR Chittagong-Dhaka quotes",
                "Customs & duties advisory included",
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 inline-block text-sm">{label}</Label>
      {children}
    </div>
  );
}
