import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Mail, Phone, MapPin } from "lucide-react";
import { brands } from "@/data/brands";

export function PublicFooter() {
  return (
    <footer className="bg-industrial text-industrial-foreground">
      {/* Brand strip */}
      <div className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs uppercase tracking-widest text-white/60 mb-4">Authorized partners with leading global brands</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {brands.map((b) => (
              <span key={b.id} className="font-display text-xl font-bold tracking-wider text-white/70 hover:text-accent transition-colors">
                {b.logoText}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <Logo variant="light" />
          <p className="mt-4 text-sm text-white/70 leading-relaxed">
            Bangladesh's first integrated industrial marketplace. Sourcing global-quality machinery and tools for factories, engineers and contractors.
          </p>
          <div className="mt-6 space-y-2 text-sm text-white/70">
            <p className="flex items-start gap-2"><MapPin className="size-4 shrink-0 mt-0.5 text-accent" /> House No. 12, Road No. 1, Lane No. 3, Halishahar Housing Estate, Chittagong</p>
            <p className="flex items-center gap-2"><Phone className="size-4 text-accent" /> +880 1978 981818</p>
            <p className="flex items-center gap-2"><Mail className="size-4 text-accent" /> info@megahaus.com</p>
          </div>
        </div>

        <FooterCol title="Marketplace" links={[
          ["Browse Products", "/products"],
          ["Industries", "/industries"],
          ["Request Quotation", "/quotation"],
          ["Compare Products", "/compare"],
        ]} />

        <FooterCol title="Partners" links={[
          ["Supplier Partnership", "/suppliers"],
          ["Agent Program", "/agents"],
          ["Investment", "/partners"],
          ["About MegaHaus", "/about"],
        ]} />

        <FooterCol title="Customer" links={[
          ["My Account", "/account"],
          ["Order History", "/account/orders"],
          ["Quotations", "/account/quotations"],
          ["Contact Support", "/contact"],
        ]} />
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/60 md:flex-row">
          <p>© {new Date().getFullYear()} MegaHaus Industrial Hub. A Project by Protocol Cashmere Limited.</p>
          <div className="flex gap-5">
            <Link to="/about" className="hover:text-accent">Terms</Link>
            <Link to="/about" className="hover:text-accent">Privacy</Link>
            <Link to="/contact" className="hover:text-accent">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-accent">{title}</h4>
      <ul className="space-y-2 text-sm text-white/70">
        {links.map(([label, to]) => (
          <li key={to}><Link to={to} className="hover:text-white">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
