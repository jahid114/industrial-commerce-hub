import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "export";

export interface Module {
  key: string;
  label: string;
  description: string;
  actions: PermissionAction[];
}

export const MODULES: ReadonlyArray<Module> = [
  { key: "dashboard",  label: "Dashboard",           description: "Overview KPIs and activity",       actions: ["view"] },
  { key: "products",   label: "Products",            description: "Catalog & product records",         actions: ["view", "create", "edit", "delete", "export"] },
  { key: "inventory",  label: "Inventory",           description: "Stock levels & warehouse",          actions: ["view", "edit", "export"] },
  { key: "suppliers",  label: "Suppliers",           description: "Vendor directory & profiles",       actions: ["view", "create", "edit", "delete"] },
  { key: "orders",     label: "Orders",              description: "Order processing & fulfillment",    actions: ["view", "create", "edit", "delete", "export"] },
  { key: "agents",     label: "Agents",              description: "Field agent directory",             actions: ["view", "create", "edit", "delete"] },
  { key: "quotations", label: "Quotations",          description: "RFQs and quote replies",            actions: ["view", "create", "edit", "delete"] },
  { key: "reports",    label: "Reports & Analytics", description: "Business reports and exports",      actions: ["view", "export"] },
  { key: "settings",   label: "System Settings",     description: "Taxonomy, preferences, config",     actions: ["view", "edit"] },
  { key: "roles",      label: "Roles & Permissions", description: "Manage admin roles and access",     actions: ["view", "create", "edit", "delete"] },
  { key: "users",      label: "Admin Users",         description: "Manage admin team members",         actions: ["view", "create", "edit", "delete"] },
];

export const ACTION_LABEL: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  export: "Export",
};

/** Permission key format: "<module>:<action>" */
export type PermissionKey = string;
export const permKey = (m: string, a: PermissionAction): PermissionKey => `${m}:${a}`;

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;         // system roles cannot be deleted / renamed
  permissions: PermissionKey[];
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: "Active" | "Invited" | "Suspended";
  lastActive?: string;
}

function allPerms(): PermissionKey[] {
  return MODULES.flatMap((m) => m.actions.map((a) => permKey(m.key, a)));
}

function viewOnly(): PermissionKey[] {
  return MODULES.filter((m) => m.actions.includes("view")).map((m) => permKey(m.key, "view"));
}

const now = () => new Date().toISOString();

const seedRoles: Role[] = [
  {
    id: "role-super-admin",
    name: "Super Admin",
    description: "Full unrestricted access to every module and action.",
    isSystem: true,
    permissions: allPerms(),
    createdAt: now(),
  },
  {
    id: "role-admin",
    name: "Administrator",
    description: "Full operational access; cannot manage other admin roles.",
    isSystem: true,
    permissions: allPerms().filter((p) => !p.startsWith("roles:") && !p.startsWith("users:create") && !p.startsWith("users:delete")),
    createdAt: now(),
  },
  {
    id: "role-manager",
    name: "Operations Manager",
    description: "Manage products, orders, inventory, suppliers and agents.",
    isSystem: true,
    permissions: [
      ...["products","inventory","suppliers","orders","agents","quotations"].flatMap((m) =>
        MODULES.find((x) => x.key === m)!.actions.filter((a) => a !== "delete").map((a) => permKey(m, a))
      ),
      permKey("dashboard","view"),
      permKey("reports","view"),
      permKey("reports","export"),
    ],
    createdAt: now(),
  },
  {
    id: "role-operator",
    name: "Order Operator",
    description: "Process orders and update inventory; read-only elsewhere.",
    isSystem: true,
    permissions: [
      permKey("dashboard","view"),
      permKey("orders","view"), permKey("orders","edit"), permKey("orders","export"),
      permKey("inventory","view"), permKey("inventory","edit"),
      permKey("products","view"),
      permKey("suppliers","view"),
      permKey("quotations","view"), permKey("quotations","edit"),
    ],
    createdAt: now(),
  },
  {
    id: "role-viewer",
    name: "Viewer",
    description: "Read-only access to all modules for auditing.",
    isSystem: true,
    permissions: viewOnly(),
    createdAt: now(),
  },
];

