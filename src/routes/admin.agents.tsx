import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDirectory } from "@/lib/directory-store";
import { formatBDT, formatDate } from "@/lib/format";
import type { Agent } from "@/data/types";

export const Route = createFileRoute("/admin/agents")({
  head: () => ({ meta: [{ title: "Manage Agents — Admin" }] }),
  component: AdminAgentsPage,
});

const STATUSES: Agent["status"][] = ["Active", "Pending", "Suspended"];

type FormState = Omit<Agent, "id" | "ordersSubmitted" | "commissionEarned">;

const emptyForm: FormState = {
  name: "",
  area: "",
  phone: "",
  email: "",
  joined: new Date().toISOString().slice(0, 10),
  status: "Pending",
};

function statusClass(s: Agent["status"]) {
  if (s === "Active") return "bg-success/20 text-success";
  if (s === "Pending") return "bg-accent/20 text-accent-foreground";
  return "bg-muted";
}

function AdminAgentsPage() {
  const { agents, addAgent, updateAgent, deleteAgent } = useDirectory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalCommission = agents.reduce((s, a) => s + a.commissionEarned, 0);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (a: Agent) => {
    setEditing(a);
    const { id: _id, ordersSubmitted: _os, commissionEarned: _ce, ...rest } = a;
    void _id; void _os; void _ce;
    setForm(rest);
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.email.trim() || !form.area.trim()) {
      toast.error("Name, area and email are required");
      return;
    }
    if (editing) {
      updateAgent(editing.id, { ...form, ordersSubmitted: editing.ordersSubmitted, commissionEarned: editing.commissionEarned });
      toast.success("Agent updated");
    } else {
      addAgent({ ...form, ordersSubmitted: 0, commissionEarned: 0 });
      toast.success("Agent added");
    }
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteAgent(deleteId);
    toast.success("Agent deleted");
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Agents</h1>
          <p className="text-sm text-muted-foreground">{agents.length} field agents · Total commission paid: <strong className="text-primary">{formatBDT(totalCommission)}</strong></p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="size-4" /> Add agent</Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Agent</th>
              <th className="px-4 py-3 text-left">Area</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-right">Commission</th>
              <th className="px-4 py-3 text-right">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {agents.map((a) => (
              <tr key={a.id} className="hover:bg-secondary">
                <td className="px-4 py-3">
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.id}</div>
                </td>
                <td className="px-4 py-3">{a.area}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{a.phone}<br />{a.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(a.joined)}</td>
                <td className="px-4 py-3 text-right">{a.ordersSubmitted}</td>
                <td className="px-4 py-3 text-right font-semibold text-primary">{formatBDT(a.commissionEarned)}</td>
                <td className="px-4 py-3 text-right"><Badge className={statusClass(a.status)}>{a.status}</Badge></td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(a)} className="text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(a.id)} className="text-destructive hover:bg-destructive/20 hover:text-destructive"><Trash2 className="size-4" /></Button>
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No agents yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit agent" : "Add agent"}</DialogTitle>
            <DialogDescription>Manage field agent details and status.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Full name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Area / territory</Label>
              <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Joined</Label>
                <Input type="date" value={form.joined} onChange={(e) => setForm({ ...form, joined: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Agent["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add agent"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete agent?</AlertDialogTitle>
            <AlertDialogDescription>This removes the agent from your directory. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
