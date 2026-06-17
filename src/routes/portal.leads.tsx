import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";

export const Route = createFileRoute("/portal/leads")({
  component: LeadsPage,
});

const leads = [
  { id: "L-1042", name: "Rahim Textile Mills", contact: "Md. Tarek", phone: "+8801711-902341", interest: "Bosch GBH 2-26 × 30", stage: "Hot", est: 855000 },
  { id: "L-1041", name: "Padma Spinning Ltd.", contact: "Sumon Hasan", phone: "+8801812-554021", interest: "Siemens S7-1200 × 8", stage: "Quoted", est: 624000 },
  { id: "L-1040", name: "Bengal Auto Parts", contact: "Arif Mahmud", phone: "+8801913-330218", interest: "Makita GA9020 × 20", stage: "Warm", est: 316000 },
  { id: "L-1039", name: "Apex Garments", contact: "Nasrin Akter", phone: "+8801714-887701", interest: "ABB ACS580 × 4", stage: "New", est: 1240000 },
  { id: "L-1038", name: "Meghna Steel", contact: "Iqbal Hossain", phone: "+8801715-621199", interest: "Festo pneumatic kit", stage: "Closed Won", est: 482000 },
];

const stageColor: Record<string, string> = {
  Hot: "bg-destructive/10 text-destructive",
  Warm: "bg-accent/10 text-accent",
  Quoted: "bg-primary/10 text-primary",
  New: "bg-muted text-foreground",
  "Closed Won": "bg-success/10 text-success",
};

function LeadsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Leads</h1>
        <p className="text-sm text-muted-foreground">Track and convert customer inquiries in your territory.</p>
      </div>
      <div className="grid gap-3">
        {leads.map((l) => (
          <div key={l.id} className="rounded-lg border border-border bg-card p-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{l.id}</span>
                <Badge className={stageColor[l.stage]} variant="outline">{l.stage}</Badge>
              </div>
              <div className="font-display text-lg font-bold">{l.name}</div>
              <div className="text-sm text-muted-foreground">{l.contact} · {l.phone}</div>
              <div className="text-sm">Interest: <span className="font-medium">{l.interest}</span> · Est. value <span className="font-semibold text-primary">৳ {l.est.toLocaleString()}</span></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline"><Phone className="size-4 mr-1.5" />Call</Button>
              <Button size="sm" variant="outline"><Mail className="size-4 mr-1.5" />Email</Button>
              <Button size="sm">Convert to Order</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
