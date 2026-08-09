import { Filter, X, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { categories } from "@/data/categories";
import { brands } from "@/data/brands";
import type { Country } from "@/data/types";

const countries: Country[] = ["Germany", "Japan", "China", "USA", "Italy", "Switzerland"];
const MAX_PRICE = 6_000_000;

interface ProductFiltersProps {
  selectedCategories: string[];
  setSelectedCategories: (v: string[]) => void;
  selectedBrands: string[];
  setSelectedBrands: (v: string[]) => void;
  selectedCountries: Country[];
  setSelectedCountries: (v: Country[]) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  clearAll: () => void;
}

export function ProductFilters({
  selectedCategories,
  setSelectedCategories,
  selectedBrands,
  setSelectedBrands,
  selectedCountries,
  setSelectedCountries,
  priceRange,
  setPriceRange,
  clearAll,
}: ProductFiltersProps) {
  const toggle = <T,>(arr: T[], v: T, set: (v: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const activeFilterCount =
    selectedCategories.length +
    selectedBrands.length +
    selectedCountries.length +
    (priceRange[0] !== 0 || priceRange[1] !== MAX_PRICE ? 1 : 0);

  return (
    <div className="sticky top-20 space-y-6 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Filter className="size-4" /> Filters
        </h2>
        {activeFilterCount > 0 && (
          <button onClick={clearAll} className="text-xs font-medium text-primary hover:underline">
            Clear all
          </button>
        )}
      </div>

      <FilterGroup title="Price (BDT)">
        <Slider
          min={0}
          max={MAX_PRICE}
          step={5000}
          value={priceRange}
          onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>৳{priceRange[0].toLocaleString()}</span>
          <span>৳{priceRange[1].toLocaleString()}</span>
        </div>
      </FilterGroup>

      <FilterGroup title="Category">
        {categories.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selectedCategories.includes(c.id)}
              onCheckedChange={() => toggle(selectedCategories, c.id, setSelectedCategories)}
            />
            {c.name}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Brand">
        {brands.map((b) => (
          <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selectedBrands.includes(b.id)}
              onCheckedChange={() => toggle(selectedBrands, b.id, setSelectedBrands)}
            />
            {b.name}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Country">
        {countries.map((c) => (
          <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selectedCountries.includes(c)}
              onCheckedChange={() => toggle(selectedCountries, c, setSelectedCountries)}
            />
            {c}
          </label>
        ))}
      </FilterGroup>
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
