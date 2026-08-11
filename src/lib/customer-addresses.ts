import { useCallback, useEffect, useState } from "react";

export interface CustomerAddress {
  id: string;
  label: string;
  contactName: string;
  phone: string;
  line1: string;
  city: string;
  postcode?: string;
  isDefault?: boolean;
}

const KEY = "megahaus-customer-addresses-v1";

function load(): CustomerAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as CustomerAddress[];
  } catch { /* ignore */ }
  return [];
}

export function newAddressId() {
  return `ADDR-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function useCustomerAddresses() {
  const [items, setItems] = useState<CustomerAddress[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items, ready]);

  const upsert = useCallback((addr: CustomerAddress) => {
    setItems((prev) => {
      const exists = prev.some((a) => a.id === addr.id);
      let next = exists ? prev.map((a) => (a.id === addr.id ? addr : a)) : [...prev, addr];
      if (addr.isDefault || next.length === 1) {
        next = next.map((a) => ({ ...a, isDefault: a.id === addr.id }));
      }
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (next.length && !next.some((a) => a.isDefault)) next[0].isDefault = true;
      return next;
    });
  }, []);

  const makeDefault = useCallback((id: string) => {
    setItems((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  }, []);

  return { addresses: items, upsert, remove, makeDefault, ready };
}
