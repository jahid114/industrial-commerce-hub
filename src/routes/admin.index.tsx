import { createFileRoute } from "@tanstack/react-router";
import { Package, ShoppingBag, FileText, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell, Legend } from "recharts";
import { useStore } from "@/lib/store";
import { products } from "@/data/products";
import { agents } from "@/data/agents";
import { formatBDT, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — MegaHaus" }] }),
  component: AdminDashboard,
});

const COLORS = ["#DC2626", "#F97316", "#0F172A", "#3B82F6", "#10B981"];

function AdminDashboard() {
  const { orders, quotations } = useStore();

  const totalRevenue = orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const openRfqs = quotations.filter((q) => q.status === "Open").length;
  const activeAgents = agents.filter((a) => a.status === "Active").length;

  // Orders by month (mock from order dates)
  const byMonth = orders.reduce<Record<string, number>>((acc, o) => {
    const m = new Date(o.date).toLocaleString("en", { month: "short" });
    acc[m] = (acc[m] ?? 0) + o.total;
    return acc;
  }, {});
  const lineData = Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue }));

  const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

  const byCategory = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.categoryId] = (acc[p.categoryId] ?? 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(byCategory).map(([category, count]) => ({ category, count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of MegaHaus operations</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total Revenue" value={formatBDT(totalRevenue)} icon={TrendingUp} color="bg-primary" />
        <Kpi label="Total Orders" value={orders.length.toString()} icon={ShoppingBag} color="bg-accent" />
        <Kpi label="Active Products" value={products.length.toString()} icon={Package} color="bg-industrial" />
        <Kpi label="Open RFQs" value={openRfqs.toString()} icon={FileText} color="bg-success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-bold mb-4">Revenue by Month</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatBDT(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#DC2626" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label={(p) => p.name}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Products per Category</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="category" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#F97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Recent Orders</h2>
            <Users className="size-5 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border text-sm">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="font-semibold">{o.id}</div>
                  <div className="text-xs text-muted-foreground">{o.customerName} · {formatDate(o.date)}</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-primary">{formatBDT(o.total)}</div>
                  <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">Active agents: {activeAgents} · Total quotations: {quotations.length}</div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Package; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className={`flex size-10 items-center justify-center ${color} text-white`}><Icon className="size-5" /></div>
      </div>
      <div className="mt-4 font-display text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
