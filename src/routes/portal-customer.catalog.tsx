import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/product/ProductCard";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
import { getAllProducts } from "@/lib/products";
import type { Country } from "@/data/types";
import { Filter, X, Lock } from "lucide-react";

export const Route = createFileRoute("/portal-customer/catalog")({
  head: () => ({ meta: [{ title: "Browse Catalog — Customer Portal" }] }),
  component: PortalCatalog,
});

const countries: Country[] = ["Germany", "Japan", "China", "USA", "Italy", "Switzerland"];
const MAX_PRICE = 6_000_000;

function PortalCatalog() {
  const allProducts = getAllProducts();
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = allProducts.filter((p) => {
      if (query && !`${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (selectedCategories.length && !selectedCategories.includes(p.categoryId)) return false;
      if (selectedBrands.length && !selectedBrands.includes(p.brandId)) return false;
      if (selectedCountries.length && !selectedCountries.includes(p.country)) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [allProducts, query, selectedCategories, selectedBrands, selectedCountries, priceRange, sort]);

  const toggle = <T,>(arr: T[], v: T, set: (v: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const activeFilterCount = selectedCategories.length + selectedBrands.length + selectedCountries.length + (priceRange[0] !== 0 || priceRange[1] !== MAX_PRICE ? 1 : 0);
  const clearAll = () => { setSelectedCategories([]); setSelectedBrands([]); setSelectedCountries([]); setPriceRange([0, MAX_PRICE]); setQuery(""); };
  const privateCount = allProducts.filter((p) => !p.featured).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Full Product Catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} products · <Lock className="inline size-3" /> Includes {privateCount} portal-only items not shown publicly.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="sticky top-20 space-y-6 rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display text-lg font-bold flex items-center gap-2"><Filter className="size-4" /> Filters</h2>
              {activeFilterCount > 0 && <button onClick={clearAll} className="text-xs font-medium text-primary hover:underline">Clear all</button>}
            </div>
            <Input placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <FilterGroup title="Category">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selectedCategories.includes(c.id)} onCheckedChange={() => toggle(selectedCategories, c.id, setSelectedCategories)} />
                  {c.name}
                </label>
              ))}
            </FilterGroup>
            <FilterGroup title="Brand">
              {brands.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selectedBrands.includes(b.id)} onCheckedChange={() => toggle(selectedBrands, b.id, setSelectedBrands)} />
                  {b.name}
                </label>
              ))}
            </FilterGroup>
            <FilterGroup title="Country">
              {countries.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selectedCountries.includes(c)} onCheckedChange={() => toggle(selectedCountries, c, setSelectedCountries)} />
                  {c}
                </label>
              ))}
            </FilterGroup>
            <FilterGroup title="Price (BDT)">
              <Slider min={0} max={MAX_PRICE} step={5000} value={priceRange} onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>৳{priceRange[0].toLocaleString()}</span>
                <span>৳{priceRange[1].toLocaleString()}</span>
              </div>
            </FilterGroup>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters((v) => !v)}>
                <Filter className="size-4 mr-2" /> Filters {activeFilterCount > 0 && <Badge className="ml-1 h-4 px-1">{activeFilterCount}</Badge>}
              </Button>
              {activeFilterCount > 0 && (
                <div className="hidden md:flex flex-wrap gap-1.5">
                  {selectedCategories.map((id) => (
                    <Badge key={id} variant="outline" className="gap-1">{categories.find((c) => c.id === id)?.name}<button onClick={() => toggle(selectedCategories, id, setSelectedCategories)}><X className="size-3" /></button></Badge>
                  ))}
                  {selectedBrands.map((id) => (
                    <Badge key={id} variant="outline" className="gap-1">{brands.find((b) => b.id === id)?.name}<button onClick={() => toggle(selectedBrands, id, setSelectedBrands)}><X className="size-3" /></button></Badge>
                  ))}
                </div>
              )}
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-16 text-center">
              <p className="font-display text-xl font-semibold">No products match your filters</p>
              <Button onClick={clearAll} className="mt-4">Clear filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="relative">
                  {!p.featured && (
                    <span className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-industrial px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-industrial-foreground">
                      <Lock className="size-2.5" /> Portal
                    </span>
                  )}
                  <Link to="/portal-customer/catalog/$productId" params={{ productId: p.id }} className="block h-full">
                    <ProductCard product={p} index={i} />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}
