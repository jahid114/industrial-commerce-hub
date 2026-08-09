import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, ChevronRight, Tag,
  FileText, ShoppingBag, LogOut,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { categories } from "@/data/categories";
import { toast } from "sonner";

const NAV = [
  { to: "/portal-customer/orders", label: "My Orders", icon: ShoppingBag },
  { to: "/portal-customer/quotations", label: "Quotations", icon: FileText },
  { to: "/portal-customer/profile", label: "Profile", icon: User },
] as const;

export function CustomerPortalShell({ children }: { children: ReactNode }) {
  const { user, dispatch, cartCount, wishlist } = useStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!categoriesOpen) return;
    const onDown = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
        setActiveCategory(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [categoriesOpen]);

  const activeCat = categories.find((c) => c.id === activeCategory) ?? null;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/portal-customer/catalog", search: { q: query || undefined } as never });
  };

  const signOut = () => {
    dispatch({ type: "LOGOUT" });
    toast.success("Logged out");
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="bg-industrial text-industrial-foreground text-xs">
          <div className="container mx-auto flex h-8 items-center justify-between px-4">
            <span className="hidden sm:inline">Welcome back, {user?.name}</span>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline">+880 1978 981818</span>
              <span className="hidden md:inline">info@megahaus.com</span>
              <span className="text-accent font-medium">Customer Account</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link to="/portal-customer/catalog" className="inline-flex items-center" aria-label="MegaHaus home">
            <Logo />
          </Link>

          <form onSubmit={submitSearch} className="hidden flex-1 max-w-2xl md:flex">
            <div className="relative flex w-full">
              <Input
                type="search"
                placeholder="Search products, brands, SKU…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-r-none border-r-0 h-11"
              />
              <Button type="submit" className="rounded-l-none h-11 px-5"><Search className="size-4" /></Button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1">
            <Link to="/portal-customer/wishlist" className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium hover:text-primary">
              <Heart className="size-5" />
              {wishlist.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-[10px]">{wishlist.length}</Badge>
              )}
              <span className="hidden lg:inline">Wishlist</span>
            </Link>
            <Link to="/portal-customer/cart" className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium hover:text-primary">
              <ShoppingCart className="size-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-[10px]">{cartCount}</Badge>
              )}
              <span className="hidden lg:inline">Cart</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full ml-1" aria-label="Account menu">
                  <User className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-semibold">{user?.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 focus:text-primary">
                  <Link to="/portal-customer/cart"><ShoppingCart className="size-4 mr-2" /> My Cart</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 focus:text-primary">
                  <Link to="/portal-customer/orders"><ShoppingBag className="size-4 mr-2" /> My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 focus:text-primary">
                  <Link to="/portal-customer/profile"><User className="size-4 mr-2" /> My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="size-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button className="md:hidden ml-1 p-2" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
              {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        <nav className="hidden md:block border-t border-border bg-card">
          <div className="container mx-auto flex items-center gap-1 px-4">
            <div className="relative" ref={megaRef}>
              <button
                onClick={() => { setCategoriesOpen((v) => !v); setActiveCategory(null); }}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 text-sm font-bold uppercase tracking-wide"
              >
                <Menu className="size-4" /> All Categories <ChevronDown className={`size-3 transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
              </button>
              {categoriesOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 flex w-[720px] max-w-[92vw] overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
                  <div className="w-[280px] shrink-0 border-r border-border bg-secondary/40">
                    <div className="border-b border-border px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Categories
                    </div>
                    <ul className="max-h-[420px] overflow-y-auto py-1">
                      {categories.map((c) => {
                        const isActive = activeCategory === c.id;
                        return (
                          <li key={c.id}>
                            <div className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${isActive ? "bg-card text-primary" : "hover:bg-card"}`}>
                              <Link
                                to="/portal-customer/catalog"
                                search={{ category: c.id } as never}
                                onClick={() => { setCategoriesOpen(false); setActiveCategory(null); }}
                                className="flex-1 truncate font-medium hover:text-primary"
                              >
                                {c.name}
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveCategory(isActive ? null : c.id); }}
                                className={`flex size-6 items-center justify-center rounded hover:bg-secondary ${isActive ? "text-primary" : "text-muted-foreground"}`}
                                aria-label={`Show ${c.name} subcategories`}
                                aria-expanded={isActive}
                              >
                                <ChevronRight className={`size-4 transition-transform ${isActive ? "rotate-90" : ""}`} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div className="flex-1 p-5 min-h-[320px]">
                    {activeCat ? (
                      <div>
                        <div className="mb-3 border-b border-border pb-2">
                          <h4 className="font-display text-base font-bold">{activeCat.name}</h4>
                        </div>
                        <ul className="grid grid-cols-2 gap-1.5">
                          {activeCat.subcategories.map((s) => (
                            <li key={s}>
                              <Link
                                to="/portal-customer/catalog"
                                search={{ category: activeCat.id, sub: s } as never}
                                onClick={() => { setCategoriesOpen(false); setActiveCategory(null); }}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary hover:text-primary"
                              >
                                <Tag className="size-3 text-muted-foreground" />
                                {s}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center text-muted-foreground">
                        <Menu className="size-8 opacity-40" />
                        <p className="mt-3 text-sm font-medium">Select a category</p>
                        <p className="mt-1 text-xs">Click the arrow on any category to see its subcategories</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-4 py-3 text-sm font-medium hover:text-primary"
                activeProps={{ className: "text-primary border-b-2 border-primary" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <form onSubmit={submitSearch} className="p-4">
              <div className="flex">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="rounded-r-none" />
                <Button type="submit" className="rounded-l-none"><Search className="size-4" /></Button>
              </div>
            </form>
            <nav className="flex flex-col">
              {[{ to: "/portal-customer/catalog", label: "Products" }, ...NAV.map((n) => ({ to: n.to, label: n.label }))].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="border-t border-border px-4 py-3 text-sm font-medium hover:bg-secondary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
