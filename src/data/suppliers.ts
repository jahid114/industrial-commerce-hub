import type { Supplier } from "./types";

export const suppliers: Supplier[] = [
  { id: "bosch-de", name: "Bosch Industrial GmbH", country: "Germany", contactName: "Andreas Weber", email: "andreas.weber@bosch-industrial.de", productsCount: 4, rating: 4.9, since: "2018-03-14" },
  { id: "makita-jp", name: "Makita Corporation", country: "Japan", contactName: "Hiroshi Tanaka", email: "h.tanaka@makita.co.jp", productsCount: 2, rating: 4.8, since: "2019-06-22" },
  { id: "siemens-de", name: "Siemens AG Automation", country: "Germany", contactName: "Klaus Müller", email: "k.mueller@siemens.com", productsCount: 2, rating: 4.9, since: "2017-11-08" },
  { id: "festo-de", name: "Festo SE & Co. KG", country: "Germany", contactName: "Sabine Schmidt", email: "s.schmidt@festo.de", productsCount: 2, rating: 4.7, since: "2020-01-15" },
  { id: "abb-ch", name: "ABB Switzerland Ltd.", country: "Switzerland", contactName: "Pierre Dubois", email: "pierre.dubois@abb.com", productsCount: 2, rating: 4.8, since: "2018-09-30" },
  { id: "hilti-de", name: "Hilti Deutschland AG", country: "Germany", contactName: "Markus Vogel", email: "m.vogel@hilti.com", productsCount: 2, rating: 4.9, since: "2019-04-11" },
  { id: "cat-us", name: "Caterpillar Inc.", country: "USA", contactName: "Robert Johnson", email: "r.johnson@cat.com", productsCount: 2, rating: 4.9, since: "2017-07-19" },
  { id: "karcher-de", name: "Alfred Kärcher SE", country: "Germany", contactName: "Heinrich Bauer", email: "h.bauer@karcher.com", productsCount: 2, rating: 4.6, since: "2020-08-25" },
];

export const getSupplier = (id: string) => suppliers.find((s) => s.id === id);
