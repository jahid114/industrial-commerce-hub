import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/account/profile")({
  head: () => ({ meta: [{ title: "Profile — MegaHaus" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, dispatch } = useStore();
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
    toast.success("Profile updated");
  };

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="font-display text-xl font-bold">My Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your account information.</p>
      </div>
      <form onSubmit={save} className="space-y-4 p-5 max-w-xl">
        <div><Label className="mb-1.5 block text-sm">Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label className="mb-1.5 block text-sm">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label className="mb-1.5 block text-sm">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><Label className="mb-1.5 block text-sm">Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
        <div><Label className="mb-1.5 block text-sm">Default Shipping Address</Label><Textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <Button type="submit" className="font-bold uppercase">Save Changes</Button>
      </form>
    </div>
  );
}
