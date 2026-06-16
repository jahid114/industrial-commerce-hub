import { Outlet, Link, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useStore } from "@/lib/store";
import { User, Package, FileText, Heart, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  component: AccountLayout,
});

const navItems: ReadonlyArray<{ to: string; label: string; icon: typeof User; exact?: boolean }> = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/account/orders", label: "My Orders", icon: Package },
  { to: "/account/quotations", label: "My Quotations", icon: FileText },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/profile", label: "Profile", icon: User },
];

function AccountLayout() {
  const { isAuthenticated, isAdmin, user, dispatch } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" });
    } else if (isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1 bg-secondary">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold">My Account</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-1 border border-border bg-card p-3 h-fit">
              {navItems.map((it) => {
                const isActive = it.exact ? pathname === it.to : pathname.startsWith(it.to);
                return (
                  <Link key={it.to} to={it.to as never} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                    <it.icon className="size-4" /> {it.label}
                  </Link>
                );
              })}
              <Button onClick={() => { dispatch({ type: "LOGOUT" }); toast.success("Logged out"); navigate({ to: "/" }); }} variant="ghost" className="w-full justify-start mt-2 text-destructive hover:text-destructive">
                <LogOut className="size-4 mr-3" /> Sign Out
              </Button>
            </aside>
            <div>
              <Outlet />
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
