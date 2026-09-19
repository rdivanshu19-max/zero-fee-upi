import { jsPDF } from "jspdf";
import { formatINR } from "./upi";

export type InvoiceMeta = {
  businessName: string;
  invoiceTitle: string;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  details: string;
  footerNote: string;
};

export type QrItem = { index: number; amount: number; dataUrl: string };

export type PdfLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

const INDIGO: [number, number, number] = [99, 91, 255];
const INK: [number, number, number] = [20, 22, 31];
const MUTED: [number, number, number] = [107, 114, 128];
const LINE: [number, number, number] = [232, 234, 242];

const PAGE_W = 210;
const PAGE_H = 297;
const M = 16;

function rupee(n: number) {
  // jsPDF core fonts lack the ₹ glyph, so use "Rs."
  return formatINR(n).replace("₹", "Rs. ");
}

export function buildInvoicePdf(opts: {
  meta: InvoiceMeta;
  total: number;
  upiId: string;
  payeeName: string;
  note: string;
  items: QrItem[];
}): jsPDF {
  const { meta, items } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  const header = () => {
    doc.setFillColor(...INDIGO);
    doc.rect(0, 0, PAGE_W, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CLOCK IT", M, 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Zero-fee UPI collection - split payments into scannable QR codes", M, 19.5);
    const right = meta.businessName.trim();
    if (right) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(right, PAGE_W - M, 13, { align: "right" });
    }
    y = 36;
  };

  const footer = (page: number, pages: number) => {
    doc.setDrawColor(...LINE);
    doc.line(M, PAGE_H - 16, PAGE_W - M, PAGE_H - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    const left = meta.footerNote.trim() || "Generated with CLOCK IT - clockit";
    doc.text(left.slice(0, 110), M, PAGE_H - 11);
    doc.text(`Page ${page} of ${pages}`, PAGE_W - M, PAGE_H - 11, { align: "right" });
  };

  header();

  // Title + meta
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(meta.invoiceTitle.trim() || "Payment Invoice", M, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  const metaLines: string[] = [];
  if (meta.invoiceNo.trim()) metaLines.push(`Invoice No: ${meta.invoiceNo.trim()}`);
  if (meta.invoiceDate.trim()) metaLines.push(`Date: ${meta.invoiceDate.trim()}`);
  if (meta.customerName.trim()) metaLines.push(`Billed to: ${meta.customerName.trim()}`);
  metaLines.push(`Pay to: ${opts.payeeName} (${opts.upiId})`);
  if (opts.note.trim()) metaLines.push(`Note: ${opts.note.trim()}`);
  metaLines.forEach((l) => {
    doc.text(l, M, y);
    y += 5;
  });

  // Custom bill details
  if (meta.details.trim()) {
    y += 3;
    doc.setDrawColor(...LINE);
    doc.line(M, y, PAGE_W - M, y);
    y += 6;
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Bill details", M, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(meta.details.trim(), PAGE_W - M * 2) as string[];
    lines.forEach((l) => {
      if (y > PAGE_H - 30) {
        doc.addPage();
        header();
      }
      doc.text(l, M, y);
      y += 4.6;
    });
  }

  // Total box
  y += 4;
  doc.setFillColor(243, 243, 255);
  doc.roundedRect(M, y, PAGE_W - M * 2, 18, 3, 3, "F");
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Total to collect", M + 6, y + 7);
  doc.text(`${items.length} QR code${items.length === 1 ? "" : "s"} - up to Rs. 1,999.00 each`, M + 6, y + 13);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(rupee(opts.total), PAGE_W - M - 6, y + 11, { align: "right" });
  y += 26;

  // QR grid: 3 per row
  const cols = 3;
  const gap = 6;
  const cardW = (PAGE_W - M * 2 - gap * (cols - 1)) / cols;
  const cardH = cardW + 16;

  items.forEach((item, i) => {
    const col = i % cols;
    if (col === 0 && y + cardH > PAGE_H - 22) {
      doc.addPage();
      header();
    }
    const x = M + col * (cardW + gap);
    doc.setDrawColor(...LINE);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, "FD");
    const img = cardW - 12;
    doc.addImage(item.dataUrl, "PNG", x + 6, y + 6, img, img);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(rupee(item.amount), x + cardW / 2, y + cardH - 7, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`QR ${item.index} of ${items.length}`, x + cardW / 2, y + cardH - 2.5, {
      align: "center",
    });
    if (col === cols - 1) y += cardH + gap;
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    footer(p, pages);
  }
  return doc;
}
