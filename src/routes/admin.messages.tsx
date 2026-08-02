import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Search, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import {
  readMessages,
  writeMessages,
  type ContactMessage,
  type MessageStatus,
} from "@/lib/inbox";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({ meta: [{ title: "Contact Messages — MegaHaus Admin" }] }),
  component: MessagesPage,
});

const STATUSES: MessageStatus[] = ["New", "Read", "Resolved"];

const statusTone: Record<MessageStatus, string> = {
  New: "bg-primary/10 text-primary border-primary/30",
  Read: "bg-accent/10 text-accent border-accent/30",
  Resolved: "bg-success/10 text-success border-success/30",
};

function MessagesPage() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | MessageStatus>("All");
  const [active, setActive] = useState<ContactMessage | null>(null);

  useEffect(() => {
    setItems(readMessages());
  }, []);

  const setStatus = (id: string, status: MessageStatus) => {
    const next = items.map((m) => (m.id === id ? { ...m, status } : m));
    setItems(next);
    writeMessages(next);
    setActive((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
  };

  const open = (m: ContactMessage) => {
    setActive(m);
    if ((m.status ?? "New") === "New") setStatus(m.id, "Read");
  };

  const filtered = items
    .filter((m) => (filter === "All" ? true : (m.status ?? "New") === filter))
    .filter((m) =>
      q
        ? [m.name, m.email, m.subject, m.id]
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase())
        : true,
    )
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Contact Messages</h1>
        <p className="text-sm text-muted-foreground">
          Enquiries submitted through the public contact page.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, subject"
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Ref</th>
              <th className="px-4 py-3 text-left">From</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Received</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-secondary/50">
                <td className="px-4 py-3 font-mono text-xs">{m.id}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </td>
                <td className="px-4 py-3">{m.subject}</td>
                <td className="px-4 py-3">{formatDate(m.submittedAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={statusTone[m.status ?? "New"]}>
                    {m.status ?? "New"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => open(m)}>
                    <Eye className="size-4 mr-1.5" /> View
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-muted-foreground">
                  <Mail className="mx-auto mb-3 size-8 opacity-40" />
                  No messages yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  From <span className="font-semibold text-foreground">{active.name}</span>{" "}
                  · {active.email} · {formatDate(active.submittedAt)}
                </div>
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                  {active.message}
                </p>
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <span className="text-sm font-semibold">Status</span>
                  <Select
                    value={active.status ?? "New"}
                    onValueChange={(v) => setStatus(active.id, v as MessageStatus)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button asChild variant="outline" size="sm" className="ml-auto">
                    <a href={`mailto:${active.email}?subject=Re: ${active.subject}`}>
                      Reply by email
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
