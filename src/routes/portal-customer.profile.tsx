import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { getDefaultAddress } from "@/lib/customer-addresses";
import { AddressBook } from "@/components/customer/AddressBook";
import { KeyRound, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal-customer/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — MegaHaus Customer Portal" },
      { name: "description", content: "Manage your MegaHaus account details and saved delivery addresses." },
      { property: "og:title", content: "My Profile — MegaHaus Customer Portal" },
      { property: "og:description", content: "Manage your MegaHaus account details and saved delivery addresses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-5">
        <h1 className="font-display text-xl font-bold">My Account</h1>
        <p className="text-sm text-muted-foreground">Manage your account information and delivery addresses.</p>
      </div>
      <Tabs defaultValue="profile" className="p-5">
        <TabsList>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-5">
          <ProfileForm />
        </TabsContent>
        <TabsContent value="addresses" className="mt-5">
          <CustomerAddresses />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileForm() {
  const { user, dispatch } = useStore();
  const [editing, setEditing] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    company: user?.company ?? "",
    address: user?.address ?? "",
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "UPDATE_PROFILE", user: form });
    setEditing(false);
    toast.success("Profile updated");
  };

  const cancel = () => {
    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      company: user?.company ?? "",
      address: user?.address ?? "",
    });
    setEditing(false);
  };

  const fields: { label: string; value: string }[] = [
    { label: "Full Name", value: form.name },
    { label: "Email", value: form.email },
    { label: "Phone", value: form.phone },
    { label: "Company", value: form.company },
    { label: "Default Shipping Address", value: form.address },
  ];

  return (
    <div className="max-w-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-bold">Profile Details</h2>
          <p className="text-sm text-muted-foreground">Your account information.</p>
        </div>
        {!editing && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPwOpen(true)}>
              <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Change Password
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="space-y-4">
          <div><Label className="mb-1.5 block text-sm">Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="mb-1.5 block text-sm">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label className="mb-1.5 block text-sm">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label className="mb-1.5 block text-sm">Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div><Label className="mb-1.5 block text-sm">Default Shipping Address</Label><Textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="flex gap-2">
            <Button type="submit" className="font-bold uppercase">Save Changes</Button>
            <Button type="button" variant="outline" onClick={cancel}>Cancel</Button>
          </div>
        </form>
      ) : (
        <dl className="divide-y divide-border rounded-lg border border-border">
          {fields.map((f) => (
            <div key={f.label} className="grid gap-1 p-4 sm:grid-cols-3">
              <dt className="text-sm text-muted-foreground">{f.label}</dt>
              <dd className="whitespace-pre-line text-sm font-medium sm:col-span-2">{f.value || "—"}</dd>
            </div>
          ))}
        </dl>
      )}

      <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !next) { toast.error("All password fields are required"); return; }
    if (next.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (next !== confirm) { toast.error("Passwords do not match"); return; }
    setCurrent(""); setNext(""); setConfirm("");
    onClose();
    toast.success("Password changed");
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label className="mb-1.5 block text-sm">Current Password</Label><Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-sm">New Password</Label><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-sm">Confirm New Password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="font-bold uppercase">Update Password</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CustomerAddresses() {
  const { user, dispatch } = useStore();
  return (
    <AddressBook
      ownerEmail={user?.email}
      onDefaultChange={(addr) => {
        const fallback = user?.email ? getDefaultAddress(user.email) : undefined;
        const next = addr ?? fallback;
        if (next) dispatch({ type: "UPDATE_PROFILE", user: { address: `${next.line1}, ${next.city}` } });
      }}
    />
  );
}
