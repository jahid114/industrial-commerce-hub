import { Outlet, Link, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Package, Building2, ShoppingBag, Users, FileText, BarChart3, LogOut, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const navItems: ReadonlyArray<{ to: string; label: string; icon: typeof Package; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/suppliers", label: "Suppliers", icon: Building2 },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/agents", label: "Agents", icon: Users },
  { to: "/admin/quotations", label: "Quotations", icon: FileText },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
];

function AdminLayout() {
  const { isAuthenticated, isAdmin, user, dispatch } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" });
    } else if (!isAdmin) {
      navigate({ to: "/account" });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-secondary">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="border-b border-sidebar-border p-5">
          <Logo variant="light" />
          <div className="mt-1 text-xs font-bold uppercase tracking-widest text-primary">Admin Panel</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((it) => {
            const isActive = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to as never} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
                <it.icon className="size-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="px-3 py-2 text-xs">
            <div className="font-semibold">{user?.name}</div>
            <div className="text-white/50">{user?.email}</div>
          </div>
          <Button onClick={() => { dispatch({ type: "LOGOUT" }); toast.success("Logged out"); navigate({ to: "/" }); }} variant="ghost" className="w-full justify-start rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <LogOut className="size-4 mr-3" /> Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setOpen((v) => !v)}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
          <div className="text-sm text-muted-foreground hidden md:block">MegaHaus Industrial Hub · Administrator Console</div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-medium hover:text-primary hidden sm:inline">← View Public Site</Link>
            <Button
              onClick={() => { dispatch({ type: "LOGOUT" }); toast.success("Logged out"); navigate({ to: "/" }); }}
              variant="outline"
              size="sm"
            >
              <LogOut className="size-4 sm:mr-2" /> <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
