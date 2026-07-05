import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import type { Role } from "@/data/types";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Login — MegaHaus" },
      { name: "description", content: "Sign in to your MegaHaus account to access orders, quotations and the wishlist." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch({
      type: "LOGIN",
      user: {
        name: email.split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        role,
      },
    });
    toast.success("Welcome back!");
    const dest =
      role === "admin" ? "/admin" :
      role === "agent" || role === "partner" ? "/portal" :
      "/portal-customer";
    // Defer navigation so the store state update flushes before the
    // destination route's auth guard reads context.
    setTimeout(() => navigate({ to: dest }), 0);
  };


  return (
    <PublicLayout>
      <div className="container mx-auto grid min-h-[70vh] place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
          <h1 className="font-display text-3xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your MegaHaus account.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label className="mb-1.5 block text-sm">Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label className="mb-1.5 block text-sm">Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div>
              <Label className="mb-1.5 block text-sm">Sign in as (demo)</Label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="customer">Customer</option>
                <option value="agent">Field Agent</option>
                <option value="partner">Partner / Investor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <Button type="submit" size="lg" className="w-full font-bold uppercase">Sign In</Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">Don't have an account? <Link to="/auth/register" className="font-semibold text-primary hover:underline">Register</Link></p>
        </div>
      </div>
    </PublicLayout>
  );
}
