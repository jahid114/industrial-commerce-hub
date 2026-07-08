import { Package, Truck, Check, ShieldCheck, ShoppingCart, Factory, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Product } from "@/data/types";
import { getBrand } from "@/data/brands";
import { getCategory } from "@/data/categories";
import { getSupplier } from "@/data/suppliers";
import { formatBDT } from "@/lib/format";
import { useStore } from "@/lib/store";
import { getAgentPrice, canSeeAgentPrice } from "@/lib/pricing";
import { toast } from "sonner";

export function ProductQuickView({ product, open, onOpenChange }: { product: Product | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { dispatch, user } = useStore();
  const showAgent = canSeeAgentPrice(user?.role);
  if (!product) return null;
  const brand = getBrand(product.brandId);
  const category = getCategory(product.categoryId);
  const supplier = getSupplier(product.supplierId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                {product.subcategory && <Badge variant="secondary" className="text-[10px]">{product.subcategory}</Badge>}
              </div>
              <DialogTitle className="font-display text-2xl leading-tight">{product.name}</DialogTitle>
              <DialogDescription>{product.shortDescription}</DialogDescription>
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {product.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px] font-normal"><Tag className="size-2.5 mr-1" />{t}</Badge>
                  ))}
                </div>
              )}
            </DialogHeader>

            <div className="my-4 border-y border-border py-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Starting from</div>
              <div className="font-display text-2xl font-bold text-primary">{formatBDT(product.price)}<span className="ml-1 text-xs font-normal text-muted-foreground">/ unit</span></div>
              {showAgent && (
                <div className="mt-2 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-3 py-1.5">
                  <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">Agent</span>
                  <span className="text-sm font-semibold">{formatBDT(getAgentPrice(product))}</span>
                </div>
              )}
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
                onClick={() => { dispatch({ type: "ADD_TO_CART", productId: product.id, quantity: product.moq }); toast.success("Added to cart"); onOpenChange(false); }}
              >
                <ShoppingCart className="size-4 mr-2" /> Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
