import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  CheckCircle,
  HardHat,
  Wrench,
  Settings,
  Globe,
  BarChart3,
  Monitor,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About MegaHaus Industrial Hub" },
      { name: "description", content: "MegaHaus is Bangladesh's first integrated industrial marketplace. A project of Protocol Cashmere Limited." },
    ],
  }),
  component: AboutPage,
});

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold uppercase tracking-widest text-accent">
      [ {children} ]
    </div>
  );
}

function SquareBullet() {
  return <span className="mt-1.5 h-1.5 w-1.5 bg-accent shrink-0" />;
}

const managementTeam = [
  {
    initials: "MK",
    role: "Chief Technical Advisor",
    name: "ENGR. MD. MOSTAFA KAMAL",
    bullets: [
      "BSc in Electrical Engineering",
      "40+ Years of Experience",
      "Electrical & Industrial Specialist",
      "Worked in 31+ Industrial Projects",
      "Expert in Power, Automation & Industrial Systems",
    ],
    desc: "He is the backbone of our technical strength with vast experience in industrial setup, operations, maintenance and project execution.",
  },
  {
    initials: "AK",
    role: "Director (Engineering)",
    name: "ENGR. AHSAN KAMAL",
    bullets: [
      "BSc in Electrical Engineering",
      "10+ Years of Experience",
      "Industrial Automation Expert",
      "Project Planning & Execution",
      "Power, Control & Automation Systems Specialist",
    ],
    desc: "Leads engineering operations, automation solutions, project implementation and technical development.",
  },
  {
    initials: "KH",
    role: "Managing Director & CEO",
    name: "KAMRUL HASAN",
    bullets: [
      "Business Management Expert",
      "10+ Years of Experience",
      "Industrial Sourcing Specialist",
      "International Business Network",
      "Strategic Planning & Growth Management",
    ],
    desc: "Leading the company's overall strategy, international partnerships, sourcing, business development and market expansion.",
  },
  {
    initials: "RH",
    role: "Chairman (Protocol Cashmere Ltd.)",
    name: "MST. RUMANA HASAN",
    bullets: [
      "Business Management Expert",
      "Chairman – Protocol Cashmere Ltd.",
      "Leadership & Administration",
      "Finance & Strategic Planning",
      "Corporate Governance",
    ],
    desc: "Providing leadership and strategic guidance for sustainable growth and corporate excellence.",
  },
  {
    initials: "NI",
    role: "Head of Operations",
    name: "SYED NAZMUL ISLAM",
    bullets: [
      "BSc in Mechanical Engineering",
      "12+ Years of Experience",
      "Operations & Maintenance Expert",
      "Industrial Project Management",
      "Plant Maintenance & Technical Support",
    ],
    desc: "Oversees daily operations, industrial maintenance services, production support and technical execution.",
  },
  {
    initials: "FH",
    role: "Head of Marketing & Sales",
    name: "MD. FARHAD HOSSAIN",
    bullets: [
      "MBA in Marketing",
      "8+ Years of Experience",
      "Industrial Marketing Expert",
      "Sales Strategy & Development",
      "Client Relationship Management",
    ],
    desc: "Leads marketing strategies, brand development, client acquisition and market expansion activities.",
  },
];

const supportingTeam = [
  {
    Icon: HardHat,
    title: "Engineering Team",
    bullets: ["Electrical Engineers", "Mechanical Engineers", "Automation Engineers", "Project Engineers"],
  },
  {
    Icon: Wrench,
    title: "Technical Team",
    bullets: ["Technicians", "Electricians", "Mechanical Technicians", "Field Service Engineers"],
  },
  {
    Icon: Settings,
    title: "Maintenance Team",
    bullets: ["Industrial Maintenance", "Electrical Maintenance", "Mechanical Maintenance", "Preventive Maintenance"],
  },
  {
    Icon: Globe,
    title: "Procurement & Sourcing",
    bullets: ["Global Sourcing", "Supplier Management", "Import & Logistics", "Quality Control"],
  },
  {
    Icon: BarChart3,
    title: "Finance & Admin",
    bullets: ["Accounts & Finance", "HR & Admin", "Compliance & Legal", "Documentation"],
  },
  {
    Icon: Monitor,
    title: "IT & Digital Team",
    bullets: ["Web & App Development", "Digital Marketing", "Online Platform Management", "IT Support"],
  },
];

