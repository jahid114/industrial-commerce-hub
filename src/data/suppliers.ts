import type { Supplier } from "./types";

export const suppliers: Supplier[] = [
  { id: "bosch-de", name: "Bosch Industrial GmbH", country: "Germany", contactName: "Andreas Weber", email: "andreas.weber@bosch-industrial.de", phone: "+49 711 400 40990", productsCount: 4, since: "2018-03-14", status: "Active" },
  { id: "makita-jp", name: "Makita Corporation", country: "Japan", contactName: "Hiroshi Tanaka", email: "h.tanaka@makita.co.jp", phone: "+81 566 98 1711", productsCount: 2, since: "2019-06-22", status: "Active" },
  { id: "siemens-de", name: "Siemens AG Automation", country: "Germany", contactName: "Klaus Müller", email: "k.mueller@siemens.com", phone: "+49 89 7805 0", productsCount: 2, since: "2017-11-08", status: "Active" },
  { id: "festo-de", name: "Festo SE & Co. KG", country: "Germany", contactName: "Sabine Schmidt", email: "s.schmidt@festo.de", phone: "+49 711 347 0", productsCount: 2, since: "2020-01-15", status: "Active" },
  { id: "abb-ch", name: "ABB Switzerland Ltd.", country: "Switzerland", contactName: "Pierre Dubois", email: "pierre.dubois@abb.com", phone: "+41 58 586 00 00", productsCount: 2, since: "2018-09-30", status: "Active" },
  { id: "hilti-de", name: "Hilti Deutschland AG", country: "Germany", contactName: "Markus Vogel", email: "m.vogel@hilti.com", phone: "+49 8121 6000", productsCount: 2, since: "2019-04-11", status: "Active" },
  { id: "cat-us", name: "Caterpillar Inc.", country: "USA", contactName: "Robert Johnson", email: "r.johnson@cat.com", phone: "+1 309 675 1000", productsCount: 2, since: "2017-07-19", status: "Active" },
  { id: "karcher-de", name: "Alfred Kärcher SE", country: "Germany", contactName: "Heinrich Bauer", email: "h.bauer@karcher.com", phone: "+49 7195 14 0", productsCount: 2, since: "2020-08-25", status: "Active" },
];

export const getSupplier = (id: string) => suppliers.find((s) => s.id === id);
