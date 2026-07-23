import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Eye, TrendingUp, ShoppingBag, Wallet, Calendar } from "lucide-react";
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
import { useStore } from "@/lib/store";
import { formatBDT, formatDate } from "@/lib/format";
import type { Agent, Order } from "@/data/types";

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
  const { orders } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Agent | null>(null);

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
                  <Button size="icon" variant="ghost" onClick={() => setViewing(a)} className="text-primary hover:bg-primary/10 hover:text-primary"><Eye className="size-4" /></Button>
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

      <AgentDetailsDialog agent={viewing} orders={orders} onClose={() => setViewing(null)} />
    </div>
  );
}

function AgentDetailsDialog({ agent, orders, onClose }: { agent: Agent | null; orders: Order[]; onClose: () => void }) {
  const stats = useMemo(() => {
    if (!agent) return null;
    const agentOrders = orders.filter((o) => o.agentId === agent.id);
    const totalRevenue = agentOrders.reduce((s, o) => s + o.total, 0);
    const commission = Math.round(totalRevenue * 0.05);
    const byStatus = agentOrders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});
    const uniqueCustomers = new Set(agentOrders.map((o) => o.customerEmail)).size;
    const avgOrderValue = agentOrders.length ? Math.round(totalRevenue / agentOrders.length) : 0;
    const paid = agentOrders.filter((o) => o.paymentStatus === "Paid").reduce((s, o) => s + o.total, 0);
    const outstanding = totalRevenue - paid;
    // Monthly breakdown (last 6 months)
    const now = new Date();
    const months: { label: string; revenue: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleString("en-US", { month: "short" });
      const inMonth = agentOrders.filter((o) => {
        const od = new Date(o.date);
        return `${od.getFullYear()}-${od.getMonth()}` === key;
      });
      months.push({ label, revenue: inMonth.reduce((s, o) => s + o.total, 0), count: inMonth.length });
    }
    const maxMonth = Math.max(1, ...months.map((m) => m.revenue));
    const recent = [...agentOrders].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
    return { agentOrders, totalRevenue, commission, byStatus, uniqueCustomers, avgOrderValue, paid, outstanding, months, maxMonth, recent };
  }, [agent, orders]);

  if (!agent || !stats) return null;

  return (
    <Dialog open={!!agent} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{agent.name}</span>
            <Badge className={statusClass(agent.status)}>{agent.status}</Badge>
          </DialogTitle>
          <DialogDescription>{agent.id} · {agent.area}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Contact */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <div><div className="text-xs text-muted-foreground">Phone</div><div>{agent.phone}</div></div>
            <div><div className="text-xs text-muted-foreground">Email</div><div className="break-all">{agent.email}</div></div>
            <div><div className="text-xs text-muted-foreground">Joined</div><div>{formatDate(agent.joined)}</div></div>
            <div><div className="text-xs text-muted-foreground">Territory</div><div>{agent.area}</div></div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={ShoppingBag} label="Orders" value={String(stats.agentOrders.length)} />
            <StatCard icon={TrendingUp} label="Revenue" value={formatBDT(stats.totalRevenue)} />
            <StatCard icon={Wallet} label="Commission (5%)" value={formatBDT(stats.commission)} />
            <StatCard icon={Calendar} label="Avg. order" value={formatBDT(stats.avgOrderValue)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Customers" value={String(stats.uniqueCustomers)} />
            <StatCard label="Paid" value={formatBDT(stats.paid)} />
            <StatCard label="Outstanding" value={formatBDT(stats.outstanding)} />
            <StatCard label="Directory commission" value={formatBDT(agent.commissionEarned)} />
          </div>

          {/* Status breakdown */}
          <div className="rounded-lg border border-border p-3">
            <div className="mb-2 text-sm font-semibold">Orders by status</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(stats.byStatus).length === 0 && <div className="text-sm text-muted-foreground">No orders yet.</div>}
              {Object.entries(stats.byStatus).map(([s, n]) => (
                <Badge key={s} variant="outline" className="gap-1">{s} <span className="font-semibold">{n}</span></Badge>
              ))}
            </div>
          </div>

          {/* Monthly revenue */}
          <div className="rounded-lg border border-border p-3">
            <div className="mb-3 text-sm font-semibold">Revenue — last 6 months</div>
            <div className="flex items-end gap-2 h-32">
              {stats.months.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-primary/80 rounded-t" style={{ height: `${(m.revenue / stats.maxMonth) * 100}%`, minHeight: 2 }} title={formatBDT(m.revenue)} />
                  <div className="text-[10px] text-muted-foreground">{m.label}</div>
                  <div className="text-[10px] font-semibold">{m.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 text-sm font-semibold bg-spec">Recent orders</div>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">Order</th><th className="px-3 py-2 text-left">Customer</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recent.map((o) => (
                  <tr key={o.id}>
                    <td className="px-3 py-2 font-mono text-xs">{o.id}</td>
                    <td className="px-3 py-2">{o.customerName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(o.date)}</td>
                    <td className="px-3 py-2"><Badge variant="outline">{o.status}</Badge></td>
                    <td className="px-3 py-2 text-right font-semibold">{formatBDT(o.total)}</td>
                  </tr>
                ))}
                {stats.recent.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No orders from this agent yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, value }: { icon?: typeof ShoppingBag; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3.5" />} {label}
      </div>
      <div className="mt-1 text-lg font-bold text-primary">{value}</div>
    </div>
  );
}
