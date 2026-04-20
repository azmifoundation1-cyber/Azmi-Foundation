import { jsPDF } from "jspdf";

// Azmi Foundation — All Legal Credentials
const ORG = {
  name: "AZMI FOUNDATION",
  pan: "AAGTA9354B",
  // 80G Details
  reg80G: "AAGTA9354BF20261",
  doc80G: "AAGTA9354BF2026101",
  section80G: "80G — Sub-clause (A) of clause (iv) of first proviso to sub-section (5) of section 80G",
  approval80G: "06-04-2026",
  valid80GFrom: "AY 2026-27",
  valid80GTo: "AY 2028-29",
  // 12A Details
  reg12A: "AAGTA9354BE2025101",
  // CSR-1 Details
  csr1: "CSR00108803",
  // NGO Darpan Details
  darpanId: "GJ/2021/0276308",
  regNo: "E/22280/AHMEDABAD",
  regDate: "23-07-2018",
  address: "1962/8 Magan Kumbhar Ni Chali, Gomtipur, Ahmedabad – 380021, Gujarat, India",
  email: "azmifoundation786@gmail.com",
  upi: "8320218861@okbizaxis",
  bank: "Axis Bank | A/C: 921020009805552 | IFSC: UTIB0000453",
};

// Convert number to Indian words
function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num === 0) return "Zero";

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }

  return convert(num) + " Rupees Only";
}

export interface ReceiptData {
  receiptNo: string;
  paymentId: string;
  donationDate: string;
  donorName: string;
  donorPan: string;
  donorPhone: string;
  donorEmail: string;
  donorAddress: string;
  donorCity: string;
  donorState: string;
  donorPincode: string;
  amount: number;
  campaignTitle: string;
  paymentMethod?: string;
}

