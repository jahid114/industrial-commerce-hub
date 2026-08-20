import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Check, FileText, Plus, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { products, getProduct } from "@/data/products";
import { brands } from "@/data/brands";
import { useStore } from "@/lib/store";
import { newRfqId } from "@/lib/format";
import { formatBDT } from "@/lib/format";
import { getEffectivePrice, getDiscountPct } from "@/lib/pricing";
import { nowIso } from "@/lib/quotation-workflow";
import type { Quotation, QuotationItem } from "@/data/types";
import { toast } from "sonner";

interface DraftLine {
  productId: string;
  quantity: number;
  targetPrice?: number;
  notes?: string;
}

interface Props {
  initialProductId?: string;
  onSubmitted: (rfq: Quotation) => void;
}

export function QuotationBuilder({ initialProductId, onSubmitted }: Props) {
  const { dispatch, user } = useStore();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [message, setMessage] = useState("");
  const [lines, setLines] = useState<DraftLine[]>(() =>
    initialProductId ? [{ productId: initialProductId, quantity: getProduct(initialProductId)?.moq ?? 1 }] : []
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");

  const selectedIds = new Set(lines.map((l) => l.productId));
  const availableProducts = useMemo(
    () => products.filter((p) => !selectedIds.has(p.id) && `${p.name} ${p.sku}`.toLowerCase().includes(pickerQuery.toLowerCase())),
    [pickerQuery, lines]
  );

  const updateLine = (idx: number, patch: Partial<DraftLine>) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const removeLine = (idx: number) => setLines((ls) => ls.filter((_, i) => i !== idx));
  const addProduct = (productId: string) => {
    const p = getProduct(productId);
    setLines((ls) => [...ls, { productId, quantity: p?.moq ?? 1 }]);
    setPickerOpen(false);
    setPickerQuery("");
  };

  const totalUnits = lines.reduce((s, l) => s + (l.quantity || 0), 0);
  const estSubtotal = lines.reduce((s, l) => {
    const p = getProduct(l.productId);
    return s + (p ? getEffectivePrice(p) : 0) * (l.quantity || 0);
  }, 0);
  const targetSubtotal = lines.reduce((s, l) => {
    const p = getProduct(l.productId);
    const unit = l.targetPrice ?? (p ? getEffectivePrice(p) : 0);
    return s + unit * (l.quantity || 0);
  }, 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Full name is required");
    if (!/.+@.+\..+/.test(email)) return toast.error("Valid email required");
    if (phone.trim().length < 8) return toast.error("Phone number required");
    if (lines.length === 0) return toast.error("Add at least one product");
    if (message.trim().length < 10) return toast.error("Please describe your requirement");
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
    onSubmitted(rfq);
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        {/* Products cart */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-display text-lg font-bold">Products in this RFQ</h2>
              <p className="text-xs text-muted-foreground">{lines.length} product{lines.length !== 1 ? "s" : ""} · {totalUnits} units</p>
            </div>
            <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="mr-1.5 size-4" /> Add product
            </Button>
          </div>

          {lines.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No products added yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Click "Add product" to start building your quote request.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {lines.map((line, idx) => {
                const p = getProduct(line.productId);
                if (!p) return null;
                const brand = brands.find((b) => b.id === p.brandId);
                return (
                  <div key={idx} className="flex gap-4 p-4">
                    <img src={p.image} alt={p.name} className="size-24 shrink-0 rounded-md object-cover bg-spec" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold line-clamp-1">{p.name}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{p.sku}</span>
                            {brand && <><span>·</span><Badge variant="outline" className="h-5">{brand.name}</Badge></>}
                            <span>·</span><span>{p.country}</span>
                            <span>·</span><span>List: <strong className="text-foreground">{formatBDT(getEffectivePrice(p))}</strong>{getDiscountPct(p) > 0 && <span className="ml-1 line-through">{formatBDT(p.price)}</span>}</span>
                            <span>·</span><span>MOQ: {p.moq}</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeLine(idx)} className="text-muted-foreground hover:text-destructive shrink-0" aria-label="Remove">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_160px_1fr]">
                        <div>
                          <Label className="mb-1 block text-[11px] font-semibold uppercase text-muted-foreground">Quantity</Label>
                          <div className="flex items-center rounded-md border border-input">
                            <button type="button" onClick={() => updateLine(idx, { quantity: Math.max(1, (line.quantity || 1) - 1) })} className="px-2 py-1 hover:bg-secondary">−</button>
                            <Input type="number" min={1} value={line.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })} className="h-8 border-0 text-center shadow-none focus-visible:ring-0" />
                            <button type="button" onClick={() => updateLine(idx, { quantity: (line.quantity || 1) + 1 })} className="px-2 py-1 hover:bg-secondary">+</button>
                          </div>
                        </div>
                        <div>
                          <Label className="mb-1 block text-[11px] font-semibold uppercase text-muted-foreground">Target ৳ (opt)</Label>
                          <Input type="number" min={0} placeholder="—" value={line.targetPrice ?? ""} onChange={(e) => updateLine(idx, { targetPrice: e.target.value ? Number(e.target.value) : undefined })} className="h-8" />
                        </div>
                        <div>
                          <Label className="mb-1 block text-[11px] font-semibold uppercase text-muted-foreground">Line notes</Label>
                          <Input placeholder="Specs, brand preference…" value={line.notes ?? ""} onChange={(e) => updateLine(idx, { notes: e.target.value })} className="h-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact + message */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Contact details</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Company (optional)"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          </div>
          <div className="mt-4">
            <Field label="Overall requirements">
              <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Delivery location, payment preference, certifications, timeline…" />
            </Field>
          </div>
        </div>
      </div>

      {/* Summary sidebar */}
      <aside>
        <div className="sticky top-20 space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-display text-lg font-bold border-b border-border pb-3">RFQ Summary</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Products</span><span>{lines.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total units</span><span>{totalUnits}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Est. at list price</span><span>{formatBDT(estSubtotal)}</span></div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Your target</span><span className="text-primary font-display text-xl">{formatBDT(targetSubtotal)}</span>
              </div>
            </div>
            <Button type="submit" size="lg" className="mt-5 w-full font-bold uppercase" disabled={lines.length === 0}>
              <FileText className="mr-2 size-4" /> Submit RFQ
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Our team responds within 24 hours</p>
          </div>
          <div className="rounded-lg border border-border bg-industrial p-5 text-industrial-foreground">
            <h3 className="font-display text-base font-bold">Why quote through MegaHaus?</h3>
            <ul className="mt-3 space-y-2 text-xs">
              {[
                "One RFQ for many products",
                "Direct factory pricing on bulk",
                "CIF / CFR Chittagong-Dhaka quotes",
                "Customs & duties advisory",
              ].map((t) => <li key={t} className="flex gap-2"><Check className="size-3.5 text-accent shrink-0 mt-0.5" /> {t}</li>)}
            </ul>
          </div>
        </div>
      </aside>

      {/* Product picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add product to RFQ</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border border-input px-3">
            <Search className="size-4 text-muted-foreground" />
            <Input value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} placeholder="Search by name or SKU…" className="border-0 shadow-none focus-visible:ring-0" autoFocus />
            {pickerQuery && <button type="button" onClick={() => setPickerQuery("")}><X className="size-4 text-muted-foreground" /></button>}
          </div>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border rounded-md border border-border">
            {availableProducts.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No products found</div>
            ) : availableProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addProduct(p.id)}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-secondary"
              >
                <img src={p.image} alt="" className="size-12 rounded object-cover bg-spec" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium line-clamp-1">{p.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{p.sku} · MOQ {p.moq}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-primary">{formatBDT(getEffectivePrice(p))}{getDiscountPct(p) > 0 && <span className="ml-1 text-xs font-normal text-muted-foreground line-through">{formatBDT(p.price)}</span>}</div>
                </div>
                <Plus className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </form>
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

export function QuotationSuccess({ rfq, browseHref, listHref }: { rfq: Quotation; browseHref: string; listHref: string }) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent/20">
        <Check className="size-10 text-accent-foreground" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold">Quotation Submitted</h1>
      <p className="mt-2 text-muted-foreground">Reference: <strong>{rfq.id}</strong></p>
      <p className="mt-1 text-sm text-muted-foreground">{rfq.items.length} product{rfq.items.length !== 1 ? "s" : ""} included</p>
      <p className="mt-4 text-sm text-muted-foreground">Our procurement team will review your request and respond with detailed pricing within 24 hours.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild><Link to={browseHref as never}>Browse More</Link></Button>
        <Button variant="outline" asChild><Link to={listHref as never}>My Quotations</Link></Button>
      </div>
    </div>
  );
}
