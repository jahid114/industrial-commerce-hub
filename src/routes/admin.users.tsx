import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { UserCog, Plus, Pencil, Trash2, Users, ShieldCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableSearchBar } from "@/components/admin/TableToolbar";
import { toast } from "sonner";
import { useRbac, type AdminUser } from "@/lib/rbac-store";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Admin Users — MegaHaus Admin" },
      { name: "description", content: "Manage admin console users, their roles and access status." },
      { property: "og:title", content: "Admin Users — MegaHaus Admin" },
      { property: "og:description", content: "Manage admin console users, their roles and access status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const rbac = useRbac();
  const active = rbac.users.filter((u) => u.status === "Active").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold flex items-center gap-3">
          <UserCog className="size-7 text-primary" /> Admin Users
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage team members who can access the admin console and the role assigned to each.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard icon={Users} label="Total admins" value={rbac.users.length} />
        <StatCard icon={ShieldCheck} label="Active" value={active} />
        <StatCard icon={UserX} label="Inactive" value={rbac.users.length - active} />
      </div>

      <UsersTab />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="size-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function UsersTab() {
  const rbac = useRbac();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = rbac.users.filter((u) => {
    const s = q.toLowerCase().trim();
    const matchesQ = !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <TableSearchBar value={q} onChange={setQ} placeholder="Search by name or email…">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          <Plus className="size-4 mr-2" /> Add Admin
        </Button>
      </TableSearchBar>

      <Card>
        <CardHeader>
          <CardTitle>Admin Users ({filtered.length})</CardTitle>
          <CardDescription>Team members with access to the admin console.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === "Active" ? "default" : "secondary"}>{u.status}</Badge>
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
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No users found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
    </div>
  );
}

function UserFormDialog({ open, user, onClose }: { open: boolean; user: AdminUser | null; onClose: () => void }) {
  const rbac = useRbac();
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const roleId = user?.roleId ?? rbac.roles[0]?.id ?? "";
  const [status, setStatus] = useState<AdminUser["status"]>(user?.status ?? "Active");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useMemo(() => {
    if (open) {
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
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
          {!isEdit && (
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