export async function generate80GReceipt(data: ReceiptData): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 15;
  const innerW = W - margin * 2;
  let y = 0;

  // ── Helper functions ──
  const line = (x1: number, y1: number, x2: number, y2: number, color = "#cccccc", lw = 0.3) => {
    doc.setDrawColor(color);
    doc.setLineWidth(lw);
    doc.line(x1, y1, x2, y2);
  };

  const rect = (x: number, yp: number, w: number, h: number, fill: string) => {
    doc.setFillColor(fill);
    doc.rect(x, yp, w, h, "F");
  };

  const text = (txt: string, x: number, yp: number, opts: {
    size?: number; bold?: boolean; color?: string; align?: "left" | "center" | "right"; italic?: boolean;
  } = {}) => {
    doc.setFontSize(opts.size ?? 10);
    doc.setFont("helvetica", opts.bold ? (opts.italic ? "bolditalic" : "bold") : (opts.italic ? "italic" : "normal"));
    doc.setTextColor(opts.color ?? "#1a1a1a");
    doc.text(txt, x, yp, { align: opts.align ?? "left" });
  };

  // ── HEADER BACKGROUND ──
  rect(0, 0, W, 52, "#1a1a2e");

  // Logo placeholder — draw white circle with "AF"
  doc.setFillColor("#ffffff");
  doc.circle(margin + 12, 18, 10, "F");
  doc.setFillColor("#1a1a2e");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#1a1a2e");
  doc.text("AF", margin + 9.5, 19.5);

  // Try loading the logo image
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
        doc.addImage(dataUrl, "JPEG", margin + 2, 8, 20, 20);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = "/logo.png";
    });
  } catch (_) {}

  // Org name in header
  text("AZMI FOUNDATION", margin + 26, 16, { size: 16, bold: true, color: "#ffffff" });
  text("Promoting Interfaith Harmony & Sustainable Development", margin + 26, 22, { size: 7.5, color: "#aaaacc" });
  text(ORG.address, margin + 26, 28, { size: 6.5, color: "#9999bb" });

  // Gold divider in header
  doc.setDrawColor("#d4af37");
  doc.setLineWidth(0.8);
  doc.line(margin, 35, W - margin, 35);

  // Credentials row in header — PAN, 80G, 12A, CSR-1, Darpan
  text(`PAN: ${ORG.pan}`, margin + 26, 40, { size: 6.5, color: "#ccccdd" });
  text(`80G: ${ORG.reg80G}`, margin + 26, 45, { size: 6.5, color: "#ccccdd" });
  text(`12A: ${ORG.reg12A}`, margin + 26, 50, { size: 6.5, color: "#ccccdd" });
  text(`CSR-1: ${ORG.csr1}`, W / 2, 40, { size: 6.5, color: "#d4af37", align: "center" });
  text(`NGO Darpan: ${ORG.darpanId}`, W / 2, 45, { size: 6.5, color: "#d4af37", align: "center" });
  text(`Approved: ${ORG.approval80G} | Valid: ${ORG.valid80GFrom}–${ORG.valid80GTo}`, W - margin, 40, { size: 6.5, color: "#aaaacc", align: "right" });
  text(`Estd: ${ORG.regDate} | Reg: ${ORG.regNo}`, W - margin, 45, { size: 6.5, color: "#aaaacc", align: "right" });

  y = 58;

  // ── RECEIPT TITLE ──
  rect(0, y - 2, W, 13, "#f8f6f0");
  text("DONATION RECEIPT", W / 2, y + 6, { size: 14, bold: true, color: "#1a1a2e", align: "center" });
  text("(Under Section 80G of Income Tax Act, 1961)", W / 2, y + 11, { size: 7, color: "#888888", align: "center", italic: true });
  y += 18;

  // ── RECEIPT META ROW ──
  rect(margin, y, innerW, 12, "#1a1a2e");
  text(`Receipt No: ${data.receiptNo}`, margin + 4, y + 7.5, { size: 8, bold: true, color: "#ffffff" });
  text(`Date: ${data.donationDate}`, W / 2, y + 7.5, { size: 8, color: "#ccccdd", align: "center" });
  text(`Payment ID: ${data.paymentId}`, W - margin - 4, y + 7.5, { size: 8, color: "#d4af37", align: "right" });
  y += 17;

  // ── AMOUNT HIGHLIGHT BOX ──
  rect(margin, y, innerW, 18, "#f0f8f0");
  line(margin, y, margin, y + 18, "#2d7a2d", 1.5);
  text("DONATION AMOUNT", margin + 5, y + 6, { size: 7, bold: true, color: "#555555" });
  text(`Rs. ${data.amount.toLocaleString("en-IN")}`, margin + 5, y + 13, { size: 18, bold: true, color: "#1a7a1a" });
  text(`(${numberToWords(data.amount)})`, W - margin - 4, y + 13, { size: 8, italic: true, color: "#555555", align: "right" });
  text(`Campaign: ${data.campaignTitle}`, margin + 5, y + 17, { size: 6.5, color: "#888888" });
  y += 24;

  // ── SECTION HEADING: DONOR DETAILS ──
  rect(margin, y, innerW, 7, "#e8e4f0");
  line(margin, y, margin + 3, y, "#1a1a2e", 3);
  text("DONOR DETAILS", margin + 5, y + 5, { size: 8, bold: true, color: "#1a1a2e" });
  y += 11;

  const field = (label: string, value: string, xLeft: number, yp: number, half = false) => {
    const colW = half ? innerW / 2 - 3 : innerW;
    rect(xLeft, yp, colW, 10, "#fafafa");
    line(xLeft, yp, xLeft + colW, yp, "#eeeeee");
    line(xLeft, yp + 10, xLeft + colW, yp + 10, "#eeeeee");
    text(label.toUpperCase(), xLeft + 3, yp + 4, { size: 5.5, color: "#999999", bold: true });
    text(value || "—", xLeft + 3, yp + 8.5, { size: 8.5, bold: true, color: "#1a1a2e" });
  };

  // Row 1: Name (full width)
  field("Full Name", data.donorName, margin, y);
  y += 12;

  // Row 2: PAN + Phone (half/half)
  field("PAN Number", data.donorPan, margin, y, true);
  field("Mobile Number", data.donorPhone, margin + innerW / 2 + 3, y, true);
  y += 12;

  // Row 3: Email (full width)
  field("Email Address", data.donorEmail, margin, y);
  y += 12;

  // Row 4: Address (full width)
  field("Address", data.donorAddress, margin, y);
  y += 12;

  // Row 5: City + State + Pincode
  const third = innerW / 3 - 2;
  field("City", data.donorCity, margin, y, false);
  rect(margin + third + 2, y, third, 10, "#fafafa");
  line(margin + third + 2, y, margin + third * 2 + 2, y, "#eeeeee");
  line(margin + third + 2, y + 10, margin + third * 2 + 2, y + 10, "#eeeeee");
  text("STATE", margin + third + 5, y + 4, { size: 5.5, color: "#999999", bold: true });
  text(data.donorState || "—", margin + third + 5, y + 8.5, { size: 8.5, bold: true, color: "#1a1a2e" });

  rect(margin + third * 2 + 4, y, third, 10, "#fafafa");
  line(margin + third * 2 + 4, y, margin + third * 3 + 4, y, "#eeeeee");
  line(margin + third * 2 + 4, y + 10, margin + third * 3 + 4, y + 10, "#eeeeee");
  text("PIN CODE", margin + third * 2 + 7, y + 4, { size: 5.5, color: "#999999", bold: true });
  text(data.donorPincode || "—", margin + third * 2 + 7, y + 8.5, { size: 8.5, bold: true, color: "#1a1a2e" });
  y += 14;

  // ── SECTION HEADING: 80G DETAILS ──
  rect(margin, y, innerW, 7, "#fff8e8");
  line(margin, y, margin + 3, y, "#d4af37", 3);
  text("80G REGISTRATION DETAILS (Income Tax Act, 1961)", margin + 5, y + 5, { size: 8, bold: true, color: "#7a5c00" });
  y += 11;

  // Two column 80G grid
  const col1 = margin;
  const col2 = margin + innerW / 2 + 2;
  const hw = innerW / 2 - 2;

  const gfield = (label: string, value: string, x: number, yp: number) => {
    rect(x, yp, hw, 9, "#fffdf5");
    line(x, yp, x + hw, yp, "#f0d890");
    line(x, yp + 9, x + hw, yp + 9, "#f0d890");
    text(label, x + 3, yp + 3.5, { size: 5.5, color: "#a07000", bold: true });
    text(value, x + 3, yp + 7.5, { size: 7.5, bold: true, color: "#5a3c00" });
  };

  gfield("ORGANIZATION PAN", ORG.pan, col1, y);
  gfield("ORGANIZATION NAME", ORG.name, col2, y);
  y += 11;
  gfield("80G REGISTRATION NUMBER", ORG.reg80G, col1, y);
  gfield("DOCUMENT ID NUMBER", ORG.doc80G, col2, y);
  y += 11;
  gfield("DATE OF 80G APPROVAL", ORG.approval80G, col1, y);
  gfield("VALID FOR ASSESSMENT YEARS", `${ORG.valid80GFrom} to ${ORG.valid80GTo}`, col2, y);
  y += 11;
  gfield("12A REGISTRATION NUMBER", ORG.reg12A, col1, y);
  gfield("CSR-1 REGISTRATION NUMBER", ORG.csr1, col2, y);
  y += 11;
  gfield("NGO DARPAN ID", ORG.darpanId, col1, y);
  gfield("TRUST REG. NUMBER", ORG.regNo, col2, y);
  y += 13;

  // Section reference box
  rect(margin, y, innerW, 8, "#fffdf5");
  doc.setDrawColor("#f0d890");
  doc.setLineWidth(0.3);
  doc.rect(margin, y, innerW, 8);
  text("80G SECTION: ", margin + 3, y + 5, { size: 6.5, bold: true, color: "#a07000" });
  text(ORG.section80G, margin + 26, y + 5, { size: 6.5, color: "#5a3c00", italic: true });
  y += 13;

  // ── CERTIFICATION TEXT ──
  rect(margin, y, innerW, 18, "#f0f8f0");
  doc.setDrawColor("#2d7a2d");
  doc.setLineWidth(0.4);
  doc.rect(margin, y, innerW, 18);

  const certText = [
    `This is to certify that ${data.donorName} has made a donation of Rs. ${data.amount.toLocaleString("en-IN")}`,
    `(${numberToWords(data.amount)}) to AZMI FOUNDATION on ${data.donationDate}.`,
    "This donation is eligible for deduction under Section 80G of the Income Tax Act, 1961.",
    "The deduction is subject to provisions of the Act and rules made thereunder.",
  ];

  certText.forEach((line, i) => {
    text(line, W / 2, y + 5 + i * 3.8, { size: 6.8, color: "#1a4a1a", align: "center", italic: i > 1 });
  });
  y += 23;

  // ── SIGNATURE & STAMP ──
  line(margin, y, margin + 55, y, "#1a1a2e", 0.5);
  line(W - margin, y, W - margin - 55, y, "#1a1a2e", 0.5);
  text("Authorized Signatory", margin, y + 4, { size: 7, color: "#555555" });
  text("AZMI FOUNDATION", margin, y + 8, { size: 7.5, bold: true, color: "#1a1a2e" });
  text("Received & Acknowledged", W - margin, y + 4, { size: 7, color: "#555555", align: "right" });
  text("(Seal & Stamp)", W - margin, y + 8, { size: 7.5, color: "#888888", align: "right", italic: true });
  y += 18;

  // ── FOOTER ──
  rect(0, y, W, 22, "#1a1a2e");
  text("This receipt is system-generated and valid without physical signature.", W / 2, y + 5, { size: 6.5, color: "#9999bb", align: "center", italic: true });

  line(margin, y + 8, W - margin, y + 8, "#333355", 0.3);

  text(`Email: ${ORG.email}`, margin, y + 13, { size: 6.5, color: "#8888aa" });
  text(`UPI: ${ORG.upi}`, W / 2, y + 13, { size: 6.5, color: "#8888aa", align: "center" });
  text(`Bank: ${ORG.bank}`, W - margin, y + 13, { size: 5.5, color: "#666688", align: "right" });
  text("© AZMI FOUNDATION — All Rights Reserved", W / 2, y + 19, { size: 6, color: "#555577", align: "center" });

  // ── WATERMARK ──
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.04 }));
  doc.setFontSize(60);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#1a1a2e");
  doc.text("AZMI FOUNDATION", W / 2, 180, { align: "center", angle: 45 });
  doc.restoreGraphicsState();

  // Save
  const filename = `80G_Receipt_${data.receiptNo}_AzmiFoundation.pdf`;
  doc.save(filename);
}
