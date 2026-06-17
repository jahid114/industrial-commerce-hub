import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, TrendingUp, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { agents } from "@/data/agents";
import { generateOrdersReport } from "@/lib/pdf";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBDT, formatDate } from "@/lib/format";
import { products } from "@/data/products";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }] }),
  component: AdminReportsPage,
});

const RED: [number, number, number] = [229, 57, 53];
const BLACK: [number, number, number] = [14, 14, 14];

function header(doc: jsPDF, title: string) {
  doc.setFillColor(...RED);
  doc.rect(0, 0, 210, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BLACK);
  doc.text("MEGAHAUS", 14, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Industrial Hub  |  Administrator Report", 14, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BLACK);
  doc.text(title, 196, 22, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 196, 27, { align: "right" });
}

function AdminReportsPage() {
  const { orders, quotations } = useStore();

  const agentReport = () => {
    const doc = new jsPDF();
    header(doc, "AGENT PERFORMANCE");
    autoTable(doc, {
      startY: 40,
      head: [["Agent ID", "Name", "Area", "Joined", "Orders", "Commission", "Status"]],
      body: agents.map((a) => [a.id, a.name, a.area, formatDate(a.joined), String(a.ordersSubmitted), formatBDT(a.commissionEarned), a.status]),
      theme: "grid",
      headStyles: { fillColor: BLACK, textColor: 255 },
      styles: { fontSize: 9 },
    });
    doc.save("megahaus-agents-report.pdf");
  };

  const inventoryReport = () => {
    const doc = new jsPDF();
    header(doc, "INVENTORY");
    autoTable(doc, {
      startY: 40,
      head: [["SKU", "Product", "Brand", "Category", "Stock", "Price"]],
      body: products.map((p) => [p.sku, p.name, p.brandId, p.categoryId, String(p.stock), formatBDT(p.price)]),
      theme: "grid",
      headStyles: { fillColor: BLACK, textColor: 255 },
      styles: { fontSize: 8 },
    });
    doc.save("megahaus-inventory-report.pdf");
  };

  const rfqReport = () => {
    const doc = new jsPDF();
    header(doc, "QUOTATIONS");
    autoTable(doc, {
      startY: 40,
      head: [["RFQ ID", "Date", "Product", "Customer", "Qty", "Status", "Quoted"]],
      body: quotations.map((q) => [q.id, formatDate(q.date), q.productName, q.customerName, String(q.quantity), q.status, q.quotedPrice ? formatBDT(q.quotedPrice) : "—"]),
      theme: "grid",
      headStyles: { fillColor: BLACK, textColor: 255 },
      styles: { fontSize: 8 },
    });
    doc.save("megahaus-rfqs-report.pdf");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate PDF reports for orders, agents, inventory and quotations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ReportCard icon={TrendingUp} title="Sales Report" desc="Full order history with totals" action={() => generateOrdersReport(orders, "Sales Report")} />
        <ReportCard icon={Users} title="Agent Performance" desc="Orders, commissions per agent" action={agentReport} />
        <ReportCard icon={Package} title="Inventory" desc="Stock levels and pricing" action={inventoryReport} />
        <ReportCard icon={FileText} title="Quotations" desc="All RFQs with status" action={rfqReport} />
      </div>
    </div>
  );
}

function ReportCard({ icon: Icon, title, desc, action }: { icon: typeof Package; title: string; desc: string; action: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex size-12 items-center justify-center bg-primary text-primary-foreground"><Icon className="size-6" /></div>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <Button onClick={action} className="mt-4 w-full font-semibold"><Download className="size-4 mr-2" /> Generate PDF</Button>
    </div>
  );
}
