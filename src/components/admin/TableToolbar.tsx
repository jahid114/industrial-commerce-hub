import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Search bar styled to match the Admin Orders table toolbar. */
export function TableSearchBar({
  value, onChange, placeholder, children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-sm"
      />
      {children}
    </div>
  );
}

/** Pagination footer styled to match the Admin Orders table. */
export function TablePagination({
  total, page, pageSize, onPageChange, onPageSizeChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-2">
          {total === 0 ? "0" : `${startIdx + 1}–${Math.min(startIdx + pageSize, total)}`} of {total}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => onPageChange(1)}>« First</Button>
        <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}>Prev</Button>
        <span className="px-3 text-xs text-muted-foreground">Page {currentPage} / {totalPages}</span>
        <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}>Next</Button>
        <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => onPageChange(totalPages)}>Last »</Button>
      </div>
    </div>
  );
}

/** Helper: derive the visible slice for a page. */
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
