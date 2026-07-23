import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shield, Plus, Pencil, Trash2, Copy, Users, KeyRound, Lock, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  MODULES, ACTION_LABEL, permKey, useRbac,
  type Role, type AdminUser, type PermissionAction,
} from "@/lib/rbac-store";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({
    meta: [
      { title: "Roles & Permissions — MegaHaus Admin" },
      { name: "description", content: "Configure role-based access control for the admin team." },
    ],
  }),
  component: RolesPage,
});

function RolesPage() {
  const rbac = useRbac();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(rbac.roles[0]?.id ?? "");
  const selected = rbac.roles.find((r) => r.id === selectedRoleId) ?? rbac.roles[0];

  const usersByRole = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of rbac.users) m.set(u.roleId, (m.get(u.roleId) ?? 0) + 1);
    return m;
  }, [rbac.users]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <Shield className="size-7 text-primary" /> Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define what each admin role can see and do. Assign users to roles for least-privilege access.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard icon={Shield} label="Total roles" value={rbac.roles.length} hint={`${rbac.roles.filter((r) => r.isSystem).length} system · ${rbac.roles.filter((r) => !r.isSystem).length} custom`} />
        <StatCard icon={Users} label="Admin users" value={rbac.users.length} hint={`${rbac.users.filter((u) => u.status === "Active").length} active`} />
        <StatCard icon={KeyRound} label="Permissions" value={MODULES.reduce((s, m) => s + m.actions.length, 0)} hint={`${MODULES.length} modules`} />
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="roles">Roles ({rbac.roles.length})</TabsTrigger>
          <TabsTrigger value="users">Admin Users ({rbac.users.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Roles</CardTitle>
                <CardDescription>Select a role to edit its access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 max-h-[560px] overflow-y-auto">
                {rbac.roles.map((r) => {
                  const active = r.id === selected?.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoleId(r.id)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${active ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm truncate">{r.name}</div>
                        {r.isSystem && <Lock className="size-3.5 text-muted-foreground shrink-0" aria-label="System role" />}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{r.permissions.length} perms</span>
                        <span>·</span>
                        <span>{usersByRole.get(r.id) ?? 0} users</span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {selected && <PermissionMatrix role={selected} />}
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Shield; label: string; value: number; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="size-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
          {hint && <div className="text-[11px] text-muted-foreground/80">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------- Permission Matrix -------------------- */

function PermissionMatrix({ role }: { role: Role }) {
  const rbac = useRbac();
  const actions: PermissionAction[] = ["view", "create", "edit", "delete", "export"];

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {role.name}
              {role.isSystem ? (
                <Badge variant="secondary" className="gap-1"><Lock className="size-3" /> System</Badge>
              ) : (
                <Badge variant="outline">Custom</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{role.description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{role.permissions.length}</div>
            <div className="text-xs text-muted-foreground">permissions granted</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Module</TableHead>
                {actions.map((a) => (
                  <TableHead key={a} className="text-center capitalize">{ACTION_LABEL[a]}</TableHead>
                ))}
                <TableHead className="text-center w-[100px]">Full</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MODULES.map((m) => {
                const enabledCount = m.actions.filter((a) => role.permissions.includes(permKey(m.key, a))).length;
                const fullAccess = enabledCount === m.actions.length;
                return (
                  <TableRow key={m.key}>
                    <TableCell>
                      <div className="font-medium">{m.label}</div>
                      <div className="text-xs text-muted-foreground">{m.description}</div>
                    </TableCell>
                    {actions.map((a) => {
                      const supported = m.actions.includes(a);
                      const on = supported && role.permissions.includes(permKey(m.key, a));
                      return (
                        <TableCell key={a} className="text-center">
                          {supported ? (
                            <Checkbox
                              checked={on}
                              onCheckedChange={() => rbac.togglePermission(role.id, permKey(m.key, a))}
                              aria-label={`${ACTION_LABEL[a]} ${m.label}`}
                            />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      <Switch
                        checked={fullAccess}
                        onCheckedChange={(v) => rbac.setModulePermissions(role.id, m.key, v)}
                        aria-label={`Full access to ${m.label}`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="border-t px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
          <Check className="size-3.5" /> Changes are saved automatically.
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------- Roles Tab (CRUD) -------------------- */

function RolesTab() {
  const rbac = useRbac();
  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deletingRole = rbac.roles.find((r) => r.id === deletingId);
  const usersByRole = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of rbac.users) m.set(u.roleId, (m.get(u.roleId) ?? 0) + 1);
    return m;
  }, [rbac.users]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Create custom roles or edit descriptions of existing ones.</CardDescription>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="size-4 mr-2" /> New Role</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Permissions</TableHead>
              <TableHead className="text-center">Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rbac.roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>
                </TableCell>
                <TableCell>
                  {r.isSystem
                    ? <Badge variant="secondary" className="gap-1"><Lock className="size-3" /> System</Badge>
                    : <Badge variant="outline">Custom</Badge>}
                </TableCell>
                <TableCell className="text-center font-mono text-sm">{r.permissions.length}</TableCell>
                <TableCell className="text-center">{usersByRole.get(r.id) ?? 0}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => rbac.duplicateRole(r.id)} title="Duplicate">
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      onClick={() => setEditing(r)} title="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                      disabled={r.isSystem}
                      onClick={() => setDeletingId(r.id)}
                      title={r.isSystem ? "System role cannot be deleted" : "Delete"}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <RoleFormDialog
        open={creating || !!editing}
        role={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role “{deletingRole?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {(usersByRole.get(deletingId ?? "") ?? 0) > 0
                ? `${usersByRole.get(deletingId!)} user(s) currently assigned to this role will be reassigned to the Viewer role.`
                : "This role has no users assigned. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingId) { rbac.deleteRole(deletingId); toast.success("Role deleted"); }
                setDeletingId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function RoleFormDialog({ open, role, onClose }: { open: boolean; role: Role | null; onClose: () => void }) {
  const rbac = useRbac();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");

  // reset when opening
  useMemo(() => { if (open) { setName(role?.name ?? ""); setDescription(role?.description ?? ""); } }, [open, role]);

  const submit = () => {
    if (!name.trim()) return toast.error("Role name is required");
    if (role) {
      rbac.updateRole(role.id, { name: name.trim(), description: description.trim() });
      toast.success("Role updated");
    } else {
      rbac.addRole({ name: name.trim(), description: description.trim(), permissions: [] });
      toast.success("Role created — configure permissions in the matrix");
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "New Role"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="role-name">Name</Label>
            <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} disabled={role?.isSystem} placeholder="e.g. Warehouse Supervisor" />
            {role?.isSystem && <p className="text-xs text-muted-foreground mt-1">System role names cannot be changed.</p>}
          </div>
          <div>
            <Label htmlFor="role-desc">Description</Label>
            <Textarea id="role-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What this role is responsible for..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{role ? "Save changes" : "Create role"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Users Tab (CRUD) -------------------- */

function UsersTab() {
  const rbac = useRbac();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = rbac.users.filter((u) => {
    const s = q.toLowerCase().trim();
    if (!s) return true;
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>Assign roles to team members with access to the admin console.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8 w-56" />
          </div>
          <Button onClick={() => setCreating(true)}><Plus className="size-4 mr-2" /> Add Admin</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => {
              const role = rbac.roles.find((r) => r.id === u.roleId);
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{role?.name ?? "—"}</div>
                    {role && <div className="text-[11px] text-muted-foreground">{role.permissions.length} permissions</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === "Active" ? "default" : "secondary"}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button size="icon" variant="ghost"
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => setEditing(u)} title="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingId(u.id)} title="Remove">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <UserFormDialog
        open={creating || !!editing}
        user={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove admin user?</AlertDialogTitle>
            <AlertDialogDescription>They will lose access to the admin console immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingId) { rbac.deleteUser(deletingId); toast.success("User removed"); } setDeletingId(null); }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function UserFormDialog({ open, user, onClose }: { open: boolean; user: AdminUser | null; onClose: () => void }) {
  const rbac = useRbac();
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [roleId, setRoleId] = useState(user?.roleId ?? rbac.roles[0]?.id ?? "");
  const [status, setStatus] = useState<AdminUser["status"]>(user?.status ?? "Active");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useMemo(() => {
    if (open) {
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
      setRoleId(user?.roleId ?? rbac.roles[0]?.id ?? "");
      setStatus(user?.status ?? "Active");
      setPassword("");
      setConfirmPassword("");
    }
  }, [open, user, rbac.roles]);

  const submit = () => {
    if (!name.trim() || !email.trim()) return toast.error("Name and email are required");
    if (isEdit) {
      rbac.updateUser(user!.id, { name: name.trim(), email: email.trim(), roleId, status });
      toast.success("User updated");
    } else {
      if (password.length < 6) return toast.error("Password must be at least 6 characters");
      if (password !== confirmPassword) return toast.error("Passwords do not match");
      rbac.addUser({ name: name.trim(), email: email.trim(), roleId, status });
      toast.success("Admin added");
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? "Edit User" : "Add Admin"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="u-name">Full name</Label>
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="u-email">Email</Label>
            <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {isEdit && (
            <div>
              <Label>Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rbac.roles.map((r) => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!isEdit && (
            <>
              <div>
                <Label>Role</Label>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {rbac.roles.map((r) => (<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="u-pw">Password</Label>
                  <Input id="u-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                </div>
                <div>
                  <Label htmlFor="u-pw2">Confirm password</Label>
                  <Input id="u-pw2" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                </div>
              </div>
            </>
          )}
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AdminUser["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? "Save changes" : "Add admin"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

