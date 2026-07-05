import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { getProduct } from "@/data/products";
import { formatBDT } from "@/lib/format";

export const Route = createFileRoute("/portal-customer/cart")({
  head: () => ({ meta: [{ title: "Cart — Portal" }] }),
  component: CartPage,
});

function CartPage() {
  const { cart, dispatch, cartSubtotal } = useStore();
  const items = cart.map((i) => ({ ...i, product: getProduct(i.productId)! })).filter((i) => i.product);
  const subtotal = cartSubtotal((id) => getProduct(id)?.price ?? 0);
  const vat = Math.round(subtotal * 0.05);
  const total = subtotal + vat;

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-16 text-center">
        <ShoppingCart className="mx-auto size-16 text-muted-foreground" />
        <h1 className="mt-6 font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add industrial products to your cart to get started.</p>
        <Button asChild className="mt-6" size="lg"><Link to="/portal-customer/catalog">Browse Catalog</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Shopping Cart</h1>
        <p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "item" : "items"}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <img src={product.image} alt={product.name} className="size-24 object-cover bg-spec rounded" />
              <div className="flex flex-1 flex-col">
                <Link to="/portal-customer/catalog/$productId" params={{ productId: product.id }} className="font-semibold hover:text-primary">{product.name}</Link>
                <div className="text-xs text-muted-foreground">SKU: {product.sku} · {product.country}</div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center border border-border rounded-md">
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
            <Button variant="outline" asChild><Link to="/portal-customer/catalog">← Continue Shopping</Link></Button>
            <Button variant="ghost" onClick={() => dispatch({ type: "CLEAR_CART" })}>Clear Cart</Button>
          </div>
        </div>
        <aside>
          <div className="rounded-lg border border-border bg-card p-5 sticky top-20">
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
              <Link to="/portal-customer/checkout">Proceed to Checkout <ArrowRight className="size-4 ml-2" /></Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
