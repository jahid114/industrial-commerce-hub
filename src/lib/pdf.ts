import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order } from "@/data/types";
import { formatBDT, formatDate } from "./format";

const RED: [number, number, number] = [229, 57, 53];
const BLACK: [number, number, number] = [14, 14, 14];

function header(doc: jsPDF, title: string) {
  // Red bar
  doc.setFillColor(...RED);
  doc.rect(0, 0, 210, 8, "F");
  // Logo wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BLACK);
  doc.text("MEGAHAUS", 14, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Industrial Hub  |  megahausmarket.com", 14, 27);
  doc.text("Halishahar Housing Estate, Chittagong  |  +880 1978 981818", 14, 31);

  // Document title (right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BLACK);
  doc.text(title, 196, 22, { align: "right" });
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text("MegaHaus Industrial Hub  |  A Project by Protocol Cashmere Limited", 14, 290);
    doc.text(`Page ${i} of ${pages}`, 196, 290, { align: "right" });
  }
}

export function generateInvoice(order: Order) {
  const doc = new jsPDF();
  header(doc, "INVOICE");

  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(`Invoice No: ${order.id}`, 196, 30, { align: "right" });
  doc.text(`Date: ${formatDate(order.date)}`, 196, 35, { align: "right" });
  doc.text(`Status: ${order.status}`, 196, 40, { align: "right" });

  // Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BILL TO", 14, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(order.customerName, 14, 54);
  doc.text(order.customerEmail, 14, 59);
  const addrLines = doc.splitTextToSize(order.shippingAddress, 90);
  doc.text(addrLines, 14, 64);

  // Payment
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT", 130, 48);
  doc.setFont("helvetica", "normal");
  doc.text(`Method: ${order.paymentMethod}`, 130, 54);

  // Items table
  autoTable(doc, {
    startY: 82,
    head: [["#", "Product", "Qty", "Unit Price", "Subtotal"]],
    body: order.items.map((it, i) => [
      String(i + 1),
      it.name,
      String(it.quantity),
      formatBDT(it.unitPrice),
      formatBDT(it.unitPrice * it.quantity),
    ]),
    theme: "striped",
    headStyles: { fillColor: BLACK, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 12 },
      2: { halign: "right", cellWidth: 18 },
      3: { halign: "right", cellWidth: 30 },
      4: { halign: "right", cellWidth: 32 },
    },
    margin: { left: 14, right: 14 },
  });

  // Totals
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  const vat = Math.round(order.total * 0.05);
  const grand = order.total + vat;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Subtotal:", 150, finalY, { align: "right" });
  doc.text(formatBDT(order.total), 196, finalY, { align: "right" });
  doc.text("VAT (5%):", 150, finalY + 6, { align: "right" });
  doc.text(formatBDT(vat), 196, finalY + 6, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...RED);
  doc.text("TOTAL:", 150, finalY + 14, { align: "right" });
  doc.text(formatBDT(grand), 196, finalY + 14, { align: "right" });

  // Thank you
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Thank you for sourcing through MegaHaus Industrial Hub.", 14, finalY + 28);

  footer(doc);
  doc.save(`${order.id}.pdf`);
}

export function generateOrdersReport(orders: Order[], title = "Orders Report") {
  const doc = new jsPDF();
  header(doc, title.toUpperCase());

  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 14, 40);
  doc.text(`Total records: ${orders.length}`, 14, 45);

  autoTable(doc, {
    startY: 52,
    head: [["Order ID", "Date", "Customer", "Status", "Payment", "Total"]],
    body: orders.map((o) => [
      o.id,
      formatDate(o.date),
      o.customerName,
      o.status,
      o.paymentMethod,
      formatBDT(o.total),
    ]),
    theme: "grid",
    headStyles: { fillColor: BLACK, textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 5: { halign: "right" } },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  const total = orders.reduce((s, o) => s + o.total, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...RED);
  doc.text(`Grand Total: ${formatBDT(total)}`, 196, finalY, { align: "right" });

  footer(doc);
  doc.save(`megahaus-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
