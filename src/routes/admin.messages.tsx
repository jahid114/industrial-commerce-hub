import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Mail, Pencil, Plus, Trash2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { TableSearchBar, TablePagination, paginate } from "@/components/admin/TableToolbar";
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

type Draft = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: MessageStatus;
};

const emptyDraft: Draft = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  status: "New",
};

function MessagesPage() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | MessageStatus>("All");
  const [active, setActive] = useState<ContactMessage | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<ContactMessage | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [confirmDelete, setConfirmDelete] = useState<ContactMessage | null>(null);

  useEffect(() => {
    setItems(readMessages());
  }, []);

  const persist = (next: ContactMessage[]) => {
    setItems(next);
    writeMessages(next);
  };

  const setStatus = (id: string, status: MessageStatus) => {
    persist(items.map((m) => (m.id === id ? { ...m, status } : m)));
    setActive((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
  };

  const open = (m: ContactMessage) => {
    setActive(m);
    if ((m.status ?? "New") === "New") setStatus(m.id, "Read");
  };

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setFormOpen(true);
  };

  const openEdit = (m: ContactMessage) => {
    setEditing(m);
    setDraft({
      name: m.name,
      email: m.email,
      phone: m.phone ?? "",
      subject: m.subject,
      message: m.message,
      status: m.status ?? "New",
    });
    setFormOpen(true);
  };

  const saveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      persist(items.map((m) => (m.id === editing.id ? { ...m, ...draft } : m)));
      setActive((cur) => (cur && cur.id === editing.id ? { ...cur, ...draft } : cur));
    } else {
      const item: ContactMessage = {
        ...draft,
        id: `MSG-${Date.now().toString(36).toUpperCase()}`,
        submittedAt: new Date().toISOString(),
      };
      persist([...items, item]);
    }
    setFormOpen(false);
  };

  const remove = (m: ContactMessage) => {
    persist(items.filter((x) => x.id !== m.id));
    setConfirmDelete(null);
    setActive((cur) => (cur && cur.id === m.id ? null : cur));
  };

  const filtered = items
    .filter((m) => (filter === "All" ? true : (m.status ?? "New") === filter))
    .filter((m) =>
      q
        ? [m.name, m.email, m.phone ?? "", m.subject, m.id]
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase())
        : true,
    )
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

  const visible = paginate(filtered, page, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Contact Messages</h1>
          <p className="text-sm text-muted-foreground">
            Enquiries submitted through the public contact page.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-1.5" /> Add Message
        </Button>
      </div>

      <TableSearchBar
        value={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        placeholder="Search name, email, phone, subject"
      >
        <Select
          value={filter}
          onValueChange={(v) => {
            setFilter(v as typeof filter);
            setPage(1);
          }}
        >
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
      </TableSearchBar>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-spec text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Ref</th>
              <th className="px-4 py-3 text-left">From</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Received</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((m) => (
              <tr key={m.id} className="hover:bg-secondary/50">
                <td className="px-4 py-3 font-mono text-xs">{m.id}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </td>
                <td className="px-4 py-3">{m.phone || "—"}</td>
                <td className="px-4 py-3">{m.subject}</td>
                <td className="px-4 py-3">{formatDate(m.submittedAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={statusTone[m.status ?? "New"]}>
                    {m.status ?? "New"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => open(m)}>
                      <Eye className="size-4 mr-1.5" /> View
                    </Button>
                    <Button variant="outline" size="icon" className="size-8" onClick={() => openEdit(m)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 text-destructive"
                      onClick={() => setConfirmDelete(m)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-muted-foreground">
                  <Mail className="mx-auto mb-3 size-8 opacity-40" />
                  No messages yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        total={filtered.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

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
                  · {active.email}
                  {active.phone ? ` · ${active.phone}` : ""} · {formatDate(active.submittedAt)}
                </div>
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                  {active.message}
                </p>
                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <Button
                    variant={(active.status ?? "New") === "New" ? "outline" : "default"}
                    size="sm"
                    onClick={() =>
                      setStatus(active.id, (active.status ?? "New") === "Read" ? "New" : "Read")
                    }
                  >
                    <span
                      className={`mr-2 flex size-4 items-center justify-center rounded border ${
                        (active.status ?? "New") === "New"
                          ? "border-border"
                          : "border-transparent bg-success text-success-foreground"
                      }`}
                    >
                      {(active.status ?? "New") !== "New" && <Check className="size-3" />}
                    </span>
                    Read
                  </Button>
                  <Button
                    variant={active.status === "Resolved" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setStatus(active.id, active.status === "Resolved" ? "Read" : "Resolved")
                    }
                  >
                    {active.status === "Resolved" ? "Resolved" : "Mark Resolved"}
                  </Button>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Message" : "Add Message"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveDraft} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm">Name</Label>
                <Input
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Email</Label>
                <Input
                  type="email"
                  required
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-sm">Phone</Label>
                <Input
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft({ ...draft, status: v as MessageStatus })}
                >
                  <SelectTrigger>
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
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Subject</Label>
              <Input
                required
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Message</Label>
              <Textarea
                rows={5}
                required
                value={draft.message}
                onChange={(e) => setDraft({ ...draft, message: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? "Save Changes" : "Add Message"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete message?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmDelete?.subject} — this cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && remove(confirmDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
