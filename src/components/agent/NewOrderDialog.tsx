import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ShoppingCart, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { products } from "@/data/products";
import { getAgentPrice } from "@/lib/pricing";
import { formatBDT, newOrderId } from "@/lib/format";
import type { Order } from "@/data/types";
import {
  type AgentCustomer,
  loadAgentCustomers,
  saveAgentCustomers,
  newCustomerId,
} from "@/lib/agent-customers";

interface LineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  presetCustomer?: AgentCustomer | null;
  /** If true, preload line items from the shared cart on open. */
  preloadCart?: boolean;
  onPlaced?: (order: Order) => void;
}

type Mode = "existing" | "new";

export function NewOrderDialog({ open, onOpenChange, presetCustomer, preloadCart, onPlaced }: Props) {
  const { dispatch, cart, user } = useStore();

  const [customers, setCustomers] = useState<AgentCustomer[]>([]);
  const [mode, setMode] = useState<Mode>("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // New-customer draft
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const [lines, setLines] = useState<LineItem[]>([]);
  const [pickerId, setPickerId] = useState<string>("");
  const [payment, setPayment] = useState<Order["paymentMethod"]>("Bank Transfer");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setCustomers(loadAgentCustomers());
    setPickerId("");
    setPayment("Bank Transfer");
    setNotes("");

    if (presetCustomer) {
      setMode("existing");
      setSelectedCustomerId(presetCustomer.id);
      setAddress(presetCustomer.address);
    } else {
      setMode("existing");
      setSelectedCustomerId("");
      setAddress("");
      setNewName(""); setNewContact(""); setNewPhone(""); setNewEmail(""); setNewAddress("");
    }

    if (preloadCart && cart.length > 0) {
      const preLines = cart
        .map((c) => {
          const p = products.find((x) => x.id === c.productId);
          if (!p) return null;
          return { productId: p.id, quantity: c.quantity, unitPrice: getAgentPrice(p) };
        })
        .filter(Boolean) as LineItem[];
      setLines(preLines);
    } else {
      setLines([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetCustomer?.id, preloadCart]);

  // Sync address when picking an existing customer
  useEffect(() => {
    if (mode !== "existing") return;
    const c = customers.find((x) => x.id === selectedCustomerId);
    if (c) setAddress(c.address);
  }, [mode, selectedCustomerId, customers]);

  // Sync address from new-customer draft
  useEffect(() => {
    if (mode === "new") setAddress(newAddress);
  }, [mode, newAddress]);

  const resolvedCustomer: AgentCustomer | null = useMemo(() => {
    if (mode === "existing") {
      return customers.find((c) => c.id === selectedCustomerId) ?? null;
    }
    if (!newName.trim() || !newContact.trim() || !newPhone.trim() || !newAddress.trim()) return null;
    return {
      id: newCustomerId(),
      name: newName.trim(),
      contact: newContact.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      interest: "—",
      address: newAddress.trim(),
      est: 0,
    };
  }, [mode, customers, selectedCustomerId, newName, newContact, newPhone, newEmail, newAddress]);

  const addLine = () => {
    if (!pickerId) return;
    if (lines.some((l) => l.productId === pickerId)) { toast.error("Product already added"); return; }
    const p = products.find((x) => x.id === pickerId);
    if (!p) return;
    setLines((prev) => [...prev, { productId: p.id, quantity: p.moq, unitPrice: getAgentPrice(p) }]);
    setPickerId("");
  };

  const updateLine = (id: string, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l) => l.productId === id ? { ...l, ...patch } : l));

  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.productId !== id));

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const vat = Math.round(subtotal * 0.05);
  const total = subtotal + vat;

  const placeOrder = () => {
    if (!resolvedCustomer) {
      toast.error(mode === "existing" ? "Select a customer" : "Fill in required customer fields");
      return;
    }
    if (lines.length === 0) { toast.error("Add at least one product"); return; }
    if (!address.trim()) { toast.error("Delivery address required"); return; }

    let customer = resolvedCustomer;
    if (mode === "new") {
      const updated = [customer, ...customers];
      setCustomers(updated);
      saveAgentCustomers(updated);
      toast.success(`Customer ${customer.name} added`);
    }

    const order: Order = {
      id: newOrderId(),
      customerName: customer.name,
      customerEmail: customer.email ?? "",
      customerPhone: customer.phone,
      date: new Date().toISOString().slice(0, 10),
      items: lines.map((l) => {
        const p = products.find((x) => x.id === l.productId)!;
        return { productId: p.id, name: p.name, quantity: l.quantity, unitPrice: l.unitPrice, sku: p.sku };
      }),
      subtotal,
      tax: vat,
      total,
      status: "Pending",
      paymentStatus: "Unpaid",
      paymentMethod: payment,
      shippingAddress: address,
      internalNotes: notes || undefined,
      timeline: [{
        at: new Date().toISOString(),
        by: user?.name ?? "Agent",
        type: "created",
        message: `Order created for ${customer.name}`,
      }],
    };
    dispatch({ type: "ADD_ORDER", order });
    if (preloadCart) dispatch({ type: "CLEAR_CART" });
    toast.success(`Order ${order.id} placed for ${customer.name}`);
    onPlaced?.(order);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Order{presetCustomer ? ` for ${presetCustomer.name}` : ""}</DialogTitle>
          <DialogDescription>
            Select or add a customer, choose products, adjust selling prices, and place the order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer picker */}
          {!presetCustomer && (
            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold flex-1">Customer</div>
                <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setMode("existing")}
                    className={`px-2.5 py-1 rounded-sm inline-flex items-center gap-1 ${mode === "existing" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  ><Users className="size-3.5" /> Existing</button>
                  <button
                    type="button"
                    onClick={() => setMode("new")}
                    className={`px-2.5 py-1 rounded-sm inline-flex items-center gap-1 ${mode === "new" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  ><UserPlus className="size-3.5" /> New</button>
                </div>
              </div>

              {mode === "existing" ? (
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select an existing customer…" /></SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">No customers yet — switch to “New”.</div>
                    )}
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} — {c.contact}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <div><Label className="mb-1.5 inline-block text-xs">Company</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
                  <div><Label className="mb-1.5 inline-block text-xs">Contact person *</Label><Input value={newContact} onChange={(e) => setNewContact(e.target.value)} /></div>
                  <div><Label className="mb-1.5 inline-block text-xs">Phone *</Label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} /></div>
                  <div><Label className="mb-1.5 inline-block text-xs">Email</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
                  <div className="md:col-span-2"><Label className="mb-1.5 inline-block text-xs">Delivery address *</Label><Textarea rows={2} value={newAddress} onChange={(e) => setNewAddress(e.target.value)} /></div>
                </div>
              )}
            </div>
          )}

          {/* Products */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold flex-1">Products</div>
              {preloadCart && (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <ShoppingCart className="size-3.5" /> Preloaded from cart
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={pickerId} onValueChange={setPickerId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select a product to add…" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {formatBDT(getAgentPrice(p))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addLine} disabled={!pickerId}><Plus className="size-4 mr-1.5" />Add</Button>
            </div>

            {lines.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No products added yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-spec text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 text-left">Product</th>
                      <th className="px-2 py-2 text-right w-24">Qty</th>
                      <th className="px-2 py-2 text-right w-36">Unit price (৳)</th>
                      <th className="px-2 py-2 text-right w-32">Line total</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lines.map((l) => {
                      const p = products.find((x) => x.id === l.productId)!;
                      const agent = getAgentPrice(p);
                      return (
                        <tr key={l.productId}>
                          <td className="px-2 py-2">
                            <div className="font-medium line-clamp-1">{p.name}</div>
                            <div className="text-xs text-muted-foreground">Agent ৳ {agent.toLocaleString()} · List ৳ {p.price.toLocaleString()}</div>
                          </td>
                          <td className="px-2 py-2">
                            <Input type="number" min={1} value={l.quantity}
                              onChange={(e) => updateLine(l.productId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                              className="text-right h-8" />
                          </td>
                          <td className="px-2 py-2">
                            <Input type="number" min={0} value={l.unitPrice}
                              onChange={(e) => updateLine(l.productId, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                              className="text-right h-8" />
                          </td>
                          <td className="px-2 py-2 text-right font-semibold">{formatBDT(l.unitPrice * l.quantity)}</td>
                          <td className="px-2 py-2 text-right">
                            <Button size="icon" variant="ghost" onClick={() => removeLine(l.productId)} className="text-destructive hover:text-destructive size-8">
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="mb-1.5 inline-block text-sm">Payment method</Label>
              <Select value={payment} onValueChange={(v) => setPayment(v as Order["paymentMethod"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Bank Transfer", "bKash", "Nagad", "COD"] as const).map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 inline-block text-sm">Delivery address</Label>
              <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1.5 inline-block text-sm">Order notes (optional)</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery instructions, PO, etc." />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBDT(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">VAT (5%)</span><span>{formatBDT(vat)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
              <span>Total</span><span className="text-primary font-display text-lg">{formatBDT(total)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={placeOrder}>Place Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