const seedUsers: AdminUser[] = [
  { id: "u-1", name: "Rafiq Rahman",   email: "rafiq@megahaus.bd",   roleId: "role-super-admin", status: "Active",  lastActive: now() },
  { id: "u-2", name: "Nusrat Jahan",   email: "nusrat@megahaus.bd",  roleId: "role-admin",       status: "Active",  lastActive: now() },
  { id: "u-3", name: "Tanvir Ahmed",   email: "tanvir@megahaus.bd",  roleId: "role-manager",     status: "Active" },
  { id: "u-4", name: "Sabina Yasmin",  email: "sabina@megahaus.bd",  roleId: "role-operator",    status: "Active" },
  { id: "u-5", name: "Auditor",        email: "audit@megahaus.bd",   roleId: "role-viewer",      status: "Invited" },
];

interface State { roles: Role[]; users: AdminUser[] }

interface Ctx extends State {
  addRole: (r: Omit<Role, "id" | "isSystem" | "createdAt">) => Role;
  updateRole: (id: string, patch: Partial<Omit<Role, "id" | "isSystem" | "createdAt">>) => void;
  deleteRole: (id: string) => void;
  togglePermission: (roleId: string, perm: PermissionKey) => void;
  setModulePermissions: (roleId: string, moduleKey: string, enabled: boolean) => void;
  duplicateRole: (id: string) => void;
  addUser: (u: Omit<AdminUser, "id">) => void;
  updateUser: (id: string, patch: Partial<AdminUser>) => void;
  deleteUser: (id: string) => void;
}

const KEY = "megahaus-rbac-v1";
const RbacContext = createContext<Ctx | null>(null);

function uid(p: string) { return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

export function RbacProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ roles: seedRoles, users: seedUsers });

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
    addRole: (r) => {
      const role: Role = { ...r, id: uid("role"), isSystem: false, createdAt: now() };
      setState((p) => ({ ...p, roles: [...p.roles, role] }));
      return role;
    },
    updateRole: (id, patch) => setState((p) => ({
      ...p,
      roles: p.roles.map((r) => {
        if (r.id !== id) return r;
        // system roles: only permissions & description editable
        if (r.isSystem) return { ...r, description: patch.description ?? r.description, permissions: patch.permissions ?? r.permissions };
        return { ...r, ...patch };
      }),
    })),
    deleteRole: (id) => setState((p) => {
      const role = p.roles.find((r) => r.id === id);
      if (!role || role.isSystem) return p;
      const fallback = p.roles.find((r) => r.id === "role-viewer")?.id ?? p.roles[0]?.id;
      return {
        roles: p.roles.filter((r) => r.id !== id),
        users: p.users.map((u) => (u.roleId === id ? { ...u, roleId: fallback } : u)),
      };
    }),
    togglePermission: (roleId, perm) => setState((p) => ({
      ...p,
      roles: p.roles.map((r) => {
        if (r.id !== roleId) return r;
        const has = r.permissions.includes(perm);
        return { ...r, permissions: has ? r.permissions.filter((x) => x !== perm) : [...r.permissions, perm] };
      }),
    })),
    setModulePermissions: (roleId, moduleKey, enabled) => setState((p) => ({
      ...p,
      roles: p.roles.map((r) => {
        if (r.id !== roleId) return r;
        const mod = MODULES.find((m) => m.key === moduleKey);
        if (!mod) return r;
        const keys = mod.actions.map((a) => permKey(moduleKey, a));
        const without = r.permissions.filter((k) => !k.startsWith(`${moduleKey}:`));
        return { ...r, permissions: enabled ? [...without, ...keys] : without };
      }),
    })),
    duplicateRole: (id) => setState((p) => {
      const src = p.roles.find((r) => r.id === id);
      if (!src) return p;
      const copy: Role = { ...src, id: uid("role"), name: `${src.name} (Copy)`, isSystem: false, createdAt: now() };
      return { ...p, roles: [...p.roles, copy] };
    }),
    addUser: (u) => setState((p) => ({ ...p, users: [{ ...u, id: uid("u") }, ...p.users] })),
    updateUser: (id, patch) => setState((p) => ({ ...p, users: p.users.map((u) => u.id === id ? { ...u, ...patch } : u) })),
    deleteUser: (id) => setState((p) => ({ ...p, users: p.users.filter((u) => u.id !== id) })),
  };

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export function useRbac() {
  const ctx = useContext(RbacContext);
  if (!ctx) throw new Error("useRbac must be used within <RbacProvider>");
  return ctx;
}
