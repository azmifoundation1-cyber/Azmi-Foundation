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
  const [sealDataUrl, authSigDataUrl] = await Promise.all([
    loadImageAsDataUrl("/trust-seal.png"),
    loadImageAsDataUrl("/azmi-auth-signature.png"),
  ]);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 18;
  const contentW = W - margin * 2;
  let y = 18;

  const addPage = () => { doc.addPage(); y = 18; drawHeader(); };
  const checkY = (need: number = 10) => { if (y + need > 272) addPage(); };

  function drawHeader() {
    doc.setFillColor(10, 36, 99);
    doc.rect(0, 0, W, 18, "F");
    // Org name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("AZMI FOUNDATION", margin, 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Reg. No: E/22280/AHMEDABAD  |  PAN: AAGTA9354B  |  80G & 12A Registered", margin, 14);
    doc.setTextColor(0, 0, 0);
    y = 24;
  }

  function sectionTitle(title: string) {
    checkY(12);
    doc.setFillColor(237, 242, 255);
    doc.rect(margin, y - 5, contentW, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(10, 36, 99);
    doc.text(title, margin + 3, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
  }

  function bodyText(t: string, indent = 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(t, contentW - indent);
    checkY(lines.length * 5);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5 + 1;
  }

  function boldText(t: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    doc.text(t, margin, y);
    y += 5;
  }

  function infoRow(label: string, value?: string) {
    checkY(6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(label + ":", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(value || "\u2014", margin + 52, y);
    y += 5.5;
  }

  function divider() {
    checkY(5);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, W - margin, y);
    y += 4;
  }

  // ── Page 1 ────────────────────────────────────────────────────────────────
  drawHeader();

  // Trust seal — top-right of title block
  if (sealDataUrl) {
    try { doc.addImage(sealDataUrl, "PNG", W - margin - 32, 18, 30, 30); } catch (_) {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(10, 36, 99);
  doc.text("CONSENT AGREEMENT FOR FUNDRAISING (CAF)", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`CAF ID: ${opts.cafId}  |  Date: ${opts.signedAt}`, margin, y);
  if (opts.generatedByAdmin) {
    const cmName = opts.adminName || "Azmi Foundation Admin";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(10, 36, 99);
    doc.text(`Campaign Manager: ${cmName}`, W - margin, y, { align: "right" });
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(opts.signedAt, W - margin, y, { align: "right" });
    if (opts.ipAddress) {
      y += 4;
      doc.text(`IP: ${opts.ipAddress}`, W - margin, y, { align: "right" });
    }
    y += 4;
  }
  y += 4;
  divider();

  // Parties
  sectionTitle("PARTIES TO THIS AGREEMENT");
  bodyText('This Consent Agreement for Fundraising ("CAF") is signed and executed in Ahmedabad, Gujarat, India.');
  y += 2;
  boldText("AZMI FOUNDATION (Platform)");
  bodyText(
    'A Public Charitable Trust registered under the Bombay Public Trusts Act, 1950. Registration No. E/22280/AHMEDABAD dated 23-07-2018. PAN: AAGTA9354B. 80G & 12A registered. Registered Office: Gomtipur Bridge East-End, Opp. Kamdar Maidan, Gomtipur, Ahmedabad \u2013 380021, Gujarat. (Hereinafter referred to as "AZMI" or "the Platform")'
  );
  y += 2;
  boldText("AND");
  bodyText(
    `${opts.campaignerName}, acting as the Beneficiary / Patient or Legal Guardian or authorised Family Member / Representative. (Hereinafter referred to as the "CAMPAIGNER")`
  );
  y += 2;
  divider();

  // Campaign Details
  sectionTitle("CAMPAIGN DETAILS");
  infoRow("Campaign Title", opts.campaignTitle || opts.purpose);
  infoRow("Beneficiary Name", opts.beneficiaryName);
  infoRow("Purpose", opts.purpose);
  infoRow("Target Amount", opts.targetAmount ? `Rs. ${Number(opts.targetAmount).toLocaleString("en-IN")}` : undefined);
  infoRow("Hospital / Institution", opts.hospital);
  infoRow("Campaigner Name", opts.campaignerName);
  infoRow("Campaigner Phone", opts.campaignerPhone);
  y += 3;
  divider();

  // Agreement clauses
  sectionTitle("WHEREAS & AGREEMENT CLAUSES");
  bodyText("WHEREAS AZMI is a crowdfunding platform providing services for raising funds for Medical, Educational, Hunger Relief, Disaster Relief and other Social Causes.");
  bodyText("WHEREAS the Campaigner has approached AZMI to start a fundraising campaign for the purpose stated above.");
  y += 2;
  boldText("NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:");
  y += 1;

  const clauses = [
    "1. The campaign shall commence on or after the date of signing with the target amount as stated above. AZMI does not guarantee achievement of the target.",
    "2. The funds raised shall be used only for the purpose mentioned above.",
    "3. AZMI shall have exclusive rights to all personal information, photographs, videos, medical records, KYC documents etc. provided by the Campaigner.",
    "4. The Campaigner grants AZMI perpetual rights to use the above information on the platform, social media, and promotional materials for fundraising.",
    "5. AZMI charges zero platform fee. Only actual third-party charges (payment gateway, marketing, GST) shall be deducted as per Annexure A.",
    "6. AZMI may communicate with the Campaigner via email, SMS, WhatsApp or calls for campaign updates.",
    "7. AZMI shall provide periodic updates on funds raised and balance available.",
    "8. Any dispute shall first be resolved through AZMI's two-tier escalation matrix.",
    "9. AZMI shall release funds only after verification of proper invoices and documents.",
    "10. In case of excess funds or campaign termination, AZMI may refund to donors or use for similar charitable causes with transparency.",
    "11. Any misrepresentation or fraud by the Campaigner shall lead to immediate termination of the campaign and possible legal action.",
    "12. The Campaigner agrees to indemnify AZMI against any claims arising due to incorrect information provided.",
    "13. The Campaigner has read, understood and voluntarily agreed to all terms of this agreement.",
    "14. This agreement is governed by the laws of India. Any dispute shall be subject to the exclusive jurisdiction of courts at Ahmedabad, Gujarat.",
  ];
  for (const clause of clauses) {
    checkY(8);
    bodyText(clause, 0);
    y += 1;
  }
  y += 3;
  divider();

  // Annexure A
  checkY(40);
  sectionTitle("Annexure \u2013 A : Indicative Expense Break-up");
  const tData = [
    ["Description", "Rate"],
    ["Platform Fee by AZMI", "0% (Zero)"],
    ["Payment Gateway Charges", "Approx 2%"],
    ["Marketing Charges (if any)", "As applicable"],
    ["GST & Taxes", "18% on applicable charges"],
  ];
  const colW = [130, 44];
  let tY = y;
  tData.forEach((row, ri) => {
    checkY(8);
    const isHead = ri === 0;
    if (isHead) { doc.setFillColor(10, 36, 99); doc.setTextColor(255, 255, 255); }
    else { doc.setFillColor(ri % 2 === 0 ? 245 : 255, ri % 2 === 0 ? 248 : 255, ri % 2 === 0 ? 255 : 255); doc.setTextColor(30, 30, 30); }
    doc.rect(margin, tY - 4.5, colW[0], 7, "F");
    doc.rect(margin + colW[0], tY - 4.5, colW[1], 7, "F");
    doc.setFont("helvetica", isHead ? "bold" : "normal");
    doc.setFontSize(8);
    doc.text(row[0], margin + 2, tY);
    doc.text(row[1], margin + colW[0] + 2, tY);
    tY += 7;
  });
  y = tY + 4;
  doc.setTextColor(0, 0, 0);

  // ── Signature & Verification Section ──────────────────────────────────────
  checkY(80);
  divider();
  sectionTitle("DIGITAL SIGNATURE & VERIFICATION");
  bodyText("I have read and understood all the terms above. I voluntarily give my consent and electronically sign this document under the Information Technology Act, 2000.");
  y += 4;

  // Signature box
  doc.setDrawColor(10, 36, 99);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, 80, 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text("Signature of Campaigner", margin + 2, y + 5);
  try {
    if (opts.signatureDataUrl && opts.signatureDataUrl.length > 50) {
      doc.addImage(opts.signatureDataUrl, "PNG", margin + 2, y + 7, 76, 22);
    }
  } catch (_) {}

  // Signer meta
  const rx = margin + 90;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  doc.text(`Name: ${opts.campaignerName}`, rx, y + 6);
  doc.text(`Phone: ${opts.campaignerPhone}`, rx, y + 11);
  doc.text(`CAF ID: ${opts.cafId}`, rx, y + 16);
  doc.text(`Signed At: ${opts.signedAt}`, rx, y + 21);
  if (opts.ipAddress) doc.text(`IP Address: ${opts.ipAddress}`, rx, y + 26);

  if (opts.generatedByAdmin) {
    doc.setTextColor(180, 80, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Generated By: ${opts.adminName || "Azmi Foundation Admin"}`, rx, y + 31);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
  }
  y += 40;

  // Authorised signatory block
  checkY(30);
  if (authSigDataUrl) {
    try {
      doc.addImage(authSigDataUrl, "PNG", margin, y, 70, 28);
    } catch (_) {}
  }
  y += 30;
  divider();

  // ── Device & Technical Verification ───────────────────────────────────────
  if (opts.deviceInfo && Object.keys(opts.deviceInfo).length > 0) {
    checkY(30);
    sectionTitle("TECHNICAL VERIFICATION RECORD");
    const di = opts.deviceInfo;
    if (di.platform) infoRow("Device Platform", di.platform);
    if (di.screenSize) infoRow("Screen Resolution", di.screenSize);
    if (di.language) infoRow("Browser Language", di.language);
    if (di.timezone) infoRow("Timezone", di.timezone);
    if (di.userAgent) {
      checkY(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text("User Agent:", margin, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(80, 80, 80);
      const uaLines = doc.splitTextToSize(di.userAgent, contentW);
      doc.text(uaLines.slice(0, 3), margin, y);
      y += (Math.min(uaLines.length, 3) * 4) + 2;
    }
    if (opts.ipAddress) infoRow("IP Address", opts.ipAddress);
    y += 2;
    divider();
  }

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  const footerText =
    "This document is an electronically executed agreement under the Information Technology Act, 2000 and is legally binding. " +
    "Azmi Foundation | Gomtipur, Ahmedabad 380021 | +91 78610 10850 | support@azmifoundation.com";
  const footerLines = doc.splitTextToSize(footerText, contentW);
  checkY(footerLines.length * 4 + 4);
  doc.text(footerLines, margin, y);

  doc.save(`CAF_${opts.cafId}_${opts.campaignerName.replace(/\s+/g, "_")}.pdf`);
}
