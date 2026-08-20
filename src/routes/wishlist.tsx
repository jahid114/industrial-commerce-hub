import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useStore } from "@/lib/store";
import { getProduct } from "@/data/products";
import { formatBDT } from "@/lib/format";
import { getEffectivePrice, getDiscountPct } from "@/lib/pricing";
import { toast } from "sonner";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "My Wishlist — MegaHaus" },
      { name: "description", content: "Products you saved for later on the MegaHaus industrial marketplace." },
      { property: "og:title", content: "My Wishlist — MegaHaus" },
      { property: "og:description", content: "Products you saved for later on the MegaHaus industrial marketplace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicWishlistPage,
});

function PublicWishlistPage() {
  const { wishlist, dispatch, isAuthenticated, isAdmin, isAgent, isPartner } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated && !isAdmin && !isAgent && !isPartner) {
      navigate({ to: "/portal-customer/wishlist" });
    }
  }, [isAuthenticated, isAdmin, isAgent, isPartner, navigate]);

  const products = wishlist
    .map((id) => getProduct(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getProduct>>[];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold">My Wishlist</h1>
        <p className="mb-6 text-sm text-muted-foreground">{products.length} saved products</p>

        <div className="rounded-lg border border-border bg-card">
          {products.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Heart className="mx-auto mb-3 size-10 opacity-40" />
              No saved items yet.{" "}
              <Link to="/products" className="text-primary hover:underline">Browse products</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {products.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                  <img src={p.image} alt={p.name} className="size-16 rounded bg-spec object-cover" />
                  <div className="min-w-[180px] flex-1">
                    <Link to="/products/$productId" params={{ productId: p.id }} className="font-semibold hover:text-primary">
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{p.country} · SKU {p.sku}</div>
                  </div>
                  <div className="font-display font-bold text-primary">{formatBDT(getEffectivePrice(p))}</div>
                  <Button
                    size="sm"
                    onClick={() => {
                      dispatch({ type: "ADD_TO_CART", productId: p.id, quantity: p.moq });
                      toast.success("Added to cart");
                    }}
                  >
                    Add to Cart
                  </Button>
                  <button
                    onClick={() => dispatch({ type: "TOGGLE_WISHLIST", productId: p.id })}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
