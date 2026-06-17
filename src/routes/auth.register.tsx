import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Create Account — MegaHaus" },
      { name: "description", content: "Register as a MegaHaus customer to start sourcing global industrial products." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", password: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "LOGIN", user: { name: form.name, email: form.email, phone: form.phone, company: form.company, role: "customer" } });
    toast.success("Account created!");
    navigate({ to: "/account" });
  };

  return (
    <PublicLayout>
      <div className="container mx-auto grid min-h-[70vh] place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
          <h1 className="font-display text-3xl font-bold">Create an account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Register to source through MegaHaus.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label className="mb-1.5 block text-sm">Full name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="mb-1.5 block text-sm">Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label className="mb-1.5 block text-sm">Phone</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label className="mb-1.5 block text-sm">Company (optional)</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
            <div><Label className="mb-1.5 block text-sm">Password</Label><Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <Button type="submit" size="lg" className="w-full font-bold uppercase">Create Account</Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/auth/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
        </div>
      </div>
    </PublicLayout>
  );
}
