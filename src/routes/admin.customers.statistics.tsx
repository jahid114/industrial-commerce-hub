import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { useCustomers } from "@/lib/customers-store";
import { useStore } from "@/lib/store";
import { formatBDT } from "@/lib/format";

export const Route = createFileRoute("/admin/customers/statistics")({
  head: () => ({ meta: [{ title: "Customer Statistics — Admin" }] }),
  component: CustomerStatsPage,
});

function CustomerStatsPage() {
  const { customers } = useCustomers();
  const { orders } = useStore();

  const activeCount = customers.filter((c) => c.status === "Active").length;
  const suspendedCount = customers.filter((c) => c.status === "Suspended").length;

  const trendData = useMemo(() => {
    const days: { day: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en", { day: "2-digit", month: "short" });
      const count = customers.filter((c) => {
        const cd = new Date(c.registeredAt);
        return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth() && cd.getDate() === d.getDate();
      }).length;
      days.push({ day: label, count });
    }
    return days;
  }, [customers]);

  const cumulativeData = useMemo(() => {
    const baseline = customers.length - trendData.reduce((s, d) => s + d.count, 0);
    let cum = baseline;
    return trendData.map((d) => ({ day: d.day, total: (cum += d.count) }));
  }, [trendData, customers.length]);

  const topCities = useMemo(() => {
    const m = new Map<string, number>();
    customers.forEach((c) => { if (c.city) m.set(c.city, (m.get(c.city) ?? 0) + 1); });
    return Array.from(m.entries()).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [customers]);

  const newLast7 = trendData.slice(-7).reduce((s, d) => s + d.count, 0);
  const newLast30 = trendData.reduce((s, d) => s + d.count, 0);

  // Top spenders
  const topSpenders = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const o of orders) {
      if (o.status === "Cancelled") continue;
      const key = o.customerEmail.toLowerCase();
      const cur = map.get(key) ?? { total: 0, count: 0 };
      cur.total += o.total;
      cur.count += 1;
      map.set(key, cur);
    }
    return customers
      .map((c) => ({ c, s: map.get(c.email.toLowerCase()) }))
      .filter((x) => x.s)
      .sort((a, b) => (b.s!.total - a.s!.total))
      .slice(0, 5);
  }, [orders, customers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Customer Statistics</h1>
        <p className="text-sm text-muted-foreground">Growth trends and platform health for registered customers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Users} label="Total Customers" value={customers.length.toString()} color="bg-primary" />
        <Kpi icon={UserCheck} label="Active" value={activeCount.toString()} color="bg-success" />
        <Kpi icon={UserX} label="Suspended" value={suspendedCount.toString()} color="bg-destructive" />
        <Kpi icon={TrendingUp} label="New (30 days)" value={newLast30.toString()} sub={`${newLast7} in last 7 days`} color="bg-accent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-bold mb-4">Daily Registrations (30 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="day" fontSize={10} interval={2} />
              <YAxis fontSize={11} allowDecimals={false} />
              <RTooltip />
              <Bar dataKey="count" fill="#DC2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Cumulative Growth</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="day" fontSize={10} interval={4} />
              <YAxis fontSize={11} allowDecimals={false} />
              <RTooltip />
              <Line type="monotone" dataKey="total" stroke="#F97316" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {topCities.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold mb-4">Top Cities</h2>
            <div className="space-y-3">
              {topCities.map((c) => (
                <div key={c.city}>
                  <div className="flex justify-between text-xs"><span className="font-semibold">{c.city}</span><span className="text-muted-foreground">{c.count}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(c.count / topCities[0].count) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Top Spenders</h2>
          {topSpenders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="divide-y divide-border text-sm">
              {topSpenders.map(({ c, s }) => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.company ?? c.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-primary">{formatBDT(s!.total)}</div>
                    <div className="text-xs text-muted-foreground">{s!.count} orders</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, color }: { icon: typeof Users; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className={`flex size-10 items-center justify-center ${color} text-white`}><Icon className="size-5" /></div>
      <div className="mt-4 font-display text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {sub && <div className="mt-1 text-xs text-success">{sub}</div>}
    </div>
  );
}
