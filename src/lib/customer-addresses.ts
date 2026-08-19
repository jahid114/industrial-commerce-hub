import { useCallback, useEffect, useState } from "react";

export interface CustomerAddress {
  id: string;
  label: string;
  line1: string;
  city: string;
  isDefault?: boolean;
}

type AddressBookMap = Record<string, CustomerAddress[]>;

const KEY = "megahaus-customer-addresses-v2";
const LEGACY_KEY = "megahaus-customer-addresses-v1";

const norm = (owner: string) => owner.trim().toLowerCase();

function loadAll(): AddressBookMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as AddressBookMap;
    }
  } catch { /* ignore */ }
  return {};
}

function saveAll(map: AddressBookMap) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

/** One-time migration: the old store kept a single flat list for the signed-in browser. */
function migrateLegacy(owner: string, map: AddressBookMap): AddressBookMap {
  if (typeof window === "undefined") return map;
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return map;
    const legacy = JSON.parse(raw);
    localStorage.removeItem(LEGACY_KEY);
    if (Array.isArray(legacy) && legacy.length && !map[owner]?.length) {
      const next = { ...map, [owner]: legacy as CustomerAddress[] };
      saveAll(next);
      return next;
    }
  } catch { /* ignore */ }
  return map;
}

export function newAddressId() {
  return `ADDR-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function getAddresses(ownerEmail: string): CustomerAddress[] {
  if (!ownerEmail) return [];
  return loadAll()[norm(ownerEmail)] ?? [];
}

export function getDefaultAddress(ownerEmail: string): CustomerAddress | undefined {
  const list = getAddresses(ownerEmail);
  return list.find((a) => a.isDefault) ?? list[0];
}

const EVENT = "megahaus-addresses-changed";

export function useCustomerAddresses(ownerEmail: string | undefined) {
  const owner = ownerEmail ? norm(ownerEmail) : "";
  const [items, setItems] = useState<CustomerAddress[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    if (!owner) { setItems([]); return; }
    setItems(loadAll()[owner] ?? []);
  }, [owner]);

  useEffect(() => {
    if (!owner) { setItems([]); setReady(true); return; }
    const map = migrateLegacy(owner, loadAll());
    setItems(map[owner] ?? []);
    setReady(true);
  }, [owner]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener(EVENT, refresh);
    return () => window.removeEventListener(EVENT, refresh);
  }, [refresh]);

  const commit = useCallback((next: CustomerAddress[]) => {
    if (!owner) return;
    const map = loadAll();
    map[owner] = next;
    saveAll(map);
    setItems(next);
    if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
  }, [owner]);

  const upsert = useCallback((addr: CustomerAddress) => {
    const prev = loadAll()[owner] ?? [];
    const exists = prev.some((a) => a.id === addr.id);
    let next = exists ? prev.map((a) => (a.id === addr.id ? addr : a)) : [...prev, addr];
    if (addr.isDefault || next.length === 1) {
      next = next.map((a) => ({ ...a, isDefault: a.id === addr.id }));
    }
    commit(next);
  }, [owner, commit]);

  const remove = useCallback((id: string) => {
    const prev = loadAll()[owner] ?? [];
    const next = prev.filter((a) => a.id !== id);
    if (next.length && !next.some((a) => a.isDefault)) next[0] = { ...next[0], isDefault: true };
    commit(next);
  }, [owner, commit]);

  const makeDefault = useCallback((id: string) => {
    const prev = loadAll()[owner] ?? [];
    commit(prev.map((a) => ({ ...a, isDefault: a.id === id })));
  }, [owner, commit]);

  return { addresses: items, upsert, remove, makeDefault, ready };
}
