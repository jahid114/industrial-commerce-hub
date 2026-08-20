import type { Category } from "./types";

export const categories: Category[] = [
  {
    id: "tools",
    name: "Power Tools",
    slug: "tools",
    subcategories: ["Drills", "Grinders", "Saws", "Sanders", "Welding"],
    description: "Professional-grade power tools for industrial work.",
  },
  {
    id: "machinery",
    name: "Industrial Machinery",
    slug: "machinery",
    subcategories: ["Lathes", "CNC", "Presses", "Conveyors"],
    description: "Heavy machinery for production lines and workshops.",
  },
  {
    id: "electrical",
    name: "Electrical & Automation",
    slug: "electrical",
    subcategories: ["PLCs", "Drives", "Sensors", "Switchgear"],
    description: "Automation, control systems and electrical components.",
  },
  {
    id: "construction",
    name: "Construction",
    slug: "construction",
    subcategories: ["Concrete", "Scaffolding", "Surveying", "Safety"],
    description: "Equipment for construction sites and infrastructure.",
  },
  {
    id: "automotive",
    name: "Automotive",
    slug: "automotive",
    subcategories: ["Diagnostics", "Lifts", "Compressors", "Lubrication"],
    description: "Garage and workshop tools for vehicle service.",
  },
];

export const getCategory = (id: string) => categories.find((c) => c.id === id);
