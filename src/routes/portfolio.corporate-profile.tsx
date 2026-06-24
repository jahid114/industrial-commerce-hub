import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  DocHeader,
  DocCTA,
  Section,
  Bullets,
  H2,
  KeyTable,
  Eyebrow,
} from "@/components/portfolio/DocChrome";

export const Route = createFileRoute("/portfolio/corporate-profile")({
  head: () => ({
    meta: [
      { title: "Corporate Profile 2025 — MegaHaus Industrial Hub" },
      {
        name: "description",
        content:
          "MegaHaus Industrial Hub corporate profile for foreign manufacturers, distributors and investors. Vision, engineering legacy, services, group companies and partnership program.",
      },
      { property: "og:title", content: "MegaHaus Corporate Profile 2025" },
      {
        property: "og:description",
        content:
          "Bangladesh industrial sourcing, engineering and international partnership platform.",
      },
    ],
  }),
  component: CorporateProfile,
});

const industries = [
  "Textile & RMG",
  "Garments Accessories",
  "Cement",
  "Steel",
  "Power",
  "Food Processing",
  "Pharmaceutical",
  "Shipbuilding",
  "Industrial Automation",
];

const partners = [
  "igus",
  "Phoenix Contact",
  "WAGO",
  "Festo",
  "Bosch Rexroth",
  "Mitsubishi Electric",
  "Omron",
  "Schneider Electric",
  "ABB",
  "Rockwell Automation",
];

