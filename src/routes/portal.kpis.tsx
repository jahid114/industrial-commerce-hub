import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Users, Package, Building2 } from "lucide-react";

export const Route = createFileRoute("/portal/kpis")({
  component: KpisPage,
});

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const gmv = [180, 215, 268, 312, 384, 482]; // in lakhs

function KpisPage() {
  const max = Math.max(...gmv);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Live KPIs</h1>
        <p className="text-sm text-muted-foreground">Quarter-to-date operational health for MegaHaus Industrial Hub.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { Icon: TrendingUp, label: "GMV (Q2)", value: "৳ 4.82 Cr", sub: "+38% YoY" },
          { Icon: Users, label: "Customers", value: "1,284", sub: "+162 QoQ" },
          { Icon: Package, label: "SKUs Live", value: products_count.toString(), sub: "11 categories" },
          { Icon: Building2, label: "Suppliers", value: "42", sub: "6 origin countries" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.Icon className="size-4 text-primary" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold">{s.value}</div>
            <div className="mt-1 text-xs text-success">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold mb-4">GMV — last 6 months (৳ lakhs)</h2>
        <div className="flex items-end justify-between gap-3 h-48">
          {gmv.map((v, i) => (
            <div key={months[i]} className="flex flex-1 flex-col items-center gap-2">
              <div className="text-xs font-semibold">{v}</div>
              <div className="w-full rounded-t bg-primary" style={{ height: `${(v / max) * 100}%` }} />
              <div className="text-xs text-muted-foreground">{months[i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold">Supplier Mix</h3>
          <div className="mt-4 space-y-3">
            {[
              ["Germany", 38], ["Japan", 24], ["China", 18], ["USA", 11], ["Italy", 6], ["Switzerland", 3],
            ].map(([country, pct]) => (
              <div key={country as string}>
                <div className="flex justify-between text-xs"><span>{country}</span><span className="font-semibold">{pct}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-spec overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold">Cohort Retention (90d)</h3>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div><div className="font-display text-2xl font-bold text-primary">86%</div><div className="text-xs text-muted-foreground">Month 1</div></div>
            <div><div className="font-display text-2xl font-bold text-primary">71%</div><div className="text-xs text-muted-foreground">Month 2</div></div>
            <div><div className="font-display text-2xl font-bold text-primary">63%</div><div className="text-xs text-muted-foreground">Month 3</div></div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Industrial buyers re-order at an above-category-average cadence due to MRO consumption.</p>
        </div>
      </div>
    </div>
  );
}

import { products } from "@/data/products";
const products_count = products.length;
