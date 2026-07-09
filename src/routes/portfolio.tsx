import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Download, ArrowRight } from "lucide-react";
import { Eyebrow, downloadPdf } from "@/components/portfolio/DocChrome";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — MegaHaus Industrial Hub" },
      {
        name: "description",
        content:
          "Corporate Profile, Bangladesh Market Potential Report and Strategic Vision 2033 — downloadable PDFs and on-site briefings for foreign manufacturers, distributors and investors.",
      },
      { property: "og:title", content: "MegaHaus Portfolio 2025–2033" },
      {
        property: "og:description",
        content:
          "Three-part portfolio: Corporate Profile, Market Potential Report, Strategic Vision 2033.",
      },
    ],
  }),
  component: PortfolioHub,
});

const stats = [
  { label: "Volumes", value: "3" },
  { label: "Pages", value: "45–65" },
  { label: "Sectors", value: "8" },
  { label: "Horizon", value: "2033" },
];

const documents = [
  {
    num: "01",
    title: "Corporate Profile",
    pages: "20–30",
    audience: "Foreign Manufacturers · Distributors · Investors",
    oneLiner:
      "Company introduction, vision & mission, engineering experience, services, international partnership program, group companies, showroom model and contact.",
    chips: [
      "Who We Are",
      "Why Bangladesh",
      "Engineering Strength",
      "Service Platform",
      "Target Industries",
      "Partnership Program",
      "Group Companies",
      "Showroom & HQ",
      "Contact",
    ],
    to: "/portfolio/corporate-profile",
    pdfTitle: "Corporate Profile",
    pdfSubtitle: "For foreign manufacturers, distributors and investors",
  },
  {
    num: "02",
    title: "Market Potential Report",
    pages: "15–20",
    audience: "Foreign Companies Only",
    oneLiner:
      "Bangladesh industrial market sizing across textile, cement, steel, power, food, pharma, shipbuilding and automation — with charts, growth rates and sector outlooks.",
    chips: [
      "Executive Summary",
      "Textile & RMG",
      "Cement",
      "Steel",
      "Power",
      "Food Processing",
      "Pharmaceutical",
      "Shipbuilding",
      "Industrial Automation",
    ],
    to: "/portfolio/market-potential",
    pdfTitle: "Market Potential Report",
    pdfSubtitle: "Bangladesh Industrial Sectors · 2026–2030",
  },
  {
    num: "03",
    title: "Strategic Vision 2033",
    pages: "10–15",
    audience: "Strategic Partners · Long-Term Investors",
    oneLiner:
      "Vision 2033, Industry 4.0 adoption, smart factory, AI & automation, green energy & Net-Zero carbon, international distribution hub, dealer network roadmap and brand identity guide.",
    chips: [
      "Vision 2033",
      "Industry 4.0",
      "Smart Factory",
      "AI & Automation",
      "Green Energy",
      "Distribution Hub",
      "Dealer Network",
      "Brand Color Guide",
    ],
    to: "/portfolio/strategic-vision-2033",
    pdfTitle: "Strategic Vision 2033",
    pdfSubtitle: "Industry 4.0 · Smart Factory · Net-Zero · Global Hub",
  },
];


function PortfolioHub() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-industrial text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12">
          <div>
            <Eyebrow>Corporate Portfolio · 2025–2033</Eyebrow>
            <h1 className="mt-6 font-display text-5xl md:text-7xl font-extrabold leading-[0.95] tracking-tight">
              Three documents.
              <br />
              <span className="text-accent">One industrial vision.</span>
            </h1>
            <p className="mt-8 text-lg text-slate-300 max-w-xl">
              MegaHaus Industrial Hub presents its 2025–2033 corporate portfolio in three
              structured volumes — engineered for foreign manufacturers, global distributors and
              strategic investors evaluating Bangladesh.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-700 self-start">
            {stats.map((s) => (
              <div key={s.label} className="bg-industrial p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                  {s.label}
                </p>
                <p className="mt-2 font-display text-4xl font-extrabold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Document list */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <Eyebrow>The Portfolio</Eyebrow>
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold text-industrial">
            Three volumes for three audiences
          </h2>
          <div className="mt-12 flex flex-col gap-px bg-slate-200 border border-slate-200">
            {documents.map((d) => (
              <article
                key={d.num}
                className="bg-white p-8 md:p-10 grid md:grid-cols-[80px_1fr_auto] gap-8 items-start"
              >
                <div>
                  <p className="font-display text-6xl font-extrabold text-accent leading-none">
                    {d.num}
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                    {d.pages} pages
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-2xl md:text-3xl font-extrabold text-industrial">
                    {d.title}
                  </h3>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
                    {d.audience}
                  </p>
                  <p className="mt-4 text-slate-700 max-w-3xl leading-relaxed">{d.oneLiner}</p>
                  <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                    {d.chips.map((c) => (
                      <li
                        key={c}
                        className="border-l-2 border-accent pl-2 text-[11px] font-bold uppercase tracking-wider text-slate-600"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3 md:items-end">
                  <Link
                    to={d.to as "/portfolio/corporate-profile"}
                    className="inline-flex items-center gap-2 bg-industrial text-white px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-industrial/90 whitespace-nowrap"
                  >
                    Read Online <ArrowRight className="size-4" />
                  </Link>
                  <button
                    onClick={() => downloadPdf(d.pdfTitle, d.pdfSubtitle)}
                    className="inline-flex items-center gap-2 border-2 border-industrial text-industrial px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-accent hover:text-white hover:border-accent whitespace-nowrap"
                  >
                    <Download className="size-4" /> Download PDF
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
