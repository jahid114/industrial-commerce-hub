import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search, ShoppingCart, User, Menu, X, ChevronDown, ChevronRight, Tag } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { categories } from "@/data/categories";
import { useNavigate } from "@tanstack/react-router";

export function PublicHeader() {
  const { cartCount, isAuthenticated, isAdmin, isAgent, isPartner, user } = useStore();
  const accountHref = isAdmin ? "/admin" : (isAgent || isPartner) ? "/portal" : isAuthenticated ? "/portal-customer" : "/auth/login";
  const cartHref = isAuthenticated && !isAdmin && !isAgent && !isPartner ? "/portal-customer/cart" : "/cart";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
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
    navigate({ to: "/products", search: { q: query || undefined } as never });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top utility strip */}
      <div className="bg-industrial text-industrial-foreground text-xs">
        <div className="container mx-auto flex h-8 items-center justify-between px-4">
          <span className="hidden sm:inline">Global Industrial Products · Delivered to Bangladesh</span>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">+880 1978 981818</span>
            <span className="hidden md:inline">info@megahaus.com</span>
            <span className="text-accent font-medium">EN | BN</span>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Logo />

        <form onSubmit={submitSearch} className="hidden flex-1 max-w-2xl md:flex">
          <div className="relative flex w-full">
            <Input
              type="search"
              placeholder="Search products, brands, SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-r-none border-r-0 h-11"
            />
            <Button type="submit" className="rounded-l-none h-11 px-5">
              <Search className="size-4" />
            </Button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1">
          {isAuthenticated ? (
            <Link to={accountHref} className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium hover:text-primary">
              <User className="size-4" />
              <span>{user?.name.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link to="/auth/login" className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium hover:text-primary">
              <User className="size-4" /> Login
            </Link>
          )}
          <Link to={cartHref} className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium hover:text-primary">
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-[10px]">{cartCount}</Badge>
            )}
            <span className="hidden lg:inline">Cart</span>
          </Link>
          <button className="md:hidden ml-1 p-2" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Category nav */}
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
                {/* Left: categories */}
                <div className="w-[280px] shrink-0 border-r border-border bg-secondary/40">
                  <div className="border-b border-border px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Categories
                  </div>
                  <ul className="max-h-[420px] overflow-y-auto py-1">
                    {categories.map((c) => {
                      const isActive = activeCategory === c.id;
                      return (
                        <li key={c.id}>
                          <div
                            className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${isActive ? "bg-card text-primary" : "hover:bg-card"}`}
                          >
                            <Link
                              to="/products"
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

                {/* Right: subcategories */}
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
                              to="/products"
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
          {[
            { to: "/", label: "Home" },
            { to: "/products", label: "Products" },
            { to: "/industries", label: "Industries" },
            { to: "/partners", label: "Partnership" },
            { to: "/about", label: "About" },
            { to: "/portfolio", label: "Portfolio" },
            { to: "/contact", label: "Contact" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="px-4 py-3 text-sm font-medium hover:text-primary"
              activeProps={{ className: "text-primary border-b-2 border-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <form onSubmit={submitSearch} className="p-4">
            <div className="flex">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="rounded-r-none" />
              <Button type="submit" className="rounded-l-none"><Search className="size-4" /></Button>
            </div>
          </form>
          <nav className="flex flex-col">
            {[
              { to: "/", label: "Home" },
              { to: "/products", label: "Products" },
              { to: "/industries", label: "Industries" },
              { to: "/partners", label: "Partnership" },
              { to: "/about", label: "About" },
              { to: "/portfolio", label: "Portfolio" },
              { to: "/contact", label: "Contact" },
              { to: isAuthenticated ? accountHref : "/auth/login", label: isAuthenticated ? "My Account" : "Login / Register" },
            ].map((item) => (
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
  );
}
