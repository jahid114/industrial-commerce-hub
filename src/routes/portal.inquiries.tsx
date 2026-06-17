import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/inquiries")({
  component: InquiriesPage,
});

const seed = [
  { id: "INQ-204", topic: "Series A participation", amount: "USD 1.2M", status: "In Due Diligence", date: "2026-05-22" },
  { id: "INQ-198", topic: "Warehouse JV — Chittagong", amount: "USD 480K", status: "Term Sheet", date: "2026-05-08" },
  { id: "INQ-191", topic: "Exclusive distribution — Festo", amount: "—", status: "Negotiation", date: "2026-04-19" },
];

function InquiriesPage() {
  const [items, setItems] = useState(seed);
  const [topic, setTopic] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !message) return;
    setItems((xs) => [{ id: `INQ-${205 + xs.length}`, topic, amount: amount || "—", status: "Received", date: new Date().toISOString().slice(0, 10) }, ...xs]);
    setTopic(""); setAmount(""); setMessage("");
    toast.success("Inquiry submitted — our team will follow up within 48h.");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Inquiries</h1>
          <p className="text-sm text-muted-foreground">Your open partnership and investment threads with MegaHaus.</p>
        </div>
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-spec text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Ref</th>
                <th className="px-4 py-3 text-left">Topic</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="px-4 py-3 font-mono text-xs">{it.id}</td>
                  <td className="px-4 py-3">{it.topic}</td>
                  <td className="px-4 py-3">{it.amount}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{it.status}</Badge></td>
                  <td className="px-4 py-3">{it.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5 space-y-3 h-fit">
        <h2 className="font-display text-lg font-bold">New Inquiry</h2>
        <div><Label className="mb-1.5 block text-xs uppercase tracking-wider">Topic</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Series A participation" /></div>
        <div><Label className="mb-1.5 block text-xs uppercase tracking-wider">Indicative amount</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="USD / BDT (optional)" /></div>
        <div><Label className="mb-1.5 block text-xs uppercase tracking-wider">Message</Label><Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
        <Button type="submit" className="w-full font-bold uppercase">Submit</Button>
      </form>
    </div>
  );
}