const roadmapPhases = [
  { label: "Phase 1", years: "2026–2027", content: "Corporate Office, Website Launch, Company Portfolio, Supplier Registration, Market Research" },
  { label: "Phase 2", years: "2027–2028", content: "Distributor Agreements, Demonstration Center, Service Team Expansion" },
  { label: "Phase 3", years: "2028–2029", content: "Nationwide Dealer Network, Industrial Service Division" },
  { label: "Phase 4", years: "2029–2030", content: "Regional Warehouse, Technical Service Centers" },
  { label: "Phase 5", years: "2030–2031", content: "MegaHaus Industrial Marketplace, International Partnership Network, Nationwide Engineering Platform" },
];

function AboutPage() {
  return (
    <PublicLayout>
      {/* 1. Hero */}
      <section className="bg-industrial text-industrial-foreground py-24">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>About Us</SectionLabel>
          <h1 className="mt-6 font-['Archivo'] text-4xl font-extrabold uppercase md:text-6xl lg:text-7xl">
            MEGAHAUS INDUSTRIAL HUB
          </h1>
          <p className="mt-5 text-lg text-white/80 max-w-3xl">
            Bangladesh Industrial Sourcing, Engineering & Global Partnership Platform
          </p>
          <div className="mt-8 inline-block border border-accent/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent">
            Corporate Profile 2025–2033
          </div>
        </div>
      </section>

      {/* 2. Executive Overview */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>Executive Overview</SectionLabel>
          <div className="mt-8 space-y-6 text-lg text-slate-700 leading-relaxed">
            <p>
              MegaHaus Industrial Hub is an emerging Industrial Sourcing, Engineering Support, Distribution and International Partnership Platform based in Bangladesh.
            </p>
            <p>
              Our objective is to bridge the gap between global manufacturers and Bangladesh industries by providing technical support, sourcing solutions, engineering consultancy, industrial products, after-sales services and market development programs.
            </p>
            <p>
              MegaHaus aims to become a trusted gateway for international industrial brands seeking access to Bangladesh's growing manufacturing sector.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Vision & Mission */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="md:grid md:grid-cols-2 md:gap-16 items-start">
            <div>
              <SectionLabel>Vision</SectionLabel>
              <p className="mt-6 font-['Archivo'] text-2xl font-extrabold uppercase leading-snug text-industrial">
                To become one of Bangladesh's leading Industrial Marketplace, Engineering Service and Global Technology Partnership Platforms.
              </p>
            </div>
            <div>
              <SectionLabel>Mission</SectionLabel>
              <ul className="mt-6 space-y-4">
                {[
                  "Connect global manufacturers with Bangladesh industries",
                  "Support industrial development through engineering expertise",
                  "Promote modern automation and industrial technologies",
                  "Build sustainable international partnerships",
                  "Develop a nationwide industrial sourcing and distribution network",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-700">
                    <SquareBullet />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why Bangladesh */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>Why Bangladesh</SectionLabel>
          <p className="mt-6 text-lg text-slate-700 leading-relaxed">
            Bangladesh is one of South Asia's fastest-growing industrial economies with strong expansion in:
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              "Textile & Garments",
              "Cement Manufacturing",
              "Steel & Re-Rolling",
              "Power & Energy",
              "Food Processing",
              "Pharmaceuticals",
              "Shipbuilding",
              "Infrastructure Development",
              "Industrial Automation",
              "Renewable Energy",
            ].map((sector) => (
              <div key={sector} className="border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 text-center">
                {sector}
              </div>
            ))}
          </div>
          <p className="mt-8 text-lg text-slate-700 leading-relaxed">
            These sectors create substantial opportunities for international suppliers and technology providers.
          </p>
        </div>
      </section>

      {/* 5. Engineering Leadership */}
      <section className="bg-industrial text-industrial-foreground py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>Engineering Leadership & Industrial Legacy</SectionLabel>
          <p className="mt-6 text-lg text-white/80 leading-relaxed">
            MegaHaus is supported by a network of senior engineering professionals with extensive experience in industrial project management, automation systems, factory construction, commissioning and maintenance.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { value: "40+", label: "Combined engineering experience exceeds 40 years." },
              { value: "21+", label: "Our technical advisors have been involved in planning, installation, commissioning and operation of more than 21 industrial projects across Bangladesh." },
              { value: "6", label: "Industries include Cement Plants, Textile Mills, Garment Factories, Power Plants, Steel Industries and Industrial Utility Systems." },
            ].map((stat) => (
              <div key={stat.value} className="border border-slate-700 bg-slate-800/50 p-6">
                <div className="font-['Archivo'] text-4xl font-extrabold text-accent">{stat.value}</div>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-4">Core Disciplines</p>
            <div className="flex flex-wrap gap-3">
              {[
                "Mechanical Engineering",
                "Electrical Engineering",
                "Industrial Project Management",
                "Factory Construction & Commissioning",
                "Maintenance Management",
                "Industrial Automation",
              ].map((d) => (
                <span key={d} className="border border-slate-600 px-4 py-2 text-sm text-white/90">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Management Team — header */}
      <section className="bg-industrial text-industrial-foreground py-16">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>Management Team</SectionLabel>
          <h2 className="mt-4 font-['Archivo'] text-3xl font-extrabold uppercase md:text-4xl">Management Team Profile</h2>
          <p className="mt-3 text-accent font-['Archivo'] text-lg font-bold uppercase">Strong Leadership. Expert Team. Shared Vision.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              { label: "Experience", value: "40+ Years" },
              { label: "Dedication", value: "100%" },
              { label: "Teamwork", value: "Our Strength" },
              { label: "Growth", value: "Our Commitment" },
            ].map((s) => (
              <div key={s.label} className="border border-slate-700 bg-slate-800/50 p-5 text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-white/60">{s.label}</div>
                <div className="mt-2 font-['Archivo'] text-xl font-extrabold text-white">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Management Team — cards */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {managementTeam.map((member) => (
              <article key={member.initials} className="border border-slate-200 bg-white overflow-hidden hover:border-accent transition-colors">
                <div className="aspect-[4/5] bg-slate-200 flex items-center justify-center">
                  <div className="h-24 w-24 bg-industrial text-white font-['Archivo'] text-2xl font-extrabold flex items-center justify-center">
                    {member.initials}
                  </div>
                </div>
                <div className="bg-industrial p-4">
                  <div className="text-xs font-bold text-accent uppercase tracking-widest mb-1">{member.role}</div>
                  <h3 className="font-['Archivo'] text-lg font-bold text-white uppercase">{member.name}</h3>
                </div>
                <div className="p-5">
                  <ul className="space-y-2 text-sm text-slate-600 mb-4">
                    {member.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    {member.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Supporting Team */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-10">
            <div className="inline-block border border-industrial px-4 py-2 text-xs font-bold uppercase tracking-widest text-industrial">
              Our Supporting Team
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {supportingTeam.map(({ Icon, title, bullets }) => (
              <div key={title} className="border border-slate-200 bg-slate-50 p-6 hover:border-accent transition-colors">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                  <div className="h-10 w-10 bg-accent text-white flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-['Archivo'] text-sm font-bold text-industrial uppercase">{title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <SquareBullet />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Core Business Areas */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>Core Business Areas</SectionLabel>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { num: "01", text: "Industrial Sourcing: Global sourcing of industrial products and technologies." },
              { num: "02", text: "Engineering Services: Technical consultancy, factory support and project implementation." },
              { num: "03", text: "Distribution & Dealership Development: Market development and dealer network creation." },
              { num: "04", text: "Import & Export Support: International procurement and logistics coordination." },
              { num: "05", text: "Technical Services: Installation, maintenance and troubleshooting support." },
              { num: "06", text: "Industrial Marketing: Market research, promotion and product positioning." },
            ].map((card) => (
              <div key={card.num} className="border border-slate-200 bg-white p-6 hover:border-accent transition-colors">
                <div className="text-xs font-bold uppercase tracking-widest text-accent mb-3">{card.num}</div>
                <p className="text-slate-700 leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Target Industrial Sectors */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>Target Industrial Sectors</SectionLabel>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {[
              {
                group: "Manufacturing",
                items: ["Textile Industry", "Garments Industry", "Dyeing & Finishing Plants", "Packaging Industry"],
              },
              {
                group: "Heavy Industry",
                items: ["Cement Plants", "Steel Mills", "Rolling Mills", "Shipbuilding"],
              },
              {
                group: "Energy Sector",
                items: ["Power Generation", "Generator Systems", "Solar Energy", "Electrical Infrastructure"],
              },
              {
                group: "Process Industry",
                items: ["Food & Beverage", "Pharmaceuticals", "Water Treatment"],
              },
            ].map(({ group, items }) => (
              <div key={group}>
                <h3 className="font-['Archivo'] text-lg font-bold uppercase text-industrial mb-4">{group}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-slate-700">
                      <SquareBullet />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. International Partnership Program */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>International Partnership Program</SectionLabel>
          <p className="mt-6 text-lg text-slate-700 leading-relaxed">
            MegaHaus seeks strategic collaboration with global industrial leaders.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { region: "Germany", brands: "igus, Phoenix Contact, WAGO, Festo, Bosch Rexroth" },
              { region: "Japan", brands: "Mitsubishi Electric, Omron, Panasonic Industry" },
              { region: "Europe", brands: "Schneider Electric, ABB, Danfoss" },
              { region: "USA", brands: "Rockwell Automation, Parker Hannifin" },
            ].map((block) => (
              <div key={block.region} className="border border-slate-200 bg-white p-6">
                <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">{block.region}</div>
                <p className="text-slate-700">{block.brands}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-l-4 border-accent bg-white p-5">
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-bold text-industrial">Partnership Models:</span> Authorized Distributor, Regional Partner, Technical Service Partner, Engineering Support Partner, Market Development Partner.
            </p>
          </div>
        </div>
      </section>

      {/* 12. Bangladesh Coverage */}
      <section className="bg-industrial text-industrial-foreground py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>Bangladesh Coverage</SectionLabel>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              { region: "Chattogram Region", details: "Chattogram, Sitakunda, Mirsarai Economic Zone, Patenga Industrial Area" },
              { region: "Dhaka Region", details: "Dhaka, Gazipur, Narayanganj, Savar" },
              { region: "Eastern Region", details: "Cumilla, Feni, Noakhali, Chandpur" },
              { region: "Future Expansion", details: "Khulna, Rajshahi, Sylhet, Barishal" },
            ].map((card) => (
              <div key={card.region} className="border border-slate-700 bg-slate-800/50 p-6">
                <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">{card.region}</div>
                <p className="text-sm text-slate-300 leading-relaxed">{card.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 13. Five-Year Strategic Roadmap */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>Five-Year Strategic Roadmap</SectionLabel>
          <div className="mt-10 relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />
            <div className="space-y-10 pl-8">
              {roadmapPhases.map((phase) => (
                <div key={phase.label} className="relative">
                  <div className="absolute -left-[22px] top-1.5 h-3 w-3 bg-accent" />
                  <div className="md:grid md:grid-cols-12 md:gap-8 items-start">
                    <div className="md:col-span-3">
                      <span className="text-sm font-bold uppercase tracking-widest text-accent">
                        {phase.label} ({phase.years})
                      </span>
                    </div>
                    <div className="md:col-span-9 mt-2 md:mt-0 border border-slate-200 bg-white p-6">
                      <p className="text-slate-700 leading-relaxed">
                        {phase.label} ({phase.years}): {phase.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 14. Corporate Headquarters */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>Corporate Headquarters</SectionLabel>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="border border-slate-200 bg-slate-50 p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Location</div>
              <p className="text-slate-700">Jubilee Road, Chattogram, Bangladesh</p>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Functions</div>
              <p className="text-slate-700">Corporate Office, Industrial Showroom, Meeting & Training Center, Business Development Center, Customer Support Desk</p>
            </div>
          </div>
        </div>
      </section>

      {/* 15. Long-Term Vision Statement */}
      <section className="bg-industrial text-industrial-foreground py-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <SectionLabel>Long-Term Vision</SectionLabel>
          <blockquote className="mt-8 font-['Archivo'] text-2xl md:text-3xl font-extrabold uppercase leading-snug text-white max-w-4xl mx-auto">
            "MegaHaus Industrial Hub aims to become Bangladesh's most trusted Industrial Marketplace, Engineering Service Platform and International Partnership Network, connecting global technologies with local industries."
          </blockquote>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/products"
              className="inline-flex items-center justify-center bg-accent px-6 py-3 text-sm font-bold uppercase text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Browse Catalog
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center border border-white/30 px-6 py-3 text-sm font-bold uppercase text-white hover:bg-white/10 transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
