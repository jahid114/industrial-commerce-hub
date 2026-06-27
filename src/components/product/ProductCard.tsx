import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, GitCompare, Eye, Package, Truck, Check, ShieldCheck, ShoppingCart, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Product } from "@/data/types";
import { getBrand } from "@/data/brands";
import { formatBDT } from "@/lib/format";
import { useStore } from "@/lib/store";
import { getAgentPrice, canSeeAgentPrice } from "@/lib/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { dispatch, wishlist, compare, user } = useStore();
  const brand = getBrand(product.brandId);
  const inWishlist = wishlist.includes(product.id);
  const inCompare = compare.includes(product.id);
  const showAgent = canSeeAgentPrice(user?.role);
  const agentPrice = getAgentPrice(product);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary hover:shadow-lg"
    >
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.preventDefault(); dispatch({ type: "TOGGLE_WISHLIST", productId: product.id }); toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist"); }}
          className={cn("flex size-8 items-center justify-center rounded-full border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary", inWishlist && "bg-primary text-primary-foreground border-primary")}
          aria-label="Wishlist"
        >
          <Heart className="size-4" fill={inWishlist ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); dispatch({ type: "TOGGLE_COMPARE", productId: product.id }); toast.success(inCompare ? "Removed from compare" : "Added to compare"); }}
          className={cn("flex size-8 items-center justify-center rounded-full border bg-card hover:bg-accent hover:text-accent-foreground hover:border-accent", inCompare && "bg-accent text-accent-foreground border-accent")}
          aria-label="Compare"
        >
          <GitCompare className="size-4" />
        </button>
      </div>

      <Link to="/products/$productId" params={{ productId: product.id }} className="block">
        <div className="relative aspect-square overflow-hidden bg-spec">
          <img src={product.image} alt={product.name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.featured && <Badge className="bg-accent text-accent-foreground hover:bg-accent">Featured</Badge>}
            <Badge variant="outline" className="bg-card/90 text-[10px]">{product.country}</Badge>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{brand?.name}</div>
        <Link to="/products/$productId" params={{ productId: product.id }}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug hover:text-primary">{product.name}</h3>
        </Link>
        <div className="my-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>MOQ: <strong className="text-foreground">{product.moq}</strong></span>
          <span>Delivery: <strong className="text-foreground">{product.deliveryDays}</strong></span>
        </div>
        <div className="mt-auto flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">From</div>
            <div className="font-display text-lg font-bold text-primary">{formatBDT(product.price)}</div>
            {showAgent && (
              <div className="mt-0.5 inline-flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                Agent · {formatBDT(agentPrice)}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            onClick={() => { dispatch({ type: "ADD_TO_CART", productId: product.id, quantity: product.moq }); toast.success("Added to cart"); }}
            className="h-9 text-xs font-semibold"
          >
            Add to Cart
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 text-xs font-semibold border-accent text-accent-foreground bg-accent hover:bg-accent/90"
          >
            <Link to="/quotation" search={{ productId: product.id } as never}>Get Quote</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
