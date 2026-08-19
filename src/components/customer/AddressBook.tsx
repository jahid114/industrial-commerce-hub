import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerAddresses, newAddressId, type CustomerAddress } from "@/lib/customer-addresses";

const emptyAddress = (): CustomerAddress => ({
  id: newAddressId(),
  label: "",
  line1: "",
  city: "",
  isDefault: false,
});

interface AddressBookProps {
  /** Customer email — addresses are stored per customer. */
  ownerEmail?: string;
  title?: string;
  description?: string;
  readOnly?: boolean;
  compact?: boolean;
  /** Called whenever the default address changes so callers can sync their own record. */
  onDefaultChange?: (address: CustomerAddress | undefined) => void;
}

export function AddressBook({
  ownerEmail,
  title = "Saved Addresses",
  description = "Keep multiple delivery addresses and mark one as default.",
  readOnly = false,
  compact = false,
  onDefaultChange,
}: AddressBookProps) {
  const { addresses, upsert, remove, makeDefault } = useCustomerAddresses(ownerEmail);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);

  const notifyDefault = (list: CustomerAddress[]) => {
    onDefaultChange?.(list.find((a) => a.isDefault) ?? list[0]);
  };

  if (!ownerEmail) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Save the customer first to manage delivery addresses.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className={compact ? "text-sm font-bold" : "font-display text-base font-bold"}>{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {!readOnly && (
          <Button size="sm" className="font-bold uppercase" onClick={() => setEditing(emptyAddress())}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Address
          </Button>
        )}
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <MapPin className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-lg border border-border p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="font-semibold">{a.label || "Address"}</div>
                {a.isDefault && <Badge variant="secondary">Default</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">
                <div>{a.line1}</div>
                <div>{a.city}</div>
              </div>
              {!readOnly && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(a)}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
                  {!a.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        makeDefault(a.id);
                        notifyDefault(addresses.map((x) => ({ ...x, isDefault: x.id === a.id })));
                        toast.success("Default address updated");
                      }}
                    >
                      <Star className="mr-1.5 h-3.5 w-3.5" /> Set Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      remove(a.id);
                      const next = addresses.filter((x) => x.id !== a.id);
                      if (next.length && !next.some((x) => x.isDefault)) next[0] = { ...next[0], isDefault: true };
                      notifyDefault(next);
                      toast.success("Address removed");
                    }}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AddressDialog
        address={editing}
        onClose={() => setEditing(null)}
        onSave={(a) => {
          upsert(a);
          const exists = addresses.some((x) => x.id === a.id);
          let next = exists ? addresses.map((x) => (x.id === a.id ? a : x)) : [...addresses, a];
          if (a.isDefault || next.length === 1) next = next.map((x) => ({ ...x, isDefault: x.id === a.id }));
          notifyDefault(next);
          setEditing(null);
          toast.success("Address saved");
        }}
      />
    </div>
  );
}

function AddressDialog({ address, onClose, onSave }: { address: CustomerAddress | null; onClose: () => void; onSave: (a: CustomerAddress) => void }) {
  const [form, setForm] = useState<CustomerAddress | null>(address);

  if (address && (!form || form.id !== address.id)) setForm(address);
  if (!address || !form) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.line1.trim() || !form.city.trim()) {
      toast.error("Address and city are required");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{address.label || address.line1 ? "Edit Address" : "Add Address"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label className="mb-1.5 block text-sm">Label (e.g. Factory, Office)</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
          <div><Label className="mb-1.5 block text-sm">City *</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><Label className="mb-1.5 block text-sm">Address *</Label><Input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={!!form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: !!v })} />
            Set as default delivery address
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="font-bold uppercase">Save Address</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
