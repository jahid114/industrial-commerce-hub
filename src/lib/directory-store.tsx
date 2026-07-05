import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Agent, Supplier } from "@/data/types";
import { suppliers as seedSuppliers } from "@/data/suppliers";
import { agents as seedAgents } from "@/data/agents";

interface State {
  suppliers: Supplier[];
  agents: Agent[];
}

interface Ctx extends State {
  addSupplier: (s: Omit<Supplier, "id">) => void;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addAgent: (a: Omit<Agent, "id">) => void;
  updateAgent: (id: string, patch: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
}

const DirectoryContext = createContext<Ctx | null>(null);
const KEY = "megahaus-directory-v1";

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ suppliers: seedSuppliers, agents: seedAgents });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const value: Ctx = {
    ...state,
    addSupplier: (s) => setState((p) => ({ ...p, suppliers: [{ ...s, id: uid("sup") }, ...p.suppliers] })),
    updateSupplier: (id, patch) => setState((p) => ({ ...p, suppliers: p.suppliers.map((x) => x.id === id ? { ...x, ...patch } : x) })),
    deleteSupplier: (id) => setState((p) => ({ ...p, suppliers: p.suppliers.filter((x) => x.id !== id) })),
    addAgent: (a) => setState((p) => ({ ...p, agents: [{ ...a, id: uid("ag") }, ...p.agents] })),
    updateAgent: (id, patch) => setState((p) => ({ ...p, agents: p.agents.map((x) => x.id === id ? { ...x, ...patch } : x) })),
    deleteAgent: (id) => setState((p) => ({ ...p, agents: p.agents.filter((x) => x.id !== id) })),
  };

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>;
}

export function useDirectory() {
  const ctx = useContext(DirectoryContext);
  if (!ctx) throw new Error("useDirectory must be used within <DirectoryProvider>");
  return ctx;
}
