import { createFileRoute, Link } from "@tanstack/react-router";
import { X, ShoppingCart } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { getProduct } from "@/data/products";
import { getBrand } from "@/data/brands";
import { formatBDT } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Products — MegaHaus" },
      { name: "description", content: "Compare up to 4 industrial products side-by-side on specs, pricing and delivery." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { compare, dispatch } = useStore();
  const products = compare.map((id) => getProduct(id)).filter(Boolean) as NonNullable<ReturnType<typeof getProduct>>[];

  if (products.length === 0) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-bold">No products to compare</h1>
          <p className="mt-2 text-muted-foreground">Add products to compare using the compare icon on product cards.</p>
          <Button asChild className="mt-6"><Link to="/products">Browse Products</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  // Collect all spec labels
  const allLabels = Array.from(new Set(products.flatMap((p) => p.specs.map((s) => s.label))));

  return (
    <PublicLayout>
      <div className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Compare Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} of 4 products selected</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 overflow-x-auto">
        <table className="w-full border border-border text-sm min-w-[700px]">
          <thead>
            <tr>
              <th className="bg-spec border-b border-r border-border p-4 text-left w-44">Product</th>
              {products.map((p) => (
                <th key={p.id} className="border-b border-r border-border p-4 text-left bg-card">
                  <button onClick={() => dispatch({ type: "TOGGLE_COMPARE", productId: p.id })} className="float-right text-muted-foreground hover:text-destructive"><X className="size-4" /></button>
                  <img src={p.image} alt={p.name} className="size-32 object-cover bg-spec" />
                  <div className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{getBrand(p.brandId)?.name}</div>
                  <Link to="/products/$productId" params={{ productId: p.id }} className="text-sm font-semibold hover:text-primary">{p.name}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Price">{products.map((p) => <td key={p.id} className="border-b border-r border-border p-4 font-display text-lg font-bold text-primary">{formatBDT(p.price)}</td>)}</Row>
            <Row label="MOQ">{products.map((p) => <td key={p.id} className="border-b border-r border-border p-4">{p.moq} units</td>)}</Row>
            <Row label="Country">{products.map((p) => <td key={p.id} className="border-b border-r border-border p-4">{p.country}</td>)}</Row>
            <Row label="Delivery">{products.map((p) => <td key={p.id} className="border-b border-r border-border p-4">{p.deliveryDays}</td>)}</Row>
            <Row label="Stock">{products.map((p) => <td key={p.id} className="border-b border-r border-border p-4">{p.stock} units</td>)}</Row>
            {allLabels.map((label) => (
              <Row key={label} label={label}>
                {products.map((p) => <td key={p.id} className="border-b border-r border-border p-4">{p.specs.find((s) => s.label === label)?.value ?? "—"}</td>)}
              </Row>
            ))}
            <tr>
              <td className="border-r border-border bg-spec p-4 font-semibold">Action</td>
              {products.map((p) => (
                <td key={p.id} className="border-r border-border p-4">
                  <Button size="sm" className="w-full" onClick={() => { dispatch({ type: "ADD_TO_CART", productId: p.id, quantity: p.moq }); toast.success("Added to cart"); }}>
                    <ShoppingCart className="size-4 mr-1" /> Add to Cart
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </PublicLayout>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="bg-spec border-b border-r border-border p-4 font-semibold text-muted-foreground">{label}</td>
      {children}
    </tr>
  );
}
