import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Eye, ShoppingCart, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { brands } from "@/data/brands";
import { formatBDT } from "@/lib/format";
import { getAgentPrice } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ProductQuickView } from "@/components/product/ProductQuickView";
import { NewOrderDialog } from "@/components/agent/NewOrderDialog";
import type { Product } from "@/data/types";

export const Route = createFileRoute("/portal/catalog")({
  component: AgentCatalogPage,
});

function AgentCatalogPage() {
  const { dispatch, isAgent, cart, cartCount } = useStore();
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<Product | null>(null);
  const [ordering, setOrdering] = useState(false);
  if (!isAgent) return <div className="text-sm text-muted-foreground">Agent-only catalog.</div>;
  const list = products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase()));

  const addToCart = (p: Product) => {
    if (cart.some((c) => c.productId === p.id)) {
      toast.info(`${p.name} already in cart`);
      return;
    }
    dispatch({ type: "ADD_TO_CART", productId: p.id, quantity: p.moq });
    toast.success(`Added ${p.name} at agent price`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Agent Catalog</h1>
          <p className="text-sm text-muted-foreground">Exclusive agent pricing — add multiple products to cart, then place a single order for your customer.</p>
        </div>
      </div>

      {cartCount > 0 && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-sm">
            <ShoppingCart className="size-4 text-primary" />
            <span><strong>{cartCount}</strong> {cartCount === 1 ? "item" : "items"} ready for a new order</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { dispatch({ type: "CLEAR_CART" }); toast.success("Cart cleared"); }}>
              <X className="size-4 mr-1.5" /> Clear
            </Button>
            <Button size="sm" onClick={() => setOrdering(true)}>
              <Plus className="size-4 mr-1.5" /> Start Order
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="size-4 text-muted-foreground" />
          <Input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} className="border-0 shadow-none focus-visible:ring-0" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-spec text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Brand</th>
                <th className="px-4 py-3 text-right">Customer ৳</th>
                <th className="px-4 py-3 text-right">Agent ৳</th>
                <th className="px-4 py-3 text-right">Margin</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((p) => {
                const ap = getAgentPrice(p);
                const margin = p.price - ap;
                const inCart = cart.some((c) => c.productId === p.id);
                return (
                  <tr key={p.id} className="hover:bg-secondary">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt="" className="size-10 object-cover bg-spec" />
                        <div>
                          <div className="font-medium line-clamp-1">{p.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline">{brands.find((b) => b.id === p.brandId)?.name}</Badge></td>
                    <td className="px-4 py-3 text-right text-muted-foreground line-through">{formatBDT(p.price)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{formatBDT(ap)}</td>
                    <td className="px-4 py-3 text-right text-success font-semibold">+{formatBDT(margin)}</td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => setViewing(p)} className="text-primary hover:bg-primary/10 hover:text-primary" aria-label="View"><Eye className="size-4" /></Button>
                      <Button size="sm" variant={inCart ? "outline" : "default"} onClick={() => addToCart(p)}>
                        <ShoppingCart className="size-4 mr-1.5" />{inCart ? "In cart" : "Add to cart"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ProductQuickView product={viewing} open={!!viewing} onOpenChange={(v) => { if (!v) setViewing(null); }} />
      <NewOrderDialog open={ordering} onOpenChange={setOrdering} preloadCart />
    </div>
  );
}
