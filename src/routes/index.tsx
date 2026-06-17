import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, Globe, Headset, Wrench, Cog, Zap, HardHat, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProductCard } from "@/components/product/ProductCard";
import { BrandStrip } from "@/components/BrandStrip";
import { SectionHeading } from "@/components/SectionHeading";
import { categories } from "@/data/categories";
import { getFeaturedProducts } from "@/data/products";

const iconMap = { Wrench, Cog, Zap, HardHat, Car } as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MegaHaus Industrial Hub — Global Industrial Products, Delivered to Bangladesh" },
      { name: "description", content: "B2B marketplace sourcing Bosch, Siemens, Makita, ABB and more for Bangladesh's factories, engineers and contractors. Request quotations on industrial machinery, tools and automation." },
      { property: "og:title", content: "MegaHaus Industrial Hub" },
      { property: "og:description", content: "Global industrial products, delivered to Bangladesh." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <PublicLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-industrial text-industrial-foreground">
        <div className="absolute inset-0 industrial-grid opacity-30" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-industrial via-industrial/95 to-transparent" aria-hidden />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1600&q=80&auto=format&fit=crop')" }}
          aria-hidden
        />
        <div className="container relative mx-auto grid gap-8 px-4 py-20 md:grid-cols-2 md:py-28 lg:py-36">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex flex-col justify-center">
            <div className="mb-5 inline-flex items-center gap-2 self-start border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" /> Industrial Marketplace · BD
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.05] md:text-5xl lg:text-6xl">
              Global Industrial Products,<br />
              <span className="text-primary">Delivered to Bangladesh.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-white/80 md:text-lg">
              Source genuine machinery, tools and automation from Bosch, Siemens, Makita, ABB and 50+ global brands — with quotation, customs and last-mile delivery handled.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-sm font-bold uppercase tracking-wide">
                <Link to="/products">Browse Products <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-sm font-bold uppercase tracking-wide border-accent text-accent-foreground bg-accent hover:bg-accent/90">
                <Link to="/quotation">Request Quotation</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6 max-w-md">
              {[
                { n: "180M+", l: "Customers reached" },
                { n: "50+", l: "Global brands" },
                { n: "1.2K+", l: "Industrial SKUs" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-2xl font-bold text-accent">{s.n}</div>
                  <div className="text-xs text-white/60">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }} className="hidden md:flex items-center justify-center">
            <div className="grid w-full max-w-md grid-cols-2 gap-3">
              {featured.slice(0, 4).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={`relative overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur ${i % 2 === 0 ? "translate-y-4" : ""}`}
                >
                  <div className="aspect-square overflow-hidden">
                    <img src={p.image} alt={p.name} className="size-full object-cover" />
                  </div>
                  <div className="p-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-accent">{p.country}</div>
                    <div className="line-clamp-1 text-xs font-medium text-white">{p.name}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <BrandStrip />

      {/* CATEGORIES */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Product Catalog" title="Shop by Category" description="Tools, machinery, automation, construction & automotive — for every industrial discipline." />
            <Button asChild variant="ghost" className="font-semibold"><Link to="/products">View All <ArrowRight className="ml-2 size-4" /></Link></Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((c, i) => {
              const Icon = iconMap[c.icon as keyof typeof iconMap];
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to="/products"
                    search={{ category: c.id } as never}
                    className="group flex h-full flex-col rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-md"
                  >
                    <div className="mb-4 flex size-12 items-center justify-center bg-secondary text-industrial transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="font-display text-lg font-bold">{c.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{c.subcategories.join(" · ")}</p>
                    <span className="mt-auto pt-4 text-xs font-bold uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">Explore →</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Top Picks" title="Featured Products" description="Best-selling machinery and tools sourced for Bangladesh's growing industrial sector." />
            <Button asChild variant="outline" className="font-semibold"><Link to="/products">All Products <ArrowRight className="ml-2 size-4" /></Link></Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHeading eyebrow="Industrial Solutions" title="Built for Every Industry" description="Tailored sourcing programs for the sectors that drive Bangladesh's economy." align="center" />
          <div className="mt-12 grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Textile & Garments", desc: "Cutting tables, sewing automation, dyeing line spares.", img: "1532601224476-15c79f2f7a51" },
              { title: "Marine & Shipping", desc: "Port equipment, repair tools, ship maintenance supplies.", img: "1605281317010-fe5ffe798166" },
              { title: "Construction", desc: "Concrete tools, lasers, fastening systems, scaffolding.", img: "1504917595217-d4dc5ebe6122" },
              { title: "Power & Automation", desc: "PLCs, drives, contactors, switchgear, instrumentation.", img: "1581092160562-40aa08e78837" },
            ].map((ind) => (
              <Link to="/industries" key={ind.title} className="group relative aspect-[4/3] overflow-hidden bg-industrial">
                <img src={`https://images.unsplash.com/photo-${ind.img}?w=600&q=80&auto=format&fit=crop`} alt={ind.title} className="size-full object-cover opacity-50 transition-all duration-500 group-hover:scale-105 group-hover:opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-industrial via-industrial/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h3 className="font-display text-xl font-bold">{ind.title}</h3>
                  <p className="mt-1 text-xs text-white/70">{ind.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER CTA */}
      <section className="bg-industrial py-16 text-industrial-foreground md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <SectionHeading eyebrow="Partner with MegaHaus" title="Reach the Bangladesh Market" description="Join our supplier and partner network to distribute your products to 180+ million customers across South Asia's fastest-growing industrial economy." />
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="font-bold uppercase"><Link to="/suppliers">Become a Supplier <ArrowRight className="ml-2 size-4" /></Link></Button>
                <Button asChild size="lg" variant="outline" className="bg-accent text-accent-foreground border-accent hover:bg-accent/90 font-bold uppercase"><Link to="/partners">Invest with Us</Link></Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/10">
              {[
                { Icon: Globe, title: "180M+ Customers", desc: "Direct access to Bangladesh's industrial buyers." },
                { Icon: Truck, title: "Distribution Network", desc: "Customs, warehousing & last-mile in one stack." },
                { Icon: ShieldCheck, title: "Verified Buyers", desc: "Vetted factories, contractors and engineers." },
                { Icon: Headset, title: "Local Support", desc: "Bangla-speaking sales agents on the ground." },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="bg-industrial p-6">
                  <Icon className="size-7 text-accent" />
                  <div className="mt-3 font-display text-lg font-bold">{title}</div>
                  <p className="mt-1 text-sm text-white/70">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
