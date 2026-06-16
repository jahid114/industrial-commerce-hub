import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { suppliers } from "@/data/suppliers";

export const Route = createFileRoute("/admin/suppliers")({
  head: () => ({ meta: [{ title: "Manage Suppliers — Admin" }] }),
  component: AdminSuppliersPage,
});

function AdminSuppliersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Suppliers</h1>
        <p className="text-sm text-muted-foreground">{suppliers.length} verified suppliers</p>
      </div>

      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-left">Country</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-right">Products</th>
              <th className="px-4 py-3 text-right">Rating</th>
              <th className="px-4 py-3 text-right">Since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-secondary">
                <td className="px-4 py-3 font-semibold">{s.name}</td>
                <td className="px-4 py-3"><Badge variant="outline">{s.country}</Badge></td>
                <td className="px-4 py-3">{s.contactName}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                <td className="px-4 py-3 text-right">{s.productsCount}</td>
                <td className="px-4 py-3 text-right"><span className="inline-flex items-center gap-1"><Star className="size-3 fill-accent text-accent" />{s.rating}</span></td>
                <td className="px-4 py-3 text-right text-muted-foreground">{new Date(s.since).getFullYear()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
