import { useEffect, useState } from "react";

export interface AgentCustomer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email?: string;
  interest: string;
  address: string;
  est: number;
  notes?: string;
}

const KEY = "megahaus-agent-customers-v2";

const seed: AgentCustomer[] = [
  { id: "C-1042", name: "Rahim Textile Mills", contact: "Md. Tarek", phone: "+8801711-902341", email: "tarek@rahimtex.bd", interest: "Bosch GBH 2-26 × 30", address: "Plot 14, BSCIC I/A, Tongi, Gazipur", est: 855000 },
  { id: "C-1041", name: "Padma Spinning Ltd.", contact: "Sumon Hasan", phone: "+8801812-554021", email: "sumon@padma.bd", interest: "Siemens S7-1200 × 8", address: "Padma Mill Road, Ishwardi EPZ, Pabna", est: 624000 },
  { id: "C-1040", name: "Bengal Auto Parts", contact: "Arif Mahmud", phone: "+8801913-330218", interest: "Makita GA9020 × 20", address: "Dholaikhal, Old Dhaka", est: 316000 },
  { id: "C-1039", name: "Apex Garments", contact: "Nasrin Akter", phone: "+8801714-887701", email: "nasrin@apex.bd", interest: "ABB ACS580 × 4", address: "Sector 4, Uttara EPZ, Dhaka", est: 1240000 },
  { id: "C-1038", name: "Meghna Steel", contact: "Iqbal Hossain", phone: "+8801715-621199", interest: "Festo pneumatic kit", address: "Meghna Ghat, Sonargaon, Narayanganj", est: 482000 },
];

export function loadAgentCustomers(): AgentCustomer[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AgentCustomer[];
  } catch { /* ignore */ }
  return seed;
}

export function saveAgentCustomers(list: AgentCustomer[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function useAgentCustomers() {
  const [items, setItems] = useState<AgentCustomer[]>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(loadAgentCustomers());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(loadAgentCustomers());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (ready) saveAgentCustomers(items);
  }, [items, ready]);

  return [items, setItems] as const;
}

export function newCustomerId() {
  return `C-${Math.floor(1000 + Math.random() * 9000)}`;
}
