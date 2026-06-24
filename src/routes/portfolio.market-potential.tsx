import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  DocHeader,
  DocCTA,
  Section,
  Bullets,
  KeyTable,
  Eyebrow,
} from "@/components/portfolio/DocChrome";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/portfolio/market-potential")({
  head: () => ({
    meta: [
      { title: "Bangladesh Industrial Market Potential 2026–2030 — MegaHaus" },
      {
        name: "description",
        content:
          "Sector-by-sector market sizing across textile, cement, steel, power, food, pharma, shipbuilding and industrial automation in Bangladesh.",
      },
      { property: "og:title", content: "Bangladesh Market Potential Report 2026" },
      {
        property: "og:description",
        content:
          "USD 80B+ industrial opportunity. Foreign manufacturer and investor reference.",
      },
    ],
  }),
  component: MarketPotential,
});

const sectorData = [
  { name: "RMG", value: 50 },
  { name: "Power", value: 10 },
  { name: "Food", value: 5 },
  { name: "Steel", value: 4 },
  { name: "Pharma", value: 4 },
  { name: "Cement", value: 3 },
  { name: "Shipbuilding", value: 1.5 },
  { name: "Automation", value: 1 },
];

const equipmentData = [
  { year: "2024", value: 70 },
  { year: "2026", value: 80 },
  { year: "2028", value: 95 },
  { year: "2030", value: 115 },
];

const tooltipStyle = {
  backgroundColor: "#0F172A",
  border: "none",
  color: "#fff",
  fontSize: 12,
};

function MarketPotential() {
  return (
    <PublicLayout>
      <DocHeader
        volume="02"
        pages="15–20"
        title="Market Potential Report"
        subtitle="Bangladesh Industrial Sectors · 2026–2030"
        pdfTitle="Market Potential Report"
      />

      <div className="max-w-4xl mx-auto px-6">
        <Section num="00" title="Executive Summary">
          <p>
            Bangladesh is positioned as the next major industrial growth market in Asia. Combined
            addressable market across the 8 verticals covered in this report exceeds{" "}
            <strong>USD 80 billion</strong>, growing <strong>8–12% annually</strong> through 2030.
          </p>

          <div className="border border-slate-200 p-4 sm:p-6 mt-6">
            <Eyebrow>Chart 1 · Sector Market Size · USD Billions</Eyebrow>
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#0F172A" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#0F172A" }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(249,115,22,0.1)" }} />
                  <Bar dataKey="value" fill="#F97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6">
            <KeyTable
              headers={["Sector", "2026 Size", "CAGR", "Outlook"]}
              rows={[
                ["RMG / Textile", "50B+", "7–9%", "Diversifying into MMF"],
                ["Cement", "3B+", "6–8%", "Infrastructure-led"],
                ["Steel", "4B+", "9–11%", "Capacity doubling by 2030"],
                ["Power", "10B+", "8–10%", "Renewables + nuclear"],
                ["Food Processing", "5B+", "10–12%", "Domestic + halal export"],
                ["Pharmaceutical", "4B+", "12–14%", "WHO-PQ exporters rising"],
                ["Shipbuilding", "1.5B+", "9%", "Export-focused yards"],
                ["Industrial Automation", "1B+", "15%+", "Greenfield 4.0 adoption"],
              ]}
            />
          </div>

          <div className="border border-slate-200 p-4 sm:p-6 mt-6">
            <Eyebrow>Chart 2 · Total Industrial Equipment Market · USD Billions</Eyebrow>
            <div className="h-60 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equipmentData}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#0F172A" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#0F172A" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0F172A"
                    strokeWidth={3}
                    dot={{ fill: "#F97316", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        <Section num="01" title="Textile & RMG">
          <p>
            Bangladesh is the 2nd largest apparel exporter globally with USD 47B+ in 2024 exports.
            The sector is rapidly upgrading from basic CMT to high-value, sustainable production
            — driving CapEx in spinning, dyeing, finishing and waste-water automation.
          </p>
          <Bullets
            items={[
              "3,500+ export-oriented factories",
              "USD 50B export target by 2026",
              "Demand: dyeing automation, ETP, energy monitoring, MMF spinning",
            ]}
          />
        </Section>

        <Section num="02" title="Cement">
          <p>
            USD 3B+ market with 35+ producers serving infrastructure megaprojects (Padma Bridge,
            Metro, Karnaphuli Tunnel). Per-capita consumption still 40% below India — long runway.
          </p>
          <Bullets
            items={[
              "Installed clinker capacity expanding 6–8% / yr",
              "Demand: vertical roller mills, process control, dust collection",
            ]}
          />
        </Section>

        <Section num="03" title="Steel">
          <p>
            Domestic steel demand projected to double by 2030. Current USD 4B+ market driven by
            construction and shipbuilding. New induction furnace and re-rolling capacity coming
            online annually.
          </p>
          <Bullets
            items={[
              "Demand: induction furnaces, rolling mill automation, cranes, water-cooled cables",
            ]}
          />
        </Section>

        <Section num="04" title="Power Sector">
          <p>
            27,000+ MW installed, target 40,000 MW by 2030 with renewables and nuclear additions
            (Rooppur 2.4 GW). Grid modernisation creates a USD 10B+ multi-year equipment
            opportunity.
          </p>
          <Bullets
            items={["Demand: switchgear, transformers, SCADA, protection relays, solar inverters"]}
          />
        </Section>

        <Section num="05" title="Food Processing">
          <p>
            Fastest-growing consumer manufacturing sector — 10–12% CAGR. Domestic packaged food
            and halal export to Middle East drive expansion.
          </p>
          <Bullets
            items={["Demand: filling lines, cold chain, packaging automation, food-grade conveyors"]}
          />
        </Section>

        <Section num="06" title="Pharmaceutical">
          <p>
            USD 4B+ market, 97% domestic self-sufficiency, exports to 150+ countries with rising
            WHO pre-qualification. CapEx in API, sterile injectables and bio-similars
            accelerating.
          </p>
          <Bullets
            items={["Demand: clean rooms, HVAC, lyophilisers, blister/sachet lines, SCADA validation"]}
          />
        </Section>

        <Section num="07" title="Shipbuilding">
          <p>
            Export-grade yards in Chattogram and Narayanganj have delivered 100+ ocean-going
            vessels to Europe and Africa. Niche opportunity in mid-size cargo, ferries and fishing
            fleets.
          </p>
          <Bullets
            items={["Demand: marine engines, cranes, welding automation, NDT, classed components"]}
          />
        </Section>

        <Section num="08" title="Industrial Automation">
          <p>
            Smallest base, highest growth — 15%+ CAGR. Greenfield factories adopt PLC/HMI/SCADA
            from day one; brownfield retrofits accelerate as energy and labour costs rise.
          </p>
          <Bullets
            items={["Demand: PLC, VFD, sensors, robotics, MES, energy management systems"]}
          />
        </Section>

        <Section num="09" title="Methodology & Sources">
          <blockquote className="border-l-4 border-accent pl-5 italic text-slate-700">
            Figures aggregated from Bangladesh Bureau of Statistics, BIDA, EPB, BGMEA, BCMA,
            BSRMA, BPDB, DGDA, DG-Shipping, plus MegaHaus internal project-pipeline tracking
            2024–2026. CAGR projections assume stable macro trajectory. Indicative — not financial
            advice.
          </blockquote>
        </Section>

        <DocCTA
          pdfTitle="Market Potential Report"
          subtitle="Bangladesh Industrial Sectors · 2026–2030"
        />
      </div>
    </PublicLayout>
  );
}
