import { useCallback, useEffect, useState } from "react";
import { brands as seedBrands } from "@/data/brands";
import type { Brand } from "@/data/types";

export interface BusinessCountry {
  id: string;
  name: string;
  code: string; // ISO-2, e.g. DE
}

const BRANDS_KEY = "mh_admin_brands_v1";
const COUNTRIES_KEY = "mh_admin_countries_v1";

export const SEED_COUNTRIES: BusinessCountry[] = [
  { id: "de", name: "Germany", code: "DE" },
  { id: "jp", name: "Japan", code: "JP" },
  { id: "cn", name: "China", code: "CN" },
  { id: "us", name: "USA", code: "US" },
  { id: "it", name: "Italy", code: "IT" },
  { id: "ch", name: "Switzerland", code: "CH" },
  { id: "bd", name: "Bangladesh", code: "BD" },
];

function usePersisted<T>(key: string, seed: T[]) {
  const [items, setItems] = useState<T[]>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw) as T[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, key, ready]);

  return [items, setItems] as const;
}

export function slugifyId(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function useBrandsAdmin() {
  const [brands, setBrands] = usePersisted<Brand>(BRANDS_KEY, seedBrands);

  const save = useCallback((b: Brand) => {
    setBrands((prev) => (prev.some((x) => x.id === b.id) ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b]));
  }, [setBrands]);

  const remove = useCallback((id: string) => {
    setBrands((prev) => prev.filter((x) => x.id !== id));
  }, [setBrands]);

  return { brands, save, remove };
}

export function useCountriesAdmin() {
  const [countries, setCountries] = usePersisted<BusinessCountry>(COUNTRIES_KEY, SEED_COUNTRIES);

  const save = useCallback((c: BusinessCountry) => {
    setCountries((prev) => (prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c]));
  }, [setCountries]);

  const remove = useCallback((id: string) => {
    setCountries((prev) => prev.filter((x) => x.id !== id));
  }, [setCountries]);

  return { countries, save, remove };
}
