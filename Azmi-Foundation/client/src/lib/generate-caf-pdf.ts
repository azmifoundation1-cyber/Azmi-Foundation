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
  // Campaigner verification
  signedAt: string;
  ipAddress?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    screenSize?: string;
    language?: string;
    timezone?: string;
  };
  // Campaign Manager (admin) details
  generatedByAdmin?: boolean;
  adminName?: string;
  adminSignedAt?: string;
  adminIpAddress?: string;
  adminDeviceInfo?: {
    userAgent?: string;
    platform?: string;
    screenSize?: string;
    language?: string;
    timezone?: string;
  };
}

async function loadImg(src: string): Promise<string | null> {
  try {
    const blob = await (await fetch(src)).blob();
    return await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function generateCAFPdf(opts: CafPdfOptions): Promise<void> {
  const [sealUrl, authSigUrl, logoUrl] = await Promise.all([
    loadImg("/trust-seal.png"),
    loadImg("/azmi-auth-signature.png"),
    loadImg("/logo.png"),
  ]);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const M = 14;
  const CW = W - M * 2;
  const HDR = 22;
  let y = HDR + 5;

  const chk = (need = 8) => {
    if (y + need > 283) { doc.addPage(); y = HDR + 5; hdr(); }
  };

  function hdr() {
    doc.setFillColor(10, 36, 99);
    doc.rect(0, 0, W, HDR, "F");
    if (logoUrl) { try { doc.addImage(logoUrl, "PNG", M, 2, 18, 18); } catch (_) {} }
    const tx = logoUrl ? M + 21 : M;
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text("AZMI FOUNDATION", tx, 10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
    doc.text("Reg. No: E/22280/AHMEDABAD  |  PAN: AAGTA9354B  |  80G & 12A Registered  |  Gomtipur, Ahmedabad 380021", tx, 17);
    doc.setTextColor(0, 0, 0);
  }

  function sec(title: string) {
    chk(10);
    doc.setFillColor(237, 242, 255);
    doc.rect(M, y - 4.5, CW, 7, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(10, 36, 99);
    doc.text(title, M + 2, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  function txt(t: string, sz = 7.5, indent = 0, color = [40, 40, 40] as [number,number,number]) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(sz); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(t, CW - indent);
    chk(lines.length * 4);
    doc.text(lines, M + indent, y);
    y += lines.length * 4 + 0.5;
  }

  function bld(t: string, sz = 7.5) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(sz); doc.setTextColor(20, 20, 20);
    chk(5); doc.text(t, M, y); y += 4.5;
  }

  function row(label: string, value: string | undefined, x = M, w = CW, yOffset?: number) {
    if (!value) return;
    const curY = yOffset !== undefined ? yOffset : y;
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(90, 90, 90);
    doc.text(label + ":", x, curY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(value, w - 38);
    doc.text(lines, x + 38, curY);
    if (yOffset === undefined) y += lines.length * 4.2 + 0.5;
    return lines.length;
  }

  function div() {
    doc.setDrawColor(210, 210, 210); doc.line(M, y, W - M, y); y += 3;
  }

  function deviceStr(d?: CafPdfOptions["deviceInfo"]) {
    if (!d) return "";
    const parts: string[] = [];
    if (d.platform) parts.push(d.platform);
    if (d.screenSize) parts.push(d.screenSize);
    if (d.language) parts.push(d.language);
    if (d.timezone) parts.push(d.timezone);
    return parts.join("  ·  ");
  }

  // ── PAGE 1 ──────────────────────────────────────────────────────────────────
  hdr();

  // Title
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(10, 36, 99);
  doc.text("CONSENT AGREEMENT FOR FUNDRAISING (CAF)", M, y);
  y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(110, 110, 110);
  doc.text(`CAF ID: ${opts.cafId}   |   Generated: ${opts.signedAt}`, M, y);
  y += 6;
  div();

  // Parties
  sec("PARTIES TO THIS AGREEMENT");
  txt('This CAF is signed and executed in Ahmedabad, Gujarat, India between:');
  y += 1;
  bld("AZMI FOUNDATION (Platform)");
  txt('Public Charitable Trust | Reg. No. E/22280/AHMEDABAD | PAN: AAGTA9354B | 80G & 12A | Gomtipur, Ahmedabad 380021. ("AZMI" / "Platform")');
  y += 1; bld("AND");
  txt(`${opts.campaignerName} — acting as Beneficiary / Patient / Legal Guardian / authorised Representative. ("CAMPAIGNER")`);
  y += 2; div();

  // Campaign Details (seal overlaps top-right corner of this block)
  const detailStartY = y;
  sec("CAMPAIGN DETAILS");
  const col2 = M + CW / 2 + 2;
  const cw2 = CW / 2 - 6;
  const detRows: [string, string | undefined, string, string | undefined][] = [
    ["Campaign Title", opts.campaignTitle || opts.purpose, "Beneficiary Name", opts.beneficiaryName],
    ["Purpose", opts.purpose, "Target Amount", opts.targetAmount ? `Rs. ${Number(opts.targetAmount).toLocaleString("en-IN")}` : undefined],
    ["Hospital", opts.hospital, "Campaigner Phone", opts.campaignerPhone],
  ];
  for (const [l1, v1, l2, v2] of detRows) {
    chk(8);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(90, 90, 90);
    doc.text(l1 + ":", M, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(20, 20, 20);
    const ll1 = doc.splitTextToSize(v1 || "—", cw2); doc.text(ll1, M, y + 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(90, 90, 90);
    doc.text(l2 + ":", col2, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(20, 20, 20);
    const ll2 = doc.splitTextToSize(v2 || "—", cw2); doc.text(ll2, col2, y + 4);
    y += Math.max(ll1.length, ll2.length) * 4 + 8;
  }
  // Seal overlapping campaign details top-right
  if (sealUrl) {
    try { doc.addImage(sealUrl, "PNG", W - M - 27, detailStartY - 2, 25, 25); } catch (_) {}
  }
  y += 1; div();

  // Agreement Clauses
  sec("AGREEMENT CLAUSES");
  const clauses = [
    "1. Campaign commences on signing. AZMI does not guarantee achievement of the target amount.",
    "2. Funds raised shall be used only for the stated purpose in this agreement.",
    "3. AZMI has exclusive rights to all personal information, photos, videos, medical records and KYC documents.",
    "4. Campaigner grants AZMI perpetual rights to use this information on platform, social media and promotional materials.",
    "5. AZMI charges zero platform fee. Only actual third-party charges (gateway, marketing, GST) deducted per Annexure A.",
    "6. AZMI may communicate with the Campaigner via email, SMS, WhatsApp or calls for updates.",
    "7. AZMI shall provide periodic updates on funds raised and balance available.",
    "8. Disputes shall first be resolved through AZMI's two-tier escalation matrix before legal proceedings.",
    "9. AZMI shall release funds only after verification of proper invoices and supporting documents.",
    "10. Excess or terminated campaign funds may be refunded to donors or used for similar causes transparently.",
    "11. Misrepresentation or fraud leads to immediate termination and possible legal action.",
    "12. Campaigner indemnifies AZMI against claims arising from incorrect information provided.",
    "13. The Campaigner has read, understood and voluntarily agreed to all terms of this agreement.",
    "14. Governed by Indian law. Exclusive jurisdiction: Ahmedabad, Gujarat.",
  ];
  for (const c of clauses) {
    chk(6);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(40, 40, 40);
    const ls = doc.splitTextToSize(c, CW - 3);
    doc.text(ls, M + 3, y);
    y += ls.length * 3.8 + 0.8;
  }
  y += 2; div();

  // Annexure A
  sec("Annexure A — Indicative Expense Break-up");
  const tRows = [
    ["Platform Fee by AZMI", "0% (Zero)"],
    ["Payment Gateway Charges", "~2%"],
    ["Marketing Charges", "As applicable"],
    ["GST & Taxes", "18% on applicable charges"],
  ];
  const tc = [130, 44];
  let tY = y + 1;
  doc.setFillColor(10, 36, 99); doc.rect(M, tY - 4, tc[0], 6, "F"); doc.rect(M + tc[0], tY - 4, tc[1], 6, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
  doc.text("Description", M + 2, tY); doc.text("Rate", M + tc[0] + 2, tY); tY += 6;
  tRows.forEach((r, i) => {
    doc.setFillColor(i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 248 : 255, 255);
    doc.rect(M, tY - 4, tc[0], 6, "F"); doc.rect(M + tc[0], tY - 4, tc[1], 6, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(30, 30, 30);
    doc.text(r[0], M + 2, tY); doc.text(r[1], M + tc[0] + 2, tY); tY += 6;
  });
  y = tY + 3; doc.setTextColor(0, 0, 0);

  // ── PAGE 2: Signatures ──────────────────────────────────────────────────────
  chk(120);
  div();
  sec("DIGITAL SIGNATURE & VERIFICATION");
  txt("I have read and understood all the above terms and voluntarily give my electronic consent under the Information Technology Act, 2000.");
  y += 3;

  // ── Campaigner signature box
  const sigY = y;
  doc.setDrawColor(10, 36, 99); doc.setLineWidth(0.4);
  doc.rect(M, sigY, 74, 30);
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(120, 120, 120);
  doc.text("Campaigner Signature", M + 2, sigY + 5);
  try {
    if (opts.signatureDataUrl && opts.signatureDataUrl.length > 50) {
      doc.addImage(opts.signatureDataUrl, "PNG", M + 1, sigY + 7, 72, 21);
    }
  } catch (_) {}

  // Campaigner meta — right column
  const rx = M + 80;
  const rw = CW - 80;
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(10, 36, 99);
  doc.text("CAMPAIGNER DETAILS", rx, sigY + 4);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(40, 40, 40);

  const campMeta: [string, string | undefined][] = [
    ["Name", opts.campaignerName],
    ["Phone", opts.campaignerPhone],
    ["CAF ID", opts.cafId],
    ["Timestamp", opts.signedAt],
    ["IP Address", opts.ipAddress],
    ["Device", deviceStr(opts.deviceInfo) || undefined],
  ];
  let metaY = sigY + 9;
  for (const [lbl, val] of campMeta) {
    if (!val) continue;
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(90, 90, 90);
    doc.text(lbl + ":", rx, metaY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(20, 20, 20);
    const vLines = doc.splitTextToSize(val, rw - 22);
    doc.text(vLines, rx + 22, metaY);
    metaY += vLines.length * 3.8 + 0.5;
  }

  y = Math.max(sigY + 33, metaY + 2);
  y += 2;

  // ── Campaign Manager block (only for admin-generated)
  if (opts.generatedByAdmin) {
    chk(30);
    doc.setFillColor(255, 248, 235);
    const cmBlockH = 28;
    doc.rect(M, y, CW, cmBlockH, "F");
    doc.setDrawColor(200, 150, 50); doc.setLineWidth(0.3);
    doc.rect(M, y, CW, cmBlockH);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(150, 90, 0);
    doc.text("CAMPAIGN MANAGER DETAILS", M + 3, y + 5);

    const cmMeta: [string, string | undefined][] = [
      ["Name", opts.adminName || "Azmi Foundation Admin"],
      ["Timestamp", opts.adminSignedAt || opts.signedAt],
      ["IP Address", opts.adminIpAddress || opts.ipAddress],
      ["Device", deviceStr(opts.adminDeviceInfo) || undefined],
    ];
    const half = CW / 2;
    let cmY = y + 10;
    let col = 0;
    for (const [lbl, val] of cmMeta) {
      if (!val) continue;
      const cx = M + 3 + col * half;
      doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(120, 80, 0);
      doc.text(lbl + ":", cx, cmY);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(60, 40, 0);
      const vl = doc.splitTextToSize(val, half - 28);
      doc.text(vl, cx + 26, cmY);
      col = col === 0 ? 1 : 0;
      if (col === 0) cmY += vl.length * 3.8 + 1;
    }
    y += cmBlockH + 4;
  }

  // Authorised signature
  chk(26);
  if (authSigUrl) {
    try { doc.addImage(authSigUrl, "PNG", M, y, 62, 22); } catch (_) {}
  }
  y += 24;
  div();

  // User agent (if available)
  const ua = opts.deviceInfo?.userAgent;
  if (ua) {
    chk(10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(150, 150, 150);
    const uaLines = doc.splitTextToSize(`Campaigner UA: ${ua}`, CW);
    doc.text(uaLines.slice(0, 2), M, y);
    y += Math.min(uaLines.length, 2) * 3.5 + 2;
    div();
  }

  // Footer
  doc.setFont("helvetica", "italic"); doc.setFontSize(6.5); doc.setTextColor(140, 140, 140);
  const ft = "This document is electronically executed under the Information Technology Act, 2000 and is legally binding. " +
    "Azmi Foundation | Gomtipur, Ahmedabad 380021 | +91 78610 10850 | support@azmifoundation.com";
  const ftL = doc.splitTextToSize(ft, CW);
  chk(ftL.length * 3.5 + 2);
  doc.text(ftL, M, y);

  doc.save(`CAF_${opts.cafId}_${opts.campaignerName.replace(/\s+/g, "_")}.pdf`);
}
