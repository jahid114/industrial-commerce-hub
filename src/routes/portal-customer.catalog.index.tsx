import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
import { getAllProducts } from "@/lib/products";
import { Filter, X, Lock } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";

type CatalogSearch = { q?: string; category?: string; sub?: string };

export const Route = createFileRoute("/portal-customer/catalog/")({
  validateSearch: (s: Record<string, unknown>): CatalogSearch => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    sub: typeof s.sub === "string" ? s.sub : undefined,
  }),
  head: () => ({ meta: [{ title: "Products — MegaHaus Customer Portal" }] }),
  component: PortalCatalog,
});

import type { Country } from "@/data/types";

const MAX_PRICE = 6_000_000;

function PortalCatalog() {
  const search = Route.useSearch();
  const allProducts = getAllProducts();
  const [query, setQuery] = useState(search.q ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(search.category ? [search.category] : []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setQuery(search.q ?? "");
    setSelectedCategories(search.category ? [search.category] : []);
  }, [search.q, search.category, search.sub]);


  const filtered = useMemo(() => {
    let list = allProducts.filter((p) => {
      if (query && !`${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (selectedCategories.length && !selectedCategories.includes(p.categoryId)) return false;
      if (selectedBrands.length && !selectedBrands.includes(p.brandId)) return false;
      if (selectedCountries.length && !selectedCountries.includes(p.country)) return false;
      if (getEffectivePrice(p) < priceRange[0] || getEffectivePrice(p) > priceRange[1]) return false;
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    if (sort === "price-desc") list = [...list].sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
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
          <ProductFilters
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedBrands={selectedBrands}
            setSelectedBrands={setSelectedBrands}
            selectedCountries={selectedCountries}
            setSelectedCountries={setSelectedCountries}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            clearAll={clearAll}
          />
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
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} portal />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

