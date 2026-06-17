import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { getProduct } from "@/data/products";
import { formatBDT } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/account/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — MegaHaus" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist, dispatch } = useStore();
  const products = wishlist.map((id) => getProduct(id)).filter(Boolean) as NonNullable<ReturnType<typeof getProduct>>[];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="font-display text-xl font-bold">My Wishlist</h2>
        <p className="text-sm text-muted-foreground">{products.length} saved products</p>
      </div>
      {products.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">No saved items. <Link to="/products" className="text-primary hover:underline">Find products</Link></div>
      ) : (
        <div className="divide-y divide-border">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <img src={p.image} alt={p.name} className="size-16 object-cover bg-spec" />
              <div className="flex-1">
                <Link to="/products/$productId" params={{ productId: p.id }} className="font-semibold hover:text-primary">{p.name}</Link>
                <div className="text-xs text-muted-foreground">{p.country} · SKU {p.sku}</div>
              </div>
              <div className="font-display font-bold text-primary">{formatBDT(p.price)}</div>
              <Button size="sm" onClick={() => { dispatch({ type: "ADD_TO_CART", productId: p.id, quantity: p.moq }); toast.success("Added to cart"); }}>Add to Cart</Button>
              <button onClick={() => dispatch({ type: "TOGGLE_WISHLIST", productId: p.id })} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
