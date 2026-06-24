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

export const Route = createFileRoute("/portfolio/strategic-vision-2033")({
  head: () => ({
    meta: [
      { title: "Strategic Vision 2033 — MegaHaus Industrial Hub" },
      {
        name: "description",
        content:
          "Industry 4.0, Smart Factory, AI & Automation, Green Energy, Net-Zero Carbon, International Distribution Hub and Nationwide Dealer Network — MegaHaus's roadmap to 2033.",
      },
      { property: "og:title", content: "MegaHaus Strategic Vision 2033" },
      {
        property: "og:description",
        content: "Industry 4.0 · Smart Factory · Net-Zero · Global Distribution Hub.",
      },
    ],
  }),
  component: StrategicVision,
});

const pillars = [
  "Industry 4.0",
  "Smart Factories",
  "AI & Automation",
  "Green Energy",
  "Net-Zero Carbon",
  "Global Distribution",
];

const distHub = [
  { flag: "🇨🇳", country: "China", focus: "Components & sub-assemblies" },
  { flag: "🇯🇵", country: "Japan", focus: "Precision automation" },
  { flag: "🇩🇪", country: "Germany / EU", focus: "Tier-1 industrial brands" },
  { flag: "🇺🇸", country: "USA", focus: "Controls, software, instrumentation" },
];

const brandColors = [
  {
    hex: "#0F172A",
    name: "Navy Blue",
    meaning: "Trust · Engineering · Corporate Identity",
    usage: "Primary surfaces, headers",
  },
  {
    hex: "#F97316",
    name: "Orange",
    meaning: "Innovation · Growth · Energy",
    usage: "Accents, CTAs, key numbers",
  },
  {
    hex: "#FFFFFF",
    name: "White",
    meaning: "Clean Design · Professional",
    usage: "Backgrounds, breathing space",
  },
  {
    hex: "#DC2626",
    name: "Red",
    meaning: "Important Notice · Strategic Goals",
    usage: "Highlights only",
  },
];

function StrategicVision() {
  return (
    <PublicLayout>
      <DocHeader
        volume="03"
        pages="10–15"
        title="Strategic Vision 2033"
        subtitle="Industry 4.0 · Smart Factory · Net-Zero · Global Hub"
        pdfTitle="Strategic Vision 2033"
      />

      <div className="max-w-4xl mx-auto px-6">
        <Section num="01" title="Vision 2033">
          <blockquote className="border-l-4 border-accent pl-5 italic text-industrial text-lg">
            By 2033, MegaHaus Industrial Hub will be the leading industrial sourcing, engineering
            and partnership platform in Bangladesh — fully integrated with global Tier-1
            manufacturers and serving as a regional distribution gateway for South Asia.
          </blockquote>
          <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {pillars.map((p) => (
              <div key={p} className="bg-slate-50 border-t-4 border-accent p-5">
                <p className="font-display text-base font-extrabold uppercase text-industrial">
                  {p}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section num="02" title="Industry 4.0 Adoption">
          <p>
            Lead the localisation of the Industry 4.0 stack — connected sensors, edge gateways,
            MES/SCADA, predictive maintenance — for Bangladesh's mid-to-large manufacturers.
          </p>
          <Bullets
            items={[
              "Integration partner for global PLC/HMI/MES brands",
              "Cybersecure OT architecture",
              "Operator training centres",
            ]}
          />
        </Section>

        <Section num="03" title="Smart Factory Program">
          <p>
            Turnkey "Smart Factory" upgrades combining mechanical retrofit, controls modernisation
            and digital plant management.
          </p>
          <Bullets
            items={[
              "Energy monitoring & sub-metering",
              "Digital twin for critical lines",
              "Real-time OEE dashboards",
            ]}
          />
        </Section>

        <Section num="04" title="AI & Automation">
          <p>
            Embed practical AI — vision inspection, anomaly detection, demand forecasting — into
            industrial workflows where it delivers measurable ROI.
          </p>
        </Section>

        <Section num="05" title="Green Energy & Net-Zero Carbon">
          <p>
            Active push toward decarbonised industrial operations: rooftop solar, waste-heat
            recovery, high-efficiency motors, ETP automation, carbon accounting.
          </p>
          <Bullets
            items={[
              "Target 30% energy-intensity reduction across served clients by 2033",
              "ESG-aligned partner brands prioritised",
            ]}
          />
        </Section>

        <Section num="06" title="International Distribution Hub">
          <p>Bangladesh as regional gateway.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border border-slate-200 mt-4">
            {distHub.map((h) => (
              <div key={h.country} className="bg-white p-5">
                <p className="text-3xl">{h.flag}</p>
                <p className="mt-2 font-display text-base font-extrabold uppercase text-industrial">
                  {h.country}
                </p>
                <p className="mt-1 text-xs text-slate-600">{h.focus}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section num="07" title="Future Service Centres & Dealer Network">
          <p>
            Regional service centres + nationwide dealer network across 8 divisions for same-day
            technical response.
          </p>
          <KeyTable
            headers={["Phase", "Timeline", "Footprint"]}
            rows={[
              ["Phase 1", "2026–2028", "Chattogram HQ + Dhaka centre"],
              ["Phase 2", "2028–2030", "4 divisional service centres"],
              ["Phase 3", "2030–2033", "50+ certified dealers nationwide"],
            ]}
          />
        </Section>

        <Section num="08" title="MegaHaus Brand Color Guide">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border border-slate-200">
            {brandColors.map((c) => (
              <div key={c.hex} className="bg-white">
                <div className="h-24 border-b border-slate-200" style={{ backgroundColor: c.hex }} />
                <div className="p-4">
                  <p className="font-mono text-xs text-slate-500">{c.hex}</p>
                  <p className="mt-1 font-display text-base font-extrabold text-industrial">
                    {c.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{c.meaning}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-wider font-bold text-accent">
                    {c.usage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section num="09" title="Long-Term Vision Statement">
          <div className="bg-slate-50 border-l-4 border-accent p-6">
            <p className="italic text-industrial text-lg">
              "MegaHaus Industrial Hub aims to become Bangladesh's most trusted Industrial
              Marketplace, Engineering Service Platform and International Partnership Network —
              connecting global technologies with local industries."
            </p>
          </div>
          <div className="mt-4">
            <Eyebrow>— MegaHaus Industrial Hub · 2025</Eyebrow>
          </div>
        </Section>

        <DocCTA
          pdfTitle="Strategic Vision 2033"
          subtitle="Industry 4.0 · Smart Factory · Net-Zero · Global Hub"
        />
      </div>
    </PublicLayout>
  );
}
