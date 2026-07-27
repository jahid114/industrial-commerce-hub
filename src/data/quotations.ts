import type { Quotation } from "./types";

export const quotations: Quotation[] = [
  {
    id: "RFQ-2026-0188",
    customerName: "Bengal Power Ltd.",
    customerEmail: "tender@bengalpower.bd",
    company: "Bengal Power Ltd.",
    date: "2026-06-11",
    items: [
      { productId: "abb-acs580", productName: "ABB ACS580 Variable Frequency Drive 11kW", quantity: 12, quotedPrice: 138000 },
      { productId: "siemens-s7-1200", productName: "Siemens SIMATIC S7-1200 PLC CPU 1214C", quantity: 4, quotedPrice: 42000 },
    ],
    message: "Urgent requirement for new substation. Please include installation support pricing.",
    status: "Quoted",
    quotedTotal: 12 * 138000 + 4 * 42000,
    paymentTerms: "50% advance, 50% before dispatch",
    deliveryTerms: "CFR Chittagong",
    validUntil: "2026-07-15",
  },
  {
    id: "RFQ-2026-0187",
    customerName: "AutoSys Engineering",
    customerEmail: "design@autosys.bd",
    company: "AutoSys Engineering",
    date: "2026-06-10",
    items: [
      { productId: "siemens-s7-1200", productName: "Siemens SIMATIC S7-1200 PLC CPU 1214C", quantity: 8 },
    ],
    message: "Need with TIA Portal license bundle. Delivery to Dhaka within 3 weeks.",
    status: "New",
  },
  {
    id: "RFQ-2026-0186",
    customerName: "Rangs Construction",
    customerEmail: "imports@rangsconst.bd",
    date: "2026-06-09",
    items: [
      { productId: "cat-skid-steer", productName: "Caterpillar 246D3 Skid Steer Loader", quantity: 2, quotedPrice: 5650000 },
    ],
    message: "Please quote CFR Chittagong with full attachment package.",
    status: "Quoted",
    quotedTotal: 2 * 5650000,
    deliveryTerms: "CFR Chittagong",
  },
  {
    id: "RFQ-2026-0185",
    customerName: "Sumaiya Textile Mills",
    customerEmail: "ops@sumaiyatextile.bd",
    date: "2026-06-07",
    items: [
      { productId: "festo-dnc-32", productName: "Festo DNC-32-100-PPV-A Pneumatic Cylinder", quantity: 50, quotedPrice: 17500 },
    ],
    message: "Bulk order for new production line. Need spare seals included.",
    status: "Accepted",
    quotedTotal: 50 * 17500,
  },
  {
    id: "RFQ-2026-0184",
    customerName: "Khan Brothers Construction",
    customerEmail: "info@khanbrothers.com.bd",
    date: "2026-06-05",
    items: [
      { productId: "hilti-te-60", productName: "Hilti TE 60-A36 Cordless Combi Hammer", quantity: 5, quotedPrice: 159000 },
    ],
    message: "Please confirm warranty terms and local service availability.",
    status: "Rejected",
    quotedTotal: 5 * 159000,
  },
  {
    id: "RFQ-2026-0183",
    customerName: "Mahmud Hardware",
    customerEmail: "mahmud.hardware@gmail.com",
    date: "2026-06-03",
    items: [
      { productId: "bosch-gbh-2-26", productName: "Bosch GBH 2-26 Rotary Hammer Drill", quantity: 20 },
      { productId: "hilti-te-60", productName: "Hilti TE 60-A36 Cordless Combi Hammer", quantity: 3 },
    ],
    message: "Reseller order. Need best wholesale pricing with extra bit set.",
    status: "Under Review",
  },
  {
    id: "RFQ-2026-0182",
    customerName: "Chittagong Marine Works",
    customerEmail: "purchase@ctgmarine.com.bd",
    date: "2026-06-01",
    items: [
      { productId: "karcher-hd-6-15", productName: "Kärcher HD 6/15 C Pressure Washer", quantity: 6, quotedPrice: 75000 },
    ],
    message: "Required for ship cleaning operations. Need spare nozzle kit.",
    status: "Quoted",
    quotedTotal: 6 * 75000,
  },
  {
    id: "RFQ-2026-0181",
    customerName: "Smart Factory Solutions",
    customerEmail: "ali@smartfactory.bd",
    company: "Smart Factory Solutions",
    date: "2026-05-28",
    items: [
      { productId: "abb-robot", productName: "ABB IRB 1200 Industrial Robot", quantity: 1, quotedPrice: 2850000 },
    ],
    message: "Need full integration quote including end effector and safety cage.",
    status: "Negotiating",
    quotedTotal: 2850000,
  },
];

export const getQuotation = (id: string) => quotations.find((q) => q.id === id);
