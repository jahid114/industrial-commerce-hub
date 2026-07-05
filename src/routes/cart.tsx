import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useStore } from "@/lib/store";
import { getProduct } from "@/data/products";
import { formatBDT } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Cart — MegaHaus" },
      { name: "description", content: "Review items in your cart and proceed to secure checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, dispatch, cartSubtotal, isAuthenticated, isAdmin, isAgent, isPartner } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated && !isAdmin && !isAgent && !isPartner) {
      navigate({ to: "/portal-customer/cart" });
    }
  }, [isAuthenticated, isAdmin, isAgent, isPartner, navigate]);
  const items = cart.map((i) => ({ ...i, product: getProduct(i.productId)! })).filter((i) => i.product);
  const subtotal = cartSubtotal((id) => getProduct(id)?.price ?? 0);
  const vat = Math.round(subtotal * 0.05);
  const total = subtotal + vat;

  if (items.length === 0) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <ShoppingCart className="mx-auto size-16 text-muted-foreground" />
          <h1 className="mt-6 font-display text-3xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Add industrial products to your cart to get started.</p>
          <Button asChild className="mt-6" size="lg"><Link to="/products">Browse Products</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "item" : "items"}</p>
        </div>
      </div>

      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <img src={product.image} alt={product.name} className="size-24 object-cover bg-spec" />
              <div className="flex flex-1 flex-col">
                <Link to="/products/$productId" params={{ productId: product.id }} className="font-semibold hover:text-primary">{product.name}</Link>
                <div className="text-xs text-muted-foreground">SKU: {product.sku} · {product.country}</div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center border border-border">
                    <button onClick={() => dispatch({ type: "UPDATE_QTY", productId: product.id, quantity: quantity - 1 })} className="px-3 py-1 hover:bg-secondary">−</button>
                    <span className="w-12 text-center text-sm">{quantity}</span>
                    <button onClick={() => dispatch({ type: "UPDATE_QTY", productId: product.id, quantity: quantity + 1 })} className="px-3 py-1 hover:bg-secondary">+</button>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-bold text-primary">{formatBDT(product.price * quantity)}</div>
                    <div className="text-xs text-muted-foreground">{formatBDT(product.price)} × {quantity}</div>
                  </div>
                </div>
              </div>
              <button onClick={() => dispatch({ type: "REMOVE_FROM_CART", productId: product.id })} className="text-muted-foreground hover:text-destructive self-start" aria-label="Remove">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <div className="flex justify-between pt-3">
            <Button variant="outline" asChild><Link to="/products">← Continue Shopping</Link></Button>
            <Button variant="ghost" onClick={() => dispatch({ type: "CLEAR_CART" })}>Clear Cart</Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold border-b border-border pb-3">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBDT(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">VAT (5%)</span><span>{formatBDT(vat)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-success">To be calculated</span></div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total</span><span className="text-primary text-xl font-display">{formatBDT(total)}</span>
              </div>
            </div>
            <Button asChild size="lg" className="mt-5 w-full font-bold uppercase">
              <Link to="/checkout">Proceed to Checkout <ArrowRight className="size-4 ml-2" /></Link>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Secure checkout · Bank, bKash, Nagad or COD</p>
          </div>
        </aside>
      </div>
    </PublicLayout>
  );
}
