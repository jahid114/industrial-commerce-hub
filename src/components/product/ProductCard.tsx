import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, GitCompare, Eye, Package, Truck, Check, ShieldCheck, ShoppingCart, Factory, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Product } from "@/data/types";
import { getBrand } from "@/data/brands";
import { getCategory } from "@/data/categories";
import { getSupplier } from "@/data/suppliers";
import { formatBDT } from "@/lib/format";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { dispatch, wishlist, compare } = useStore();
  const [quickOpen, setQuickOpen] = useState(false);
  const brand = getBrand(product.brandId);
  const category = getCategory(product.categoryId);
  const supplier = getSupplier(product.supplierId);
  const inWishlist = wishlist.includes(product.id);
  const inCompare = compare.includes(product.id);

  return (
    <>
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
          <div className="mb-1 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span className="truncate">{brand?.name}</span>
            {product.subcategory && <span className="truncate text-[10px] font-medium text-primary/80">{product.subcategory}</span>}
          </div>
          <Link to="/products/$productId" params={{ productId: product.id }}>
            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug hover:text-primary">{product.name}</h3>
          </Link>
          {product.tags && product.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((t) => (
                <Badge key={t} variant="secondary" className="px-1.5 py-0 text-[9px] font-normal">{t}</Badge>
              ))}
            </div>
          )}
          <div className="my-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>MOQ: <strong className="text-foreground">{product.moq}</strong></span>
            <span>Delivery: <strong className="text-foreground">{product.deliveryDays}</strong></span>
          </div>

          <div className="mt-auto flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">From</div>
              <div className="font-display text-lg font-bold text-primary">{formatBDT(product.price)}</div>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); setQuickOpen(true); }}
              className="flex size-8 items-center justify-center rounded-full border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary"
              aria-label="Quick view"
            >
              <Eye className="size-4" />
            </button>
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

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="grid md:grid-cols-2">
            <div className="flex flex-col gap-3 p-6 bg-spec">
              <div className="aspect-square overflow-hidden rounded-lg bg-card">
                <img src={product.image} alt={product.name} className="size-full object-cover" />
              </div>
              {product.gallery.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.gallery.map((src, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-md bg-card">
                      <img src={src} alt={`${product.name} ${i + 1}`} className="size-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col p-6">
              <DialogHeader className="text-left space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-bold uppercase">{brand?.name}</Badge>
                  <Badge variant="outline">{product.country}</Badge>
                  {category && <Badge variant="secondary" className="text-[10px]">{category.name}</Badge>}
                </div>
                <DialogTitle className="font-display text-2xl leading-tight">{product.name}</DialogTitle>
                <DialogDescription>{product.shortDescription}</DialogDescription>
              </DialogHeader>

              <div className="my-4 border-y border-border py-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Starting from</div>
                <div className="font-display text-2xl font-bold text-primary">{formatBDT(product.price)}<span className="ml-1 text-xs font-normal text-muted-foreground">/ unit</span></div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</h4>
                  <p className="text-sm leading-relaxed text-foreground">{product.description}</p>
                </div>

                {product.specs.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Specifications</h4>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      {product.specs.map((spec, i) => (
                        <div key={i} className="flex flex-col rounded border border-border bg-card p-2">
                          <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">{spec.label}</dt>
                          <dd className="font-semibold text-foreground">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <MiniStat icon={Package} label="MOQ" value={`${product.moq} units`} />
                  <MiniStat icon={Truck} label="Delivery" value={product.deliveryDays} />
                  <MiniStat icon={Check} label="Stock" value={`${product.stock}`} />
                  <MiniStat icon={ShieldCheck} label="SKU" value={product.sku} />
                  <MiniStat icon={Factory} label="Supplier" value={supplier?.name ?? product.supplierId} />
                  <MiniStat icon={Tag} label="Category" value={category?.name ?? product.categoryId} />
                </dl>
              </div>

              <div className="mt-6">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => { dispatch({ type: "ADD_TO_CART", productId: product.id, quantity: product.moq }); toast.success("Added to cart"); setQuickOpen(false); }}
                >
                  <ShoppingCart className="size-4 mr-2" /> Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded border border-border bg-card p-2">
      <Icon className="size-3.5 mt-0.5 text-primary" />
      <div>
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xs font-semibold">{value}</div>
      </div>
    </div>
  );
}
