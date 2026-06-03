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
  // Campaign Manager (admin) details — always show block; admin fields populate when available
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

function deviceStr(d?: CafPdfOptions["deviceInfo"]): string {
  if (!d) return "";
  const parts: string[] = [];
  if (d.platform) parts.push(d.platform);
  if (d.screenSize) parts.push(d.screenSize);
  if (d.language) parts.push(d.language);
  if (d.timezone) parts.push(d.timezone);
  return parts.join("  ·  ");
}

export async function generateCAFPdf(opts: CafPdfOptions): Promise<void> {
  const [sealUrl, authSigUrl, logoUrl] = await Promise.all([
    loadImg("/trust-seal.png"),
    loadImg("/azmi-auth-signature.png"),
    loadImg("/logo.png"),
  ]);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const M = 14;           // left/right margin
  const CW = W - M * 2;  // content width = 182mm
  const HDR = 22;
  let y = HDR + 5;

  // ── helpers ──────────────────────────────────────────────────────────────────

  function hdr() {
    doc.setFillColor(10, 36, 99);
    doc.rect(0, 0, W, HDR, "F");
    if (logoUrl) {
      try { doc.addImage(logoUrl, "PNG", M, 2, 18, 18); } catch (_) {}
    }
    const tx = logoUrl ? M + 21 : M;
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text("AZMI FOUNDATION", tx, 10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
    doc.text(
      "Reg. No: E/22280/AHMEDABAD  |  PAN: AAGTA9354B  |  80G & 12A Registered  |  Gomtipur, Ahmedabad 380021",
      tx, 17,
    );
    doc.setTextColor(0, 0, 0);
  }

  const chk = (need = 8) => {
    if (y + need > 283) { doc.addPage(); y = HDR + 5; hdr(); }
  };

  function sec(title: string) {
    chk(10);
    doc.setFillColor(237, 242, 255);
    doc.rect(M, y - 4.5, CW, 7, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(10, 36, 99);
    doc.text(title, M + 2, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  function txt(t: string, sz = 7.5, indent = 0) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(sz); doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(t, CW - indent);
    chk(lines.length * 4);
    doc.text(lines, M + indent, y);
    y += lines.length * 4 + 0.5;
  }

  function bld(t: string, sz = 7.5) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(sz); doc.setTextColor(20, 20, 20);
    chk(5); doc.text(t, M, y); y += 4.5;
  }

  function div() {
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 3;
  }

  // Inline meta row: label in grey bold, value in black
  function metaLine(lbl: string, val: string, x: number, maxW: number, curY: number): number {
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(90, 90, 90);
    doc.text(lbl + ":", x, curY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(val, maxW - 24);
    doc.text(lines, x + 24, curY);
    return lines.length * 3.8 + 0.8;
  }

  // ── PAGE 1 ──────────────────────────────────────────────────────────────────
  hdr();

  // Document title
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(10, 36, 99);
  doc.text("CONSENT AGREEMENT FOR FUNDRAISING (CAF)", M, y);
  y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(110, 110, 110);
  doc.text(`CAF ID: ${opts.cafId}   |   Generated: ${opts.signedAt}`, M, y);
  y += 6;
  div();

  // Parties
  sec("PARTIES TO THIS AGREEMENT");
  txt("This CAF is signed and executed in Ahmedabad, Gujarat, India between:");
  y += 1;
  bld("AZMI FOUNDATION (Platform)");
  txt(
    'Public Charitable Trust | Reg. No. E/22280/AHMEDABAD | PAN: AAGTA9354B | 80G & 12A | Gomtipur, Ahmedabad 380021. ("AZMI" / "Platform")',
  );
  y += 1;
  bld("AND");
  txt(
    `${opts.campaignerName} — acting as Beneficiary / Patient / Legal Guardian / authorised Representative. ("CAMPAIGNER")`,
  );
  y += 2;
  div();

  // ── CAMPAIGN DETAILS ────────────────────────────────────────────────────────
  sec("CAMPAIGN DETAILS");
  // Record Y right after the section header (first content row — seal appears on page 2)

  // Seal dimensions (used later on page 2 in the Campaigner Details block)
  const sealW = 26;
  const sealH = 26;

  // 2-column campaign detail grid
  const col1X = M;
  const col2X = M + CW / 2 + 2;
  const colW = CW / 2 - 6;             // each column text width

  const detRows: [string, string, string, string][] = [
    ["Campaign Title", opts.campaignTitle || opts.purpose || "—",
      "Beneficiary Name", opts.beneficiaryName || "—"],
    ["Purpose", opts.purpose || "—",
      "Target Amount", opts.targetAmount
        ? `Rs. ${Number(opts.targetAmount).toLocaleString("en-IN")}`
        : "—"],
    ["Hospital / Venue", opts.hospital || "—",
      "Campaigner Phone", opts.campaignerPhone],
  ];

  for (const [l1, v1, l2, v2] of detRows) {
    chk(10);
    // Label row
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(90, 90, 90);
    doc.text(l1 + ":", col1X, y);
    doc.text(l2 + ":", col2X, y);
    y += 4;
    // Value row
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(15, 15, 15);
    const l1Lines = doc.splitTextToSize(v1, colW);
    const l2Lines = doc.splitTextToSize(v2, colW);
    doc.text(l1Lines, col1X, y);
    doc.text(l2Lines, col2X, y);
    y += Math.max(l1Lines.length, l2Lines.length) * 4.5 + 4;
  }

  y += 1;
  div();

  // Agreement clauses
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
  y += 2;
  div();

  // Annexure A table
  sec("Annexure A — Indicative Expense Break-up");
  const tCols = [130, 44];
  let tY = y + 1;
  doc.setFillColor(10, 36, 99);
  doc.rect(M, tY - 4, tCols[0], 6, "F");
  doc.rect(M + tCols[0], tY - 4, tCols[1], 6, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
  doc.text("Description", M + 2, tY);
  doc.text("Rate", M + tCols[0] + 2, tY);
  tY += 6;
  const tRows = [
    ["Platform Fee by AZMI", "0% (Zero)"],
    ["Payment Gateway Charges", "~2%"],
    ["Marketing Charges", "As applicable"],
    ["GST & Taxes", "18% on applicable charges"],
  ];
  tRows.forEach((r, i) => {
    doc.setFillColor(i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 248 : 255, 255);
    doc.rect(M, tY - 4, tCols[0], 6, "F");
    doc.rect(M + tCols[0], tY - 4, tCols[1], 6, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(30, 30, 30);
    doc.text(r[0], M + 2, tY);
    doc.text(r[1], M + tCols[0] + 2, tY);
    tY += 6;
  });
  y = tY + 4;
  doc.setTextColor(0, 0, 0);

  // ── PAGE 2: SIGNATURES ───────────────────────────────────────────────────────
  chk(120);
  div();
  sec("DIGITAL SIGNATURE & VERIFICATION");
  txt("I have read, understood and voluntarily give electronic consent to all terms above under the Information Technology Act, 2000.");
  y += 3;

  // ── CAMPAIGNER: signature box (left) + details (right) ─────────────────────
  const sigBlockY = y;
  const sigBoxW = 74;
  const sigBoxH = 32;

  // Signature box border
  doc.setDrawColor(10, 36, 99); doc.setLineWidth(0.4);
  doc.rect(M, sigBlockY, sigBoxW, sigBoxH);
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(130, 130, 130);
  doc.text("CAMPAIGNER SIGNATURE", M + 2, sigBlockY + 5);

  // Signature image inside box
  try {
    if (opts.signatureDataUrl && opts.signatureDataUrl.length > 50) {
      doc.addImage(opts.signatureDataUrl, "PNG", M + 2, sigBlockY + 7, sigBoxW - 4, sigBoxH - 9);
    }
  } catch (_) {}

  // Campaigner details — right column
  const detX = M + sigBoxW + 6;   // 94mm
  const detW = CW - sigBoxW - 6;  // 102mm

  // Seal overlapping the top-right corner of the CAMPAIGNER DETAILS area
  if (sealUrl) {
    try {
      doc.addImage(sealUrl, "PNG", W - M - sealW, sigBlockY - 2, sealW, sealH);
    } catch (_) {}
  }

  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(10, 36, 99);
  doc.text("CAMPAIGNER DETAILS", detX, sigBlockY + 5);
  doc.setDrawColor(10, 36, 99); doc.setLineWidth(0.3);
  doc.line(detX, sigBlockY + 7, detX + detW, sigBlockY + 7);

  const campFields: [string, string | undefined][] = [
    ["Name", opts.campaignerName],
    ["Phone", opts.campaignerPhone],
    ["CAF ID", opts.cafId],
    ["Timestamp", opts.signedAt],
    ["IP Address", opts.ipAddress],
    ["Device", deviceStr(opts.deviceInfo) || undefined],
  ];
  let cdY = sigBlockY + 10;
  for (const [lbl, val] of campFields) {
    if (!val) continue;
    cdY += metaLine(lbl, val, detX, detW, cdY);
  }

  y = Math.max(sigBlockY + sigBoxH + 4, cdY + 4);

  // ── CAMPAIGN MANAGER BLOCK — ALWAYS SHOWN ────────────────────────────────────
  chk(36);
  const cmBgColors: [number, number, number] = [255, 249, 237];
  const cmBorderColor: [number, number, number] = [180, 120, 20];
  const cmTitleColor: [number, number, number] = [130, 75, 0];
  const cmLabelColor: [number, number, number] = [110, 70, 0];
  const cmValueColor: [number, number, number] = [50, 30, 0];

  // Determine CM fields — if admin data available use it; else show Azmi Foundation defaults
  const hasAdminData = !!(opts.generatedByAdmin && (opts.adminName || opts.adminSignedAt || opts.adminIpAddress));
  const cmName      = opts.adminName      || "Azmi Foundation (support@azmifoundation.com)";
  const cmTimestamp = opts.adminSignedAt  || opts.signedAt;
  const cmIp        = opts.adminIpAddress || "—";
  const cmDevice    = deviceStr(opts.adminDeviceInfo) || (hasAdminData ? "—" : "Azmi Foundation Server");

  const cmFields: [string, string][] = [
    ["Name", cmName],
    ["Timestamp", cmTimestamp],
    ["IP Address", cmIp],
    ["Device", cmDevice],
  ];

  // Measure required height for the CM block
  const cmPad = 4;
  const cmTitleH = 7;
  let cmContentH = 0;
  for (const [, val] of cmFields) {
    const lines = doc.splitTextToSize(val, CW / 2 - 30);
    cmContentH = Math.max(cmContentH, lines.length * 3.8 + 1);
  }
  // Two-column layout: left pair + right pair
  const cmBlockH = cmTitleH + cmPad + Math.max(
    (() => {
      let h = 0;
      for (const [, val] of [cmFields[0], cmFields[2]]) {
        h += doc.splitTextToSize(val, CW / 2 - 30).length * 3.8 + 1;
      }
      return h;
    })(),
    (() => {
      let h = 0;
      for (const [, val] of [cmFields[1], cmFields[3]]) {
        h += doc.splitTextToSize(val, CW / 2 - 30).length * 3.8 + 1;
      }
      return h;
    })(),
  ) + cmPad;

  doc.setFillColor(...cmBgColors);
  doc.rect(M, y, CW, Math.max(cmBlockH, 30), "F");
  doc.setDrawColor(...cmBorderColor); doc.setLineWidth(0.4);
  doc.rect(M, y, CW, Math.max(cmBlockH, 30));

  // CM section title
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...cmTitleColor);
  doc.text("CAMPAIGN MANAGER DETAILS", M + cmPad, y + 6);
  doc.setDrawColor(...cmBorderColor); doc.setLineWidth(0.25);
  doc.line(M + cmPad, y + 8, M + CW - cmPad, y + 8);

  // Two-column layout inside CM block
  const cmHalf = CW / 2;
  const cmLCol = M + cmPad;
  const cmRCol = M + cmHalf + cmPad;
  const cmColW = cmHalf - cmPad * 2 - 4;
  let cmLY = y + 12;
  let cmRY = y + 12;

  // Left column: Name, IP Address
  for (const [lbl, val] of [cmFields[0], cmFields[2]]) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(...cmLabelColor);
    doc.text(lbl + ":", cmLCol, cmLY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...cmValueColor);
    const vl = doc.splitTextToSize(val, cmColW - 22);
    doc.text(vl, cmLCol + 22, cmLY);
    cmLY += vl.length * 3.8 + 2;
  }

  // Right column: Timestamp, Device
  for (const [lbl, val] of [cmFields[1], cmFields[3]]) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(...cmLabelColor);
    doc.text(lbl + ":", cmRCol, cmRY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...cmValueColor);
    const vl = doc.splitTextToSize(val, cmColW - 22);
    doc.text(vl, cmRCol + 22, cmRY);
    cmRY += vl.length * 3.8 + 2;
  }

  y += Math.max(cmBlockH, 30) + 5;

  // Authorised signatory image
  chk(26);
  if (authSigUrl) {
    try { doc.addImage(authSigUrl, "PNG", M, y, 65, 23); } catch (_) {}
  }
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(80, 80, 80);
  doc.text("Authorised Signatory — Azmi Foundation", M, y + 26);
  y += 32;
  div();

  // Campaigner User Agent (tech audit trail)
  const ua = opts.deviceInfo?.userAgent;
  if (ua) {
    chk(8);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(160, 160, 160);
    const uaLines = doc.splitTextToSize(`Campaigner UA: ${ua}`, CW);
    doc.text(uaLines.slice(0, 2), M, y);
    y += Math.min(uaLines.length, 2) * 3.3 + 2;
    div();
  }

  // Admin User Agent (if available)
  const adminUA = opts.adminDeviceInfo?.userAgent;
  if (adminUA && opts.generatedByAdmin) {
    chk(8);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(160, 160, 160);
    const auaLines = doc.splitTextToSize(`Campaign Manager UA: ${adminUA}`, CW);
    doc.text(auaLines.slice(0, 2), M, y);
    y += Math.min(auaLines.length, 2) * 3.3 + 2;
    div();
  }

  // Footer
  chk(10);
  doc.setFont("helvetica", "italic"); doc.setFontSize(6.5); doc.setTextColor(140, 140, 140);
  const ft =
    "This document is electronically executed under the Information Technology Act, 2000 and is legally binding. " +
    "Azmi Foundation | Gomtipur, Ahmedabad 380021 | +91 78610 10850 | support@azmifoundation.com";
  const ftL = doc.splitTextToSize(ft, CW);
  doc.text(ftL, M, y);

  doc.save(`CAF_${opts.cafId}_${opts.campaignerName.replace(/\s+/g, "_")}.pdf`);
}
