import { createContext, useContext, useEffect, useReducer, useCallback, type ReactNode } from "react";
import type { Order, Quotation, Role } from "@/data/types";
import { orders as seedOrders } from "@/data/orders";
import { quotations as seedQuotations } from "@/data/quotations";

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface User {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  role: Role;
}

interface State {
  cart: CartItem[];
  wishlist: string[];
  compare: string[];
  user: User | null;
  orders: Order[];
  quotations: Quotation[];
}

type Action =
  | { type: "ADD_TO_CART"; productId: string; quantity?: number }
  | { type: "REMOVE_FROM_CART"; productId: string }
  | { type: "UPDATE_QTY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_WISHLIST"; productId: string }
  | { type: "TOGGLE_COMPARE"; productId: string }
  | { type: "LOGIN"; user: User }
  | { type: "LOGOUT" }
  | { type: "UPDATE_PROFILE"; user: Partial<User> }
  | { type: "ADD_ORDER"; order: Order }
  | { type: "UPDATE_ORDER"; id: string; patch: Partial<Order> }
  | { type: "REMOVE_ORDER"; id: string }
  | { type: "ADD_QUOTATION"; quotation: Quotation }
  | { type: "UPDATE_QUOTATION"; id: string; patch: Partial<Quotation> }
  | { type: "HYDRATE"; state: State };

const initialState: State = {
  cart: [],
  wishlist: [],
  compare: [],
  user: null,
  orders: seedOrders,
  quotations: seedQuotations,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "ADD_TO_CART": {
      const qty = action.quantity ?? 1;
      const existing = state.cart.find((i) => i.productId === action.productId);
      if (existing) {
        return { ...state, cart: state.cart.map((i) => (i.productId === action.productId ? { ...i, quantity: i.quantity + qty } : i)) };
      }
      return { ...state, cart: [...state.cart, { productId: action.productId, quantity: qty }] };
    }
    case "REMOVE_FROM_CART":
      return { ...state, cart: state.cart.filter((i) => i.productId !== action.productId) };
    case "UPDATE_QTY":
      return { ...state, cart: state.cart.map((i) => (i.productId === action.productId ? { ...i, quantity: Math.max(1, action.quantity) } : i)) };
    case "CLEAR_CART":
      return { ...state, cart: [] };
    case "TOGGLE_WISHLIST":
      return { ...state, wishlist: state.wishlist.includes(action.productId) ? state.wishlist.filter((id) => id !== action.productId) : [...state.wishlist, action.productId] };
    case "TOGGLE_COMPARE": {
      if (state.compare.includes(action.productId)) {
        return { ...state, compare: state.compare.filter((id) => id !== action.productId) };
      }
      if (state.compare.length >= 4) return state;
      return { ...state, compare: [...state.compare, action.productId] };
    }
    case "LOGIN":
      return { ...state, user: action.user };
    case "LOGOUT":
      return { ...state, user: null };
    case "UPDATE_PROFILE":
      return { ...state, user: state.user ? { ...state.user, ...action.user } : state.user };
    case "ADD_ORDER":
      return { ...state, orders: [action.order, ...state.orders] };
    case "UPDATE_ORDER":
      return { ...state, orders: state.orders.map((o) => (o.id === action.id ? { ...o, ...action.patch } : o)) };
    case "ADD_QUOTATION":
      return { ...state, quotations: [action.quotation, ...state.quotations] };
    case "UPDATE_QUOTATION":
      return { ...state, quotations: state.quotations.map((q) => (q.id === action.id ? { ...q, ...action.patch } : q)) };
    default:
      return state;
  }
}

interface StoreContextValue extends State {
  dispatch: React.Dispatch<Action>;
  cartCount: number;
  cartSubtotal: (priceFn: (id: string) => number) => number;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isPartner: boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const STORAGE_KEY = "megahaus-store-v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        dispatch({ type: "HYDRATE", state: { ...initialState, ...parsed } });
      }
    } catch {
      /* ignore */
    }
  }, []);

  // persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const cartCount = state.cart.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = useCallback(
    (priceFn: (id: string) => number) => state.cart.reduce((s, i) => s + priceFn(i.productId) * i.quantity, 0),
    [state.cart],
  );

  const value: StoreContextValue = {
    ...state,
    dispatch,
    cartCount,
    cartSubtotal,
    isAuthenticated: !!state.user,
    isAdmin: state.user?.role === "admin",
    isAgent: state.user?.role === "agent",
    isPartner: state.user?.role === "partner",
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
