import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
      {children}
    </p>
  );
}

export function SquareBullet() {
  return <span className="mt-2 h-1.5 w-1.5 bg-accent shrink-0" />;
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-slate-700">
          <SquareBullet />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-4 border-b-2 border-industrial pb-4">
      <span className="font-display text-4xl font-extrabold text-accent leading-none">{num}</span>
      <h2 className="font-display text-2xl md:text-3xl font-extrabold uppercase text-industrial tracking-tight">
        {title}
      </h2>
    </div>
  );
}

export function Section({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-12">
      <SectionHeader num={num} title={title} />
      <div className="max-w-4xl space-y-5 text-[15px] leading-relaxed text-slate-700">
        {children}
      </div>
    </section>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-lg font-bold uppercase tracking-wide text-industrial mt-4">
      {children}
    </h3>
  );
}

export function KeyTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-industrial text-white">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs uppercase tracking-wider font-bold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-4 py-3 border-t border-slate-200 text-slate-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function generatePlaceholderPdf(title: string, subtitle: string) {
  const doc = new jsPDF();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 60, "F");
  doc.setTextColor(249, 115, 22);
  doc.setFontSize(10);
  doc.text("MEGAHAUS INDUSTRIAL HUB", 15, 20);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(title, 15, 38);
  doc.setFontSize(11);
  doc.setTextColor(200, 200, 200);
  doc.text(subtitle, 15, 50);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.text("This is a placeholder PDF generated from the MegaHaus portfolio.", 15, 80);
  doc.text("Full version available on request: corporate@megahaus-hub.com", 15, 90);
  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function downloadPdf(title: string, subtitle: string) {
  generatePlaceholderPdf(title, subtitle);
}

export function DocHeader({
  volume,
  pages,
  title,
  subtitle,
  pdfTitle,
}: {
  volume: string;
  pages: string;
  title: string;
  subtitle: string;
  pdfTitle: string;
}) {
  return (
    <header className="bg-industrial text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <Link
          to="/portfolio"
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent hover:text-white"
        >
          ← Portfolio
        </Link>
        <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
          Volume {volume} · {pages} Pages
        </p>
        <h1 className="mt-4 font-display text-5xl md:text-7xl font-extrabold leading-[0.95] tracking-tight">
          {title}
        </h1>
        <p className="mt-6 text-lg text-slate-300 max-w-2xl">{subtitle}</p>
        <button
          onClick={() => downloadPdf(title, subtitle)}
          className="mt-10 inline-flex items-center gap-2 bg-accent text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-accent/90"
        >
          <Download className="size-4" /> Download Full PDF
        </button>
      </div>
    </header>
  );
}

export function DocCTA({ pdfTitle, subtitle }: { pdfTitle: string; subtitle: string }) {
  return (
    <section className="border-t-4 border-industrial mt-16">
      <div className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <Eyebrow>Take it with you</Eyebrow>
          <p className="mt-2 font-display text-2xl font-extrabold text-industrial">
            Download the full PDF version
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <button
            onClick={() => downloadPdf(pdfTitle, subtitle)}
            className="inline-flex items-center gap-2 bg-industrial text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-industrial/90"
          >
            <Download className="size-4" /> Download PDF
          </button>
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 border-2 border-industrial text-industrial px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-accent hover:text-white hover:border-accent"
          >
            All Documents
          </Link>
        </div>
      </div>
    </section>
  );
}
