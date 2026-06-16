import type { Brand } from "./types";

export const brands: Brand[] = [
  { id: "bosch", name: "Bosch", country: "Germany", logoText: "BOSCH" },
  { id: "makita", name: "Makita", country: "Japan", logoText: "makita" },
  { id: "siemens", name: "Siemens", country: "Germany", logoText: "SIEMENS" },
  { id: "festo", name: "Festo", country: "Germany", logoText: "FESTO" },
  { id: "abb", name: "ABB", country: "Switzerland", logoText: "ABB" },
  { id: "hilti", name: "Hilti", country: "Germany", logoText: "HILTI" },
  { id: "caterpillar", name: "Caterpillar", country: "USA", logoText: "CAT" },
  { id: "karcher", name: "Kärcher", country: "Germany", logoText: "KÄRCHER" },
];

export const getBrand = (id: string) => brands.find((b) => b.id === id);
