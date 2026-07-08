import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Package, FileText, Heart, GitCompare, User,
  ShoppingCart, ShoppingBag, Menu, X, LogOut,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useStore } from "@/lib/store";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import { toast } from "sonner";

type NavItem = { to: string; label: string; icon: typeof Package; exact?: boolean };

const NAV: ReadonlyArray<NavItem> = [
  { to: "/portal-customer", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/portal-customer/catalog", label: "Browse Catalog", icon: Package },
  { to: "/portal-customer/cart", label: "Cart", icon: ShoppingCart },
  { to: "/portal-customer/orders", label: "My Orders", icon: ShoppingBag },
  { to: "/portal-customer/quotations", label: "Quotations", icon: FileText },
  { to: "/portal-customer/wishlist", label: "Wishlist", icon: Heart },
  { to: "/portal-customer/compare", label: "Compare", icon: GitCompare },
  { to: "/portal-customer/profile", label: "Profile", icon: User },
];

export function CustomerPortalShell({ children }: { children: ReactNode }) {
  const { user, dispatch, cartCount } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-secondary">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="border-b border-sidebar-border p-5">
          <Logo variant="light" />
          <div className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
            Customer Portal
            <Badge variant="outline" className="border-white/20 text-[10px] text-white/80">Demo</Badge>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {NAV.map((it) => {
            const isActive = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to as never}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
              >
                <span className="flex items-center gap-3"><it.icon className="size-4" /> {it.label}</span>
                {it.to === "/portal-customer/cart" && cartCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{cartCount}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="px-3 py-2 text-xs">
            <div className="font-semibold">{user?.name}</div>
            <div className="text-white/50">{user?.email}</div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setOpen((v) => !v)}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
          <div className="text-sm text-muted-foreground hidden md:block">MegaHaus Industrial Hub · Customer Portal</div>
          <div className="flex items-center gap-3">
            <Link to="/portal-customer/cart" className="relative flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary">
              <ShoppingCart className="size-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{cartCount}</span>
              )}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full" aria-label="Account menu">
                  <User className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-semibold">{user?.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/portal-customer/profile" className="cursor-pointer">
                    <User className="size-4 mr-2" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => { dispatch({ type: "LOGOUT" }); toast.success("Logged out"); navigate({ to: "/" }); }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