function CorporateProfile() {
  return (
    <PublicLayout>
      <DocHeader
        volume="01"
        pages="20–30"
        title="Corporate Profile"
        subtitle="For foreign manufacturers, distributors and investors"
        pdfTitle="Corporate Profile"
      />

      <div className="max-w-4xl mx-auto px-6">
        <Section num="01" title="Who We Are">
          <p>
            MegaHaus Industrial Hub is an emerging{" "}
            <strong>
              Industrial Sourcing, Engineering Support, Distribution and International Partnership
              Platform
            </strong>{" "}
            based in Bangladesh. Our objective is to bridge the gap between global manufacturers
            and Bangladesh industries by providing technical consulting, sourcing, after-sales
            support, and a transparent procurement framework.
          </p>
          <H2>Vision</H2>
          <p>
            To become Bangladesh's most trusted Industrial Marketplace, Engineering Service
            Platform and International Partnership Network — connecting global technologies with
            local industries.
          </p>
          <H2>Mission</H2>
          <Bullets
            items={[
              "Deliver verified industrial machinery, components and automation systems",
              "Provide engineering consultancy and lifecycle support to local manufacturers",
              "Build long-term distribution partnerships with global Tier-1 brands",
              "Develop a skilled engineering workforce for Industry 4.0 adoption",
            ]}
          />
          <H2>Core Values</H2>
          <Bullets
            items={[
              "Engineering Integrity",
              "International Standards",
              "Long-term Partnership",
              "Operational Transparency",
              "Customer Success",
            ]}
          />
        </Section>

        <Section num="02" title="Why Bangladesh">
          <p>
            One of the fastest-growing industrial economies in South Asia. 170M+ population, USD
            460B+ GDP, and 8–10% annual manufacturing growth.
          </p>
          <KeyTable
            headers={["Indicator", "Value", "Outlook"]}
            rows={[
              ["Population", "170M+", "Rising consumer base"],
              ["Manufacturing GDP Growth", "8–10% / yr", "Sustained expansion"],
              ["Annual Export Volume", "USD 55B+", "Apparel-led, diversifying"],
              ["Special Economic Zones", "100+", "Aggressive FDI push"],
              ["Industrial Power Capacity", "27,000+ MW", "New gas, solar, nuclear"],
            ]}
          />
        </Section>

        <Section num="03" title="Our Engineering Strength">
          <p>
            Backed by a network with <strong>40+ years</strong> of cumulative engineering
            experience across <strong>31+ industrial projects</strong> in textile, cement, steel,
            power and food sectors.
          </p>
          <H2>Disciplines Covered</H2>
          <Bullets
            items={[
              "Mechanical Engineering — rotating machinery, hydraulic & pneumatic",
              "Electrical Engineering — switchgear, MCC, drives, motor control",
              "Industrial Automation — PLC, HMI, SCADA, IIoT",
              "Factory Construction & Layout Engineering",
              "Preventive Maintenance & Reliability Engineering",
            ]}
          />
        </Section>

        <Section num="04" title="MegaHaus Service Platform">
          <p>
            An integrated B2B + B2C platform combining industrial sourcing, engineering
            consultancy, technical services and international partnership.
          </p>
          <Bullets
            items={[
              <><strong>Industrial Sourcing</strong> — verified machinery and components</>,
              <><strong>Engineering Consultancy</strong> — selection, sizing, integration</>,
              <><strong>Technical Services</strong> — commissioning, maintenance, training</>,
              <><strong>Factory Support</strong> — layout, retrofit, expansion</>,
              <><strong>Distribution</strong> — channel for global Tier-1 brands</>,
              <><strong>International Partnership</strong> — exclusive country representation</>,
            ]}
          />
        </Section>

        <Section num="05" title="Target Industries">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {industries.map((ind) => (
              <div
                key={ind}
                className="border border-slate-200 border-l-4 border-l-accent p-4 bg-white"
              >
                <p className="font-display text-base font-extrabold uppercase text-industrial">
                  {ind}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section num="06" title="International Partnership Program">
          <p>
            We welcome global Tier-1 industrial brands to partner with MegaHaus for exclusive
            country representation, technical channel development and joint service delivery
            across Bangladesh.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-slate-200 border border-slate-200 mt-4">
            {partners.map((p) => (
              <div
                key={p}
                className="bg-white h-24 flex items-center justify-center text-center px-3"
              >
                <span className="font-display text-sm font-extrabold uppercase text-industrial">
                  {p}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section num="07" title="Group Companies & Sister Concerns">
          <div className="grid md:grid-cols-2 gap-px bg-slate-200 border border-slate-200">
            <div className="bg-white p-6">
              <Eyebrow>Sister Concern</Eyebrow>
              <h3 className="mt-2 font-display text-xl font-extrabold text-industrial">
                Protocol Cashmere Ltd. — Apparel Sourcing Partner
              </h3>
              <p className="mt-3 text-slate-700 text-sm leading-relaxed">
                ISO 9001:2015, est. 2006, 20-year apparel manufacturer for Europe/USA/Canada/Asia.
                <strong> 10M+ pieces/yr</strong> capacity. BSCI · SEDEX · WRAP · OEKO-TEX · GOTS ·
                GRS · RWS.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <Bullets
                  items={[
                    "Knitwear — T-shirts, polos, hoodies, sweatshirts, fleece",
                    "Woven — shirts, blouses, chinos, blazers, uniforms",
                    "Denim — sustainable wet/dry, laser, ozone wash",
                    "Cashmere & wool — 3GG to 16GG sweaters and accessories",
                    "Hannover Messe 2026 Pavilion: Hall 17, Booth D82",
                  ]}
                />
              </ul>
            </div>
            <div className="bg-white p-6">
              <Eyebrow>Sister Concern</Eyebrow>
              <h3 className="mt-2 font-display text-xl font-extrabold text-industrial">
                MegaHaus Industrial — Precision Engineering
              </h3>
              <p className="mt-3 text-slate-700 text-sm leading-relaxed">
                High-precision mechanical components, automation tooling, heavy industrial setup;
                CAD/CAM, prototyping, mass production for Automotive, EV, Aerospace, Medical
                Devices, Electronics, Rail Transit.
              </p>
              <ul className="mt-4">
                <Bullets
                  items={[
                    "MOQ 1 piece — non-standard customisation",
                    "Lead time 1–4 weeks",
                    "Terms EXW / FOB / DAP / DDP",
                    "Inspection 0.001 mm, 100% pre-shipment QC",
                  ]}
                />
              </ul>
            </div>
          </div>
        </Section>

        <Section num="08" title="Showroom & Corporate Office Model">
          <p>
            <strong>Headquarters:</strong> Jubilee Road, Chattogram, Bangladesh.
          </p>
          <Bullets
            items={[
              "Corporate Office",
              "Industrial Product Display Center",
              "Meeting & Training Center",
              "Business Development Desk",
              "Technical & Customer Support",
            ]}
          />
        </Section>

        <Section num="09" title="Contact">
          <div className="bg-industrial text-white p-8">
            <Eyebrow>Get in touch</Eyebrow>
            <p className="mt-4 font-display text-2xl font-extrabold">Kamrul Hasan</p>
            <p className="text-accent text-sm font-bold uppercase tracking-wider mt-1">
              Managing Director & CEO
            </p>
            <div className="mt-6 space-y-2 text-sm text-slate-300">
              <p>MegaHaus Industrial Hub | Protocol Cashmere Ltd.</p>
              <p>Jubilee Road, Chattogram, Bangladesh</p>
              <p>
                Email:{" "}
                <a className="text-accent" href="mailto:corporate@megahaus-hub.com">
                  corporate@megahaus-hub.com
                </a>
              </p>
              <p>Web: megahaus-hub.com</p>
            </div>
          </div>
        </Section>

        <DocCTA
          pdfTitle="Corporate Profile"
          subtitle="For foreign manufacturers, distributors and investors"
        />
      </div>
    </PublicLayout>
  );
}
