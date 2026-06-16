import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { agents } from "@/data/agents";
import { formatBDT, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/agents")({
  head: () => ({ meta: [{ title: "Manage Agents — Admin" }] }),
  component: AdminAgentsPage,
});

function AdminAgentsPage() {
  const totalCommission = agents.reduce((s, a) => s + a.commissionEarned, 0);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Agents</h1>
        <p className="text-sm text-muted-foreground">{agents.length} field agents · Total commission paid: <strong className="text-primary">{formatBDT(totalCommission)}</strong></p>
      </div>

      <div className="border border-border bg-card overflow-x-auto">
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
                <td className="px-4 py-3 text-right"><Badge className={a.status === "Active" ? "bg-success/20 text-success" : a.status === "Pending" ? "bg-accent/20 text-accent-foreground" : "bg-muted"}>{a.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
