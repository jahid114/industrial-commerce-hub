import { createContext, useCallback, useContext, useEffect, useReducer, type ReactNode } from "react";

export type CustomerStatus = "Active" | "Suspended";

export interface RegisteredCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  registeredAt: string; // ISO
  status: CustomerStatus;
  suspendReason?: string;
  notes?: string;
}

const seed: RegisteredCustomer[] = (() => {
  const names = [
    ["Rahim Uddin", "rahim@dhakaeng.com", "Dhaka Engineering Ltd", "Dhaka"],
    ["Nasrin Akter", "nasrin@paktex.bd", "PakTex Mills", "Narayanganj"],
    ["Kabir Hossain", "kabir@ctgsteel.com", "Chittagong Steel Co", "Chittagong"],
    ["Sultana Rahman", "sultana@bengaltex.com", "Bengal Textile", "Gazipur"],
    ["Anwar Chowdhury", "anwar@sylhetmfg.com", "Sylhet Manufacturing", "Sylhet"],
    ["Farida Begum", "farida@rajshahifoods.com", "Rajshahi Foods", "Rajshahi"],
    ["Tarek Aziz", "tarek@khulnaship.com", "Khulna Shipyard", "Khulna"],
    ["Mahmuda Islam", "mahmuda@savarauto.com", "Savar Auto Parts", "Savar"],
    ["Jamil Ahmed", "jamil@bograpumps.com", "Bogra Pumps", "Bogra"],
    ["Rehana Sultana", "rehana@comillachem.com", "Comilla Chemicals", "Comilla"],
    ["Imran Kabir", "imran@mymensinghmfg.com", "Mymensingh Mfg", "Mymensingh"],
    ["Salma Yasmin", "salma@narshingdi-yarns.com", "Narshingdi Yarns", "Narshingdi"],
  ];
  const now = Date.now();
  return names.map(([n, e, c, city], i) => {
    const daysAgo = Math.floor(Math.random() * 90) + i * 2;
    return {
      id: `CUST-${(1001 + i).toString()}`,
      name: n,
      email: e,
      phone: `+8801${(700000000 + Math.floor(Math.random() * 99999999)).toString()}`,
      company: c,
      city,
      address: `${Math.floor(Math.random() * 200) + 1}, Industrial Area, ${city}`,
      registeredAt: new Date(now - daysAgo * 86400000).toISOString(),
      status: i === 4 ? "Suspended" : "Active",
      suspendReason: i === 4 ? "Repeated chargebacks" : undefined,
    } as RegisteredCustomer;
  });
})();

interface State { customers: RegisteredCustomer[] }
type Action =
  | { type: "HYDRATE"; state: State }
  | { type: "ADD"; c: RegisteredCustomer }
  | { type: "UPDATE"; id: string; patch: Partial<RegisteredCustomer> }
  | { type: "REMOVE"; id: string };

const initial: State = { customers: seed };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "HYDRATE": return a.state;
    case "ADD": return { customers: [a.c, ...s.customers] };
    case "UPDATE": return { customers: s.customers.map((c) => c.id === a.id ? { ...c, ...a.patch } : c) };
    case "REMOVE": return { customers: s.customers.filter((c) => c.id !== a.id) };
    default: return s;
  }
}

interface Ctx extends State {
  add: (c: Omit<RegisteredCustomer, "id" | "registeredAt" | "status">) => void;
  update: (id: string, patch: Partial<RegisteredCustomer>) => void;
  remove: (id: string) => void;
  suspend: (id: string, reason: string) => void;
  reinstate: (id: string) => void;
}

const CustomersContext = createContext<Ctx | null>(null);
const KEY = "megahaus-customers-v1";

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) dispatch({ type: "HYDRATE", state: JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const add: Ctx["add"] = useCallback((c) => {
    const id = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    dispatch({ type: "ADD", c: { ...c, id, registeredAt: new Date().toISOString(), status: "Active" } });
  }, []);
  const update: Ctx["update"] = useCallback((id, patch) => dispatch({ type: "UPDATE", id, patch }), []);
  const remove: Ctx["remove"] = useCallback((id) => dispatch({ type: "REMOVE", id }), []);
  const suspend: Ctx["suspend"] = useCallback((id, reason) => dispatch({ type: "UPDATE", id, patch: { status: "Suspended", suspendReason: reason } }), []);
  const reinstate: Ctx["reinstate"] = useCallback((id) => dispatch({ type: "UPDATE", id, patch: { status: "Active", suspendReason: undefined } }), []);

  return <CustomersContext.Provider value={{ ...state, add, update, remove, suspend, reinstate }}>{children}</CustomersContext.Provider>;
}

export function useCustomers() {
  const ctx = useContext(CustomersContext);
  if (!ctx) throw new Error("useCustomers must be used within CustomersProvider");
  return ctx;
}
