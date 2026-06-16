import { brands } from "@/data/brands";

export function BrandStrip() {
  return (
    <section className="border-y border-border bg-card py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 items-center gap-6 sm:grid-cols-4 lg:grid-cols-8">
          {brands.map((b) => (
            <div key={b.id} className="text-center font-display text-xl font-bold tracking-wider text-muted-foreground hover:text-industrial transition-colors">
              {b.logoText}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
