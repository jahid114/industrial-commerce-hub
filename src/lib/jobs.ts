export type JobPosting = {
  id: string;
  slug: string;
  title: string;
  type: string;
  location: string;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  published: boolean;
  postedAt: string;
};

const JOBS_KEY = "job-postings";

export const FIELD_AGENT_JOB_ID = "JOB-FIELD-AGENT";

const seed: JobPosting[] = [
  {
    id: FIELD_AGENT_JOB_ID,
    slug: "field-agent",
    title: "Field Agent",
    type: "Commission-based · Field role",
    location: "All districts, Bangladesh",
    summary:
      "Represent MegaHaus in your own area — visit factories, workshops and contractors, and connect them with global-quality industrial products.",
    description:
      "MegaHaus is building Bangladesh's industrial marketplace across the country. As a Field Agent you represent MegaHaus in your own region, connect local businesses, and earn commission on the orders you bring in.",
    responsibilities: [
      "Visit factories, workshops, and contractors to introduce MegaHaus products",
      "Identify new customers and understand their machinery, tool, and maintenance needs",
      "Support customers with product information and connect them to the right supplier",
      "Collect market feedback and share leads with the MegaHaus team",
      "Help promote the MegaHaus brand in your assigned area",
    ],
    requirements: [
      "Valid National ID (NID) — required for verification",
      "Trade licence if you operate a shop or business (optional)",
      "Local knowledge of industrial areas, factories, or trade zones",
      "Strong communication skills in Bangla and basic English",
      "Self-motivated, reliable, and comfortable visiting sites independently",
    ],
    published: true,
    postedAt: new Date("2026-01-05").toISOString(),
  },
];

export function readJobs(): JobPosting[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(JOBS_KEY);
    if (!raw) {
      window.localStorage.setItem(JOBS_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JobPosting[]) : seed;
  } catch {
    return seed;
  }
}

export function writeJobs(items: JobPosting[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOBS_KEY, JSON.stringify(items));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function newJobId(): string {
  return `JOB-${Date.now().toString(36).toUpperCase()}`;
}

export function toCsv(rows: Record<string, string | number | undefined>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    headers.map(esc).join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
