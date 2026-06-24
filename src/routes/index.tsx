import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { categories } from "@/data/categories";
import { getFeaturedProducts } from "@/data/products";
import { getBrand } from "@/data/brands";
import { brands } from "@/data/brands";
import { formatBDT } from "@/lib/format";
import heroPort from "@/assets/hero-port.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MegaHaus Industrial Hub — Global Industrial Products, Delivered to Bangladesh" },
      { name: "description", content: "B2B marketplace sourcing Bosch, Siemens, Makita, ABB and more for Bangladesh's factories, engineers and contractors. Request quotations on industrial machinery, tools and automation." },
      { property: "og:title", content: "MegaHaus Industrial Hub" },
      { property: "og:description", content: "Global industrial products, delivered to Bangladesh." },
      { property: "og:image", content: heroPort },
    ],
  }),
  component: HomePage,
});

const categoryCounts: Record<string, string> = {
  tools: "3,240",
  machinery: "1,860",
  electrical: "2,510",
  construction: "4,120",
  automotive: "1,480",
};

const featureBadges = ["BESTSELLER", "PRO", "STOCK", "NEW", "TOP", "HOT", "PRO", "STOCK"];

function HomePage() {
  const featured = getFeaturedProducts().slice(0, 8);
  const marquee = [...brands, ...brands];

  return (
    <PublicLayout>
      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden bg-industrial text-white">
        <img
          src={heroPort}
          alt="Industrial cargo port at sunset with cranes and container ship"
          className="absolute inset-0 size-full object-cover opacity-55"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-industrial via-industrial/85 to-industrial/30" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-industrial via-transparent to-industrial/60" aria-hidden />

        {/* Corner tickers */}
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex items-center justify-between px-6 text-[11px] font-mono uppercase tracking-[0.2em] text-white/60 md:px-10">
          <span>◢ MH—01 / Port of Chittagong</span>
          <span>EST. 2026 ◣</span>
        </div>

        <div className="container relative z-10 mx-auto px-6 pb-20 pt-32 md:px-10 md:pb-28 md:pt-40 lg:pb-36 lg:pt-48">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl"
          >
            <div className="mb-8 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
              <span className="h-px w-10 bg-accent" />
              B2B Industrial Marketplace
            </div>

            <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl lg:text-[6.5rem]">
              Global{" "}
              <span className="text-primary">Industrial</span>
              <br />
              Products, Delivered
              <br />
              to{" "}
              <span className="relative inline-block">
                Bangladesh
                <span className="absolute -bottom-2 left-0 h-1.5 w-full bg-accent md:-bottom-3 md:h-2" />
              </span>
              <span className="text-primary">.</span>
            </h1>

            <p className="mt-10 max-w-xl text-base text-white/70 md:text-lg">
              Source verified machinery, tools, electrical and construction supplies from Europe, Japan and the US — landed at Chittagong, cleared, and delivered.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-14 rounded-none bg-primary px-7 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90">
                <Link to="/products">Browse Products <ArrowRight className="ml-3 size-4" /></Link>
              </Button>
              <Button asChild size="lg" className="h-14 rounded-none bg-accent px-7 text-sm font-bold uppercase tracking-wider text-accent-foreground hover:bg-accent/90">
                <Link to="/quotation"><FileText className="mr-3 size-4" /> Request Quotation</Link>
              </Button>
            </div>

            <div className="mt-16 grid max-w-3xl grid-cols-2 gap-px border border-white/10 bg-white/5 backdrop-blur-sm sm:grid-cols-4">
              {[
                { n: "12k+", l: "SKUs" },
                { n: "480", l: "Brands" },
                { n: "38", l: "Countries" },
                { n: "7d", l: "Avg. Delivery" },
              ].map((s) => (
                <div key={s.l} className="bg-industrial/70 p-5">
                  <div className="font-display text-3xl font-bold text-white md:text-4xl">{s.n}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ BRAND MARQUEE ============ */}
      <section className="border-y border-border bg-industrial py-6 text-white">
        <div className="mb-4 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
          <span className="text-accent">◢</span>
          Trusted by 480+ verified manufacturers worldwide
          <span className="hidden text-white/30 md:inline">·</span>
          <span className="hidden text-white/40 md:inline">Authorized distributors only</span>
        </div>
        <div className="relative overflow-hidden">
          <div className="flex animate-marquee gap-16 whitespace-nowrap">
            {marquee.map((b, i) => (
              <span key={`${b.id}-${i}`} className="font-display text-2xl font-bold tracking-widest text-white/40 hover:text-white transition-colors">
                {b.logoText.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="bg-background py-20 md:py-28">
        <div className="container mx-auto px-6 md:px-10">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">— 01 / Categories</div>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Shop by category</h2>
            </div>
            <Link to="/products" className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-foreground hover:text-primary">
              View all {categories.length} categories
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="grid gap-px bg-border md:grid-cols-3 lg:grid-cols-5">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                to="/products"
                search={{ category: c.id } as never}
                className="group relative flex flex-col justify-between bg-card p-6 transition-colors hover:bg-secondary"
              >
                <div className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-16">
                  <div className="font-display text-2xl font-bold tracking-tight">{c.name}</div>
                  <div className="mt-2 font-mono text-xs text-muted-foreground">{categoryCounts[c.id] ?? "—"} items</div>
                </div>
                <ArrowUpRight className="absolute right-5 top-5 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ VALUE PROPS ============ */}
      <section className="bg-secondary py-20 md:py-28">
        <div className="container mx-auto px-6 md:px-10">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Direct from source", d: "No middlemen. Authorized distributors in 38 countries." },
              { t: "Quality verified", d: "Every supplier audited. Genuine products guaranteed." },
              { t: "Door delivery", d: "Customs cleared and delivered across Bangladesh." },
              { t: "Local agents", d: "Bangla-speaking procurement experts on-call 24/7." },
            ].map((v, i) => (
              <div key={v.t} className="border-t border-foreground/20 pt-6">
                <div className="mb-6 font-mono text-[11px] tracking-[0.25em] text-primary">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="font-display text-2xl font-bold tracking-tight">{v.t}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURED CATALOGUE ============ */}
      <section className="bg-background py-20 md:py-28">
        <div className="container mx-auto px-6 md:px-10">
          <div className="mb-12 max-w-3xl">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">— 02 / Featured Catalogue</div>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl">Built for industry.<br />Priced for scale.</h2>
          </div>

          <div className="mb-6 flex items-center justify-between border-b border-border pb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>Showing {featured.length} of 12,480</span>
            <span>Sort: Featured</span>
          </div>

          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p, i) => {
              const brand = getBrand(p.brandId);
              const badge = featureBadges[i];
              return (
                <Link
                  key={p.id}
                  to="/products/$productId"
                  params={{ productId: p.id }}
                  className="group flex flex-col bg-card transition-colors hover:bg-secondary"
                >
                  <div className="relative aspect-square overflow-hidden bg-secondary">
                    <img src={p.image} alt={p.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    {badge && (
                      <span className="absolute left-3 top-3 bg-primary px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-primary-foreground">
                        {badge}
                      </span>
                    )}
                    <span className="absolute right-3 top-3 bg-black/70 px-2 py-1 font-mono text-[10px] tracking-widest text-white">
                      MH-{1000 + i * 311}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      <span className="font-bold text-foreground">{brand?.logoText}</span>
                      <span>{p.country}</span>
                    </div>
                    <h3 className="mt-3 font-display text-base font-bold leading-tight line-clamp-2">{p.name}</h3>
                    <div className="mt-auto pt-6">
                      <div className="font-display text-xl font-bold">{formatBDT(p.price)}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">/ unit · MOQ {p.moq}</div>
                      <div className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                        View Quote <ArrowRight className="size-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Button asChild variant="outline" size="lg" className="h-12 rounded-none border-foreground px-6 font-mono text-xs uppercase tracking-[0.2em]">
              <Link to="/products">Load more products →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============ QUOTATION CTA ============ */}
      <section className="relative overflow-hidden bg-industrial py-20 text-white md:py-28">
        <div className="absolute inset-0 industrial-grid opacity-20" aria-hidden />
        <div className="container relative mx-auto px-6 md:px-10">
          <div className="grid items-end gap-12 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-accent">— Procurement at scale</div>
              <h2 className="font-display text-4xl font-bold leading-[1] tracking-tight md:text-6xl">
                Need 10 units or 10,000?<br />
                Get a quotation in <span className="text-accent">24 hours.</span>
              </h2>
              <p className="mt-6 max-w-xl text-white/70">
                Tell us what you need. Our agents source it, negotiate it, and ship it — landed at your facility.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-14 rounded-none bg-primary px-7 text-sm font-bold uppercase tracking-wider hover:bg-primary/90">
                <Link to="/quotation">Request Quotation <ArrowRight className="ml-3 size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-none border-white/30 bg-transparent px-7 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/10">
                <Link to="/contact">Talk to an Agent</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
