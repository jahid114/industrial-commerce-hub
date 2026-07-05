import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ShoppingCart, FileText, Check, Truck, Package, ShieldCheck, GitCompare, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getProduct } from "@/data/products";
import { getBrand } from "@/data/brands";
import { getCategory } from "@/data/categories";
import { getSupplier } from "@/data/suppliers";
import { formatBDT } from "@/lib/format";
import { useStore } from "@/lib/store";
import { getAgentPrice, canSeeAgentPrice } from "@/lib/pricing";
import { toast } from "sonner";

export const Route = createFileRoute("/portal-customer/catalog/$productId")({
  loader: ({ params }) => {
    const product = getProduct(params.productId);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `${loaderData.product.name} — Portal` }] : [],
  }),
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <h1 className="font-display text-2xl font-bold">Product not found</h1>
      <Button asChild className="mt-6"><Link to="/portal-customer/catalog">Back to catalog</Link></Button>
    </div>
  ),
  component: PortalProductDetail,
});

function PortalProductDetail() {
  const { product } = Route.useLoaderData();
  const brand = getBrand(product.brandId);
  const category = getCategory(product.categoryId);
  const supplier = getSupplier(product.supplierId);
  const { dispatch, wishlist, compare, user } = useStore();
  const showAgent = canSeeAgentPrice(user?.role);
  const navigate = useNavigate();
  const [qty, setQty] = useState(product.moq);
  const [activeImage, setActiveImage] = useState(0);
  const inWishlist = wishlist.includes(product.id);
  const inCompare = compare.includes(product.id);

  return (
    <div className="space-y-6">
      <Link to="/portal-customer/catalog" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4 mr-1" /> Back to catalog
      </Link>

      <div className="rounded-lg border border-border bg-card p-4 lg:p-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden border border-border bg-spec rounded-md">
              <img src={product.gallery[activeImage] ?? product.image} alt={product.name} className="size-full object-cover" />
            </div>
            {product.gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.gallery.map((img: string, i: number) => (
                  <button key={i} onClick={() => setActiveImage(i)} className={`aspect-square overflow-hidden rounded border-2 ${activeImage === i ? "border-primary" : "border-border"}`}>
                    <img src={img} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-bold uppercase">{brand?.name}</Badge>
              <Badge variant="outline">{product.country}</Badge>
              {category && <Badge variant="secondary">{category.name}</Badge>}
              {!product.featured && (
                <Badge className="bg-industrial text-industrial-foreground gap-1"><Lock className="size-3" /> Portal-only</Badge>
              )}
              <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight">{product.name}</h1>
            <p className="mt-3 text-muted-foreground">{product.shortDescription}</p>

            <div className="my-6 border-y border-border py-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Your price</div>
              <div className="font-display text-4xl font-bold text-primary">{formatBDT(product.price)}<span className="ml-2 text-sm font-normal text-muted-foreground">/ unit</span></div>
              {showAgent && (
                <div className="mt-3 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-3 py-2">
                  <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">Agent</span>
                  <span className="text-sm font-semibold">{formatBDT(getAgentPrice(product))}</span>
                </div>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm mb-6">
              <Stat icon={Package} label="MOQ" value={`${product.moq} units`} />
              <Stat icon={Truck} label="Delivery" value={product.deliveryDays} />
              <Stat icon={Check} label="Stock" value={`${product.stock} available`} />
              <Stat icon={ShieldCheck} label="Origin" value={product.country} />
            </dl>

            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center border border-border rounded-md">
                <button onClick={() => setQty(Math.max(product.moq, qty - 1))} className="px-3 py-1.5 hover:bg-secondary">−</button>
                <input type="number" value={qty} onChange={(e) => setQty(Math.max(product.moq, parseInt(e.target.value) || product.moq))} className="w-16 border-x border-border px-2 py-1.5 text-center" />
                <button onClick={() => setQty(qty + 1)} className="px-3 py-1.5 hover:bg-secondary">+</button>
              </div>
              <span className="text-xs text-muted-foreground">Min: {product.moq}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" onClick={() => { dispatch({ type: "ADD_TO_CART", productId: product.id, quantity: qty }); toast.success(`${qty} × ${product.name} added to cart`); }} className="h-12 font-bold uppercase">
                <ShoppingCart className="size-4 mr-2" /> Add to Cart
              </Button>
              <Button size="lg" onClick={() => navigate({ to: "/quotation", search: { productId: product.id } as never })} className="h-12 font-bold uppercase bg-accent text-accent-foreground hover:bg-accent/90">
                <FileText className="size-4 mr-2" /> Request Quote
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" onClick={() => { dispatch({ type: "TOGGLE_WISHLIST", productId: product.id }); toast.success(inWishlist ? "Removed from wishlist" : "Saved to wishlist"); }}>
                <Heart className="size-4 mr-2" fill={inWishlist ? "currentColor" : "none"} /> {inWishlist ? "In Wishlist" : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { dispatch({ type: "TOGGLE_COMPARE", productId: product.id }); toast.success(inCompare ? "Removed from compare" : "Added to compare"); }}>
                <GitCompare className="size-4 mr-2" /> {inCompare ? "In Compare" : "Compare"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 lg:p-6">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="supplier">Supplier</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-4">
            <p className="leading-relaxed text-foreground/90">{product.description}</p>
          </TabsContent>
          <TabsContent value="specs" className="mt-4">
            <table className="w-full text-sm border border-border rounded-md overflow-hidden">
              <tbody>
                {product.specs.map((s: { label: string; value: string }, i: number) => (
                  <tr key={s.label} className={i % 2 === 0 ? "bg-spec" : ""}>
                    <td className="w-1/3 border-r border-border px-5 py-3 font-semibold text-muted-foreground">{s.label}</td>
                    <td className="px-5 py-3">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
          <TabsContent value="supplier" className="mt-4">
            {supplier && (
              <div>
                <h3 className="font-display text-xl font-bold">{supplier.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{supplier.country} · Supplier since {new Date(supplier.since).getFullYear()}</p>
                <div className="mt-4 space-y-1 text-sm">
                  <p><strong>Contact:</strong> {supplier.contactName}</p>
                  <p><strong>Email:</strong> {supplier.email}</p>
                  <p><strong>Rating:</strong> ⭐ {supplier.rating}/5</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <Icon className="size-4 mt-0.5 text-primary" />
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}
