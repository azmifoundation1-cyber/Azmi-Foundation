import { jsPDF } from "jspdf";

export interface CafPdfOptions {
  cafId: string;
  campaignerName: string;
  campaignerPhone: string;
  beneficiaryName?: string;
  purpose?: string;
  targetAmount?: string;
  hospital?: string;
  campaignTitle?: string;
  signatureDataUrl: string;
  signedAt: string;
  generatedByAdmin?: boolean;
  adminName?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    screenSize?: string;
    language?: string;
    timezone?: string;
  };
  ipAddress?: string;
}

async function loadImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateCAFPdf(opts: CafPdfOptions): Promise<void> {
  const [sealDataUrl, authSigDataUrl, logoDataUrl] = await Promise.all([
    loadImageAsDataUrl("/trust-seal.png"),
    loadImageAsDataUrl("/azmi-auth-signature.png"),
    loadImageAsDataUrl("/logo.png"),
  ]);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 14;
  const contentW = W - margin * 2;
  const HEADER_H = 22;
  let y = HEADER_H + 6;

  const checkY = (need: number = 8) => {
    if (y + need > 285) { doc.addPage(); y = HEADER_H + 6; drawHeader(); }
  };

  function drawHeader() {
    doc.setFillColor(10, 36, 99);
    doc.rect(0, 0, W, HEADER_H, "F");
    // Logo on the left
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, "PNG", margin, 2, 18, 18); } catch (_) {}
    }
    const textX = logoDataUrl ? margin + 21 : margin;
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("AZMI FOUNDATION", textX, 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("Reg. No: E/22280/AHMEDABAD  |  PAN: AAGTA9354B  |  80G & 12A Registered  |  Gomtipur, Ahmedabad 380021", textX, 17);
    doc.setTextColor(0, 0, 0);
  }

  function secTitle(title: string) {
    checkY(10);
    doc.setFillColor(237, 242, 255);
    doc.rect(margin, y - 4.5, contentW, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(10, 36, 99);
    doc.text(title, margin + 2, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  function body(t: string, size = 7.5, indent = 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(t, contentW - indent);
    checkY(lines.length * 4);
    doc.text(lines, margin + indent, y);
    y += lines.length * 4 + 0.5;
  }

  function bold(t: string, size = 7.5) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(20, 20, 20);
    doc.text(t, margin, y);
    y += 4.5;
  }

  function infoRow(label: string, value?: string) {
    if (!value) return;
    checkY(5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(label + ":", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(value, margin + 46, y);
    y += 5;
  }

  function divider() {
    doc.setDrawColor(210, 210, 210);
    doc.line(margin, y, W - margin, y);
    y += 3;
  }

  // ── PAGE 1 ────────────────────────────────────────────────────────────────
  drawHeader();

  // Trust seal — top right overlapping header/title boundary
  if (sealDataUrl) {
    try { doc.addImage(sealDataUrl, "PNG", W - margin - 28, 8, 26, 26); } catch (_) {}
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(10, 36, 99);
  doc.text("CONSENT AGREEMENT FOR FUNDRAISING (CAF)", margin, y);
  y += 5.5;

  // Meta row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`CAF ID: ${opts.cafId}  |  Date: ${opts.signedAt}`, margin, y);
  if (opts.generatedByAdmin) {
    const cmName = opts.adminName || "Azmi Foundation Admin";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(10, 36, 99);
    doc.text(`Campaign Manager: ${cmName}`, W - margin - 28, y, { align: "right" });
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    if (opts.ipAddress) doc.text(`IP: ${opts.ipAddress}`, W - margin - 28, y, { align: "right" });
  }
  y += 5;
  divider();

  // Parties (condensed)
  secTitle("PARTIES TO THIS AGREEMENT");
  body('This CAF is signed and executed in Ahmedabad, Gujarat, India between:');
  y += 1;
  bold("AZMI FOUNDATION (Platform)");
  body('Public Charitable Trust | Reg. No. E/22280/AHMEDABAD | PAN: AAGTA9354B | 80G & 12A Registered | Gomtipur, Ahmedabad 380021. (Hereinafter "AZMI" or "the Platform")');
  y += 1;
  bold("AND");
  body(`${opts.campaignerName} — acting as Beneficiary / Patient / Legal Guardian / authorised Representative. (Hereinafter "CAMPAIGNER")`);
  y += 2;
  divider();

  // Campaign Details — two-column layout
  secTitle("CAMPAIGN DETAILS");
  const col1 = margin;
  const col2 = margin + contentW / 2 + 2;
  const cW = contentW / 2 - 4;
  const detailRows: [string, string | undefined, string, string | undefined][] = [
    ["Campaign Title", opts.campaignTitle || opts.purpose, "Beneficiary", opts.beneficiaryName],
    ["Purpose", opts.purpose, "Target Amount", opts.targetAmount ? `Rs. ${Number(opts.targetAmount).toLocaleString("en-IN")}` : undefined],
    ["Hospital", opts.hospital, "Campaigner Phone", opts.campaignerPhone],
  ];
  for (const [l1, v1, l2, v2] of detailRows) {
    checkY(6);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(80, 80, 80);
    doc.text(l1 + ":", col1, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(20, 20, 20);
    const lines1 = doc.splitTextToSize(v1 || "\u2014", cW);
    doc.text(lines1, col1, y + 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(80, 80, 80);
    doc.text(l2 + ":", col2, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(20, 20, 20);
    const lines2 = doc.splitTextToSize(v2 || "\u2014", cW);
    doc.text(lines2, col2, y + 4);
    y += Math.max(lines1.length, lines2.length) * 4 + 7;
  }
  y += 1;
  divider();

  // Clauses
  secTitle("AGREEMENT CLAUSES");
  const clauses = [
    "1. Campaign commences on signing. AZMI does not guarantee achievement of the target amount.",
    "2. Funds raised shall be used only for the purpose mentioned in this agreement.",
    "3. AZMI has exclusive rights to all personal information, photos, videos, medical records and KYC documents provided.",
    "4. Campaigner grants AZMI perpetual rights to use the above information on platform, social media and promotional materials.",
    "5. AZMI charges zero platform fee. Only actual third-party charges (payment gateway, marketing, GST) shall be deducted per Annexure A.",
    "6. AZMI may communicate with the Campaigner via email, SMS, WhatsApp or calls for campaign updates.",
    "7. AZMI shall provide periodic updates on funds raised and balance available to the Campaigner.",
    "8. Any dispute shall first be resolved through AZMI's two-tier escalation matrix before legal proceedings.",
    "9. AZMI shall release funds only after verification of proper invoices and supporting documents.",
    "10. Excess or terminated campaign funds may be refunded to donors or used for similar causes with transparency.",
    "11. Misrepresentation or fraud by the Campaigner leads to immediate campaign termination and possible legal action.",
    "12. The Campaigner agrees to indemnify AZMI against any claims arising due to incorrect information provided.",
    "13. The Campaigner has read, understood and voluntarily agreed to all terms of this agreement.",
    "14. Governed by laws of India. Exclusive jurisdiction: Ahmedabad, Gujarat.",
  ];
  for (const clause of clauses) {
    checkY(6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(clause, contentW - 3);
    doc.text(lines, margin + 3, y);
    y += lines.length * 3.8 + 1;
  }
  y += 2;
  divider();

  // Annexure A — inline compact table
  secTitle("Annexure A — Indicative Expense Break-up");
  const tRows = [
    ["Platform Fee by AZMI", "0% (Zero)"],
    ["Payment Gateway Charges", "~2%"],
    ["Marketing Charges", "As applicable"],
    ["GST & Taxes", "18% on applicable charges"],
  ];
  const tc = [130, 44];
  let tY = y + 1;
  // header row
  doc.setFillColor(10, 36, 99);
  doc.rect(margin, tY - 4, tc[0], 6, "F");
  doc.rect(margin + tc[0], tY - 4, tc[1], 6, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
  doc.text("Description", margin + 2, tY);
  doc.text("Rate", margin + tc[0] + 2, tY);
  tY += 6;
  tRows.forEach((row, ri) => {
    doc.setFillColor(ri % 2 === 0 ? 245 : 255, ri % 2 === 0 ? 248 : 255, 255);
    doc.rect(margin, tY - 4, tc[0], 6, "F");
    doc.rect(margin + tc[0], tY - 4, tc[1], 6, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(30, 30, 30);
    doc.text(row[0], margin + 2, tY);
    doc.text(row[1], margin + tc[0] + 2, tY);
    tY += 6;
  });
  y = tY + 3;
  doc.setTextColor(0, 0, 0);

  // ── PAGE 2: Signature ─────────────────────────────────────────────────────
  checkY(100);
  divider();
  secTitle("DIGITAL SIGNATURE & VERIFICATION");
  body("I have read and understood all the above terms and voluntarily give my electronic consent under the Information Technology Act, 2000.");
  y += 3;

  const sigBoxY = y;
  // Signature box
  doc.setDrawColor(10, 36, 99); doc.setLineWidth(0.4);
  doc.rect(margin, sigBoxY, 76, 32);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
  doc.text("Signature of Campaigner", margin + 2, sigBoxY + 5);
  try {
    if (opts.signatureDataUrl && opts.signatureDataUrl.length > 50) {
      doc.addImage(opts.signatureDataUrl, "PNG", margin + 1, sigBoxY + 7, 74, 22);
    }
  } catch (_) {}

  // Signer meta — right column
  const rx = margin + 82;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(40, 40, 40);
  doc.text(`Name: ${opts.campaignerName}`, rx, sigBoxY + 6);
  doc.text(`Phone: ${opts.campaignerPhone}`, rx, sigBoxY + 11);
  doc.text(`CAF ID: ${opts.cafId}`, rx, sigBoxY + 16);
  const signedLine = doc.splitTextToSize(`Signed At: ${opts.signedAt}`, contentW - 82);
  doc.text(signedLine, rx, sigBoxY + 21);
  if (opts.ipAddress) doc.text(`IP: ${opts.ipAddress}`, rx, sigBoxY + 21 + signedLine.length * 4);
  if (opts.generatedByAdmin) {
    doc.setTextColor(180, 80, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Generated By: ${opts.adminName || "Azmi Foundation Admin"}`, rx, sigBoxY + 29);
    doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 40);
  }
  y = sigBoxY + 36;

  // Authorised signature image
  checkY(28);
  y += 2;
  if (authSigDataUrl) {
    try { doc.addImage(authSigDataUrl, "PNG", margin, y, 65, 24); } catch (_) {}
  }
  y += 26;
  divider();

  // Device info (compact)
  if (opts.deviceInfo && Object.keys(opts.deviceInfo).length > 0) {
    checkY(24);
    secTitle("TECHNICAL VERIFICATION RECORD");
    const di = opts.deviceInfo;
    const devParts: string[] = [];
    if (di.platform) devParts.push(`Platform: ${di.platform}`);
    if (di.screenSize) devParts.push(`Screen: ${di.screenSize}`);
    if (di.language) devParts.push(`Language: ${di.language}`);
    if (di.timezone) devParts.push(`Timezone: ${di.timezone}`);
    if (opts.ipAddress) devParts.push(`IP: ${opts.ipAddress}`);
    body(devParts.join("  |  "), 7);
    if (di.userAgent) {
      checkY(8);
      doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(120, 120, 120);
      const ua = doc.splitTextToSize(`UA: ${di.userAgent}`, contentW);
      doc.text(ua.slice(0, 2), margin, y);
      y += Math.min(ua.length, 2) * 3.5 + 1;
    }
    y += 2;
    divider();
  }

  // Footer
  doc.setFont("helvetica", "italic"); doc.setFontSize(6.5); doc.setTextColor(140, 140, 140);
  const footer = "This document is electronically executed under the Information Technology Act, 2000 and is legally binding. " +
    "Azmi Foundation | Gomtipur, Ahmedabad 380021 | +91 78610 10850 | support@azmifoundation.com";
  const fLines = doc.splitTextToSize(footer, contentW);
  checkY(fLines.length * 3.5 + 2);
  doc.text(fLines, margin, y);

  doc.save(`CAF_${opts.cafId}_${opts.campaignerName.replace(/\s+/g, "_")}.pdf`);
}
