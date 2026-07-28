import { createFileRoute, Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
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
      { title: "About Megahaus Marketplace" },
      { name: "description", content: "Megahaus is building Bangladesh's marketplace for industrial products, inspired by global leaders like Bauhaus and OBI, serving more than 180 million people." },
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
            Megahaus marketplace
          </h1>
          <p className="mt-5 text-lg text-white/80 max-w-3xl">
            Bangladesh's marketplace for industrial products — inspired by the proven model of global leaders like Bauhaus and OBI, who have sold tools and materials across the world for over 47 years. We are bringing that same trusted solution to Bangladesh, built for more than 180 million people.
          </p>
          <div className="mt-8 inline-block border border-accent/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent">
            Project Value: $5M
          </div>
        </div>
      </section>

      {/* 2. Executive Overview */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <SectionLabel>Executive Overview</SectionLabel>
          <div className="mt-8 space-y-6 text-lg text-slate-700 leading-relaxed">
            <p>
              Megahaus Marketplace is a $5M project building Bangladesh's destination for industrial products, tools, materials and after-sales services.
            </p>
            <p>
              We are inspired by the proven global marketplace model of Bauhaus, OBI and similar industrial retailers who have sold to millions of customers across Europe and beyond for over 47 years. Their legacy of product availability, trusted brands and reliable service is the blueprint we are bringing to Bangladesh.
            </p>
            <p>
              Our objective is to create a platform that serves more than 180 million people — connecting factories, contractors, engineers and maintenance teams with the industrial products they need, delivered locally and supported by experts who understand the Bangladesh market.
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
            "Megahaus Marketplace aims to become Bangladesh's most trusted destination for industrial products, tools and materials — a marketplace built for more than 180 million people, powered by global brands and local service."
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

      {/* 16. Connect With Us */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <SectionLabel>Connect With Us</SectionLabel>
          <h2 className="mt-4 font-['Archivo'] text-2xl font-extrabold uppercase text-industrial md:text-3xl">Follow Megahaus Marketplace</h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Stay updated with the latest industrial products, offers, and announcements from Bangladesh's marketplace for industrial tools and materials.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <SocialLink href="#" label="Facebook" bg="bg-[#1877F2]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </SocialLink>
            <SocialLink href="#" label="WhatsApp" bg="bg-[#25D366]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-9.403h-.004c-3.749 0-6.803 3.054-6.803 6.805 0 1.44.448 2.787 1.22 3.94l.19.283-.806 2.943 3.022-.806.29.162c1.024.586 2.214.914 3.486.914h.004c3.749 0 6.803-3.054 6.803-6.805 0-1.816-.708-3.525-1.994-4.813-1.286-1.287-2.997-1.994-4.812-1.994z"/></svg>
            </SocialLink>
            <SocialLink href="#" label="YouTube" bg="bg-[#FF0000]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </SocialLink>
            <SocialLink href="#" label="TikTok" bg="bg-[#000000]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </SocialLink>
            <SocialLink href="#" label="Instagram" bg="bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </SocialLink>
            <SocialLink href="#" label="LinkedIn" bg="bg-[#0A66C2]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </SocialLink>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function SocialLink({ href, label, bg, children }: { href: string; label: string; bg: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent ${bg}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
