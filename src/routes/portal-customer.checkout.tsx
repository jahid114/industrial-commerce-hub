import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStore } from "@/lib/store";
import { getProduct } from "@/data/products";
import { formatBDT, newOrderId } from "@/lib/format";
import { generateInvoice } from "@/lib/pdf";
import type { Order } from "@/data/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(8, "Valid phone required"),
  company: z.string().optional(),
  address: z.string().min(8, "Full address required"),
  city: z.string().min(2, "City is required"),
  paymentMethod: z.enum(["COD", "Bank Transfer", "bKash", "Nagad"]),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/portal-customer/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Portal" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { cart, cartSubtotal, dispatch, user } = useStore();
  const navigate = useNavigate();
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const items = cart.map((i) => ({ ...i, product: getProduct(i.productId)! })).filter((i) => i.product);
  const subtotal = cartSubtotal((id) => getProduct(id)?.price ?? 0);
  const vat = Math.round(subtotal * 0.05);
  const total = subtotal + vat;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      company: user?.company ?? "",
      address: user?.address ?? "",
      city: "",
      paymentMethod: "Bank Transfer",
      notes: "",
    },
  });

  if (items.length === 0 && !placedOrder) {
    navigate({ to: "/portal-customer/cart" });
    return null;
  }

  const onSubmit = (data: FormData) => {
    const order: Order = {
      id: newOrderId(),
      customerName: data.name,
      customerEmail: data.email,
      date: new Date().toISOString().slice(0, 10),
      items: items.map((i) => ({ productId: i.product.id, name: i.product.name, quantity: i.quantity, unitPrice: i.product.price })),
      total,
      status: "Pending",
      paymentMethod: data.paymentMethod,
      shippingAddress: `${data.address}, ${data.city}`,
    };
    dispatch({ type: "ADD_ORDER", order });
    dispatch({ type: "CLEAR_CART" });
    setPlacedOrder(order);
  };

  if (placedOrder) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-success/10">
          <Check className="size-12 text-success" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold">Order Placed!</h1>
        <p className="mt-2 text-muted-foreground">Thank you for your order. Confirmation #{placedOrder.id}</p>
        <div className="mt-8 rounded-lg border border-border bg-card p-6 text-left">
          <div className="flex justify-between border-b border-border pb-3 text-sm">
            <span className="text-muted-foreground">Order ID</span><span className="font-bold">{placedOrder.id}</span>
          </div>
          <div className="flex justify-between py-3 text-sm">
            <span className="text-muted-foreground">Total Amount</span><span className="font-display text-lg font-bold text-primary">{formatBDT(placedOrder.total)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Payment</span><span>{placedOrder.paymentMethod}</span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => generateInvoice(placedOrder)} className="font-bold"><Download className="size-4 mr-2" /> Download Invoice</Button>
          <Button variant="outline" asChild><Link to="/portal-customer/catalog">Continue Shopping</Link></Button>
          <Button variant="outline" asChild><Link to="/portal-customer/orders">View My Orders</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Checkout</h1>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Section title="Contact & Shipping">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
              <Field label="Email" error={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></Field>
              <Field label="Phone" error={form.formState.errors.phone?.message}><Input {...form.register("phone")} /></Field>
              <Field label="Company (optional)"><Input {...form.register("company")} /></Field>
              <Field label="Address" error={form.formState.errors.address?.message} className="col-span-2"><Input {...form.register("address")} /></Field>
              <Field label="City" error={form.formState.errors.city?.message}><Input {...form.register("city")} /></Field>
            </div>
          </Section>
          <Section title="Payment Method">
            <RadioGroup value={form.watch("paymentMethod")} onValueChange={(v) => form.setValue("paymentMethod", v as FormData["paymentMethod"])} className="grid grid-cols-2 gap-3">
              {(["Bank Transfer", "bKash", "Nagad", "COD"] as const).map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value={m} />
                  <span className="font-semibold">{m}</span>
                </label>
              ))}
            </RadioGroup>
          </Section>
          <Section title="Order Notes">
            <Textarea {...form.register("notes")} rows={3} placeholder="Delivery instructions, PO number, etc." />
          </Section>
        </div>
        <aside>
          <div className="sticky top-20 rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold border-b border-border pb-3">Order Summary</h2>
            <div className="my-4 max-h-64 space-y-2 overflow-y-auto">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 text-sm">
                  <img src={product.image} className="size-12 object-cover rounded" alt="" />
                  <div className="flex-1">
                    <div className="line-clamp-1 font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {quantity} · {formatBDT(product.price)}</div>
                  </div>
                  <div className="font-semibold">{formatBDT(product.price * quantity)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBDT(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">VAT (5%)</span><span>{formatBDT(vat)}</span></div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
                <span>Total</span><span className="text-primary text-xl font-display">{formatBDT(total)}</span>
              </div>
            </div>
            <Button type="submit" size="lg" className="mt-5 w-full font-bold uppercase">Place Order</Button>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-display text-lg font-bold border-b border-border pb-3 mb-4">{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, error, children, className = "" }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 inline-block text-sm">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
