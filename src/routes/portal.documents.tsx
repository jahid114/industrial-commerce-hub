import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/portal/documents")({
  component: DocumentsPage,
});

const docs = [
  { name: "MegaHaus Pitch Deck — Q2 2026", type: "PDF", size: "4.2 MB", updated: "2026-05-14", access: "Open" },
  { name: "Financial Model (3-year)", type: "XLSX", size: "1.8 MB", updated: "2026-05-10", access: "NDA" },
  { name: "Cap Table & Round Structure", type: "PDF", size: "640 KB", updated: "2026-04-28", access: "NDA" },
  { name: "Audited Financials FY2025", type: "PDF", size: "2.1 MB", updated: "2026-03-12", access: "NDA" },
  { name: "Supplier Agreements Summary", type: "PDF", size: "920 KB", updated: "2026-04-02", access: "Open" },
  { name: "Shareholders Agreement — Draft", type: "DOCX", size: "310 KB", updated: "2026-05-18", access: "NDA" },
];

function DocumentsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Deal Room</h1>
        <p className="text-sm text-muted-foreground">Investment & partnership documents. NDA-gated items require a signed agreement on file.</p>
      </div>
      <div className="grid gap-3">
        {docs.map((d) => (
          <div key={d.name} className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
            <FileText className="size-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-muted-foreground">{d.type} · {d.size} · Updated {d.updated}</div>
            </div>
            <Badge variant="outline" className={d.access === "NDA" ? "text-accent border-accent/40" : ""}>
              {d.access === "NDA" && <Lock className="size-3 mr-1" />}
              {d.access}
            </Badge>
            <Button size="sm" variant="outline"><Download className="size-4 mr-1.5" />Download</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
