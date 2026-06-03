import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateCAFPdf } from "@/lib/generate-caf-pdf";
import {
  CheckCircle, FileText, Pen, Loader2, Shield,
  ChevronRight, RotateCcw, Trash2, AlertCircle,
} from "lucide-react";

const CAF_TEXT = `CONSENT AGREEMENT FOR FUNDRAISING (CAF)

This Consent Agreement for Fundraising ("CAF") is signed and executed in Ahmedabad, Gujarat, India.

BETWEEN
AZMI FOUNDATION, a Public Charitable Trust registered under the Bombay Public Trusts Act, 1950, Registration No. E/22280/AHMEDABAD dated 23-07-2018, PAN AAGTA9354B, 80G and 12A registered, Registered Office: Gomtipur Bridge East-End, Opp. Kamdar Maidan, Gomtipur, Ahmedabad - 380021, Gujarat (the "Platform")

AND
The Campaigner acting as Beneficiary / Patient or Legal Guardian / authorised Representative (the "CAMPAIGNER").

1. Campaign commences on signing. AZMI does not guarantee target achievement.
2. Funds raised used only for stated purpose.
3. AZMI has exclusive rights to personal information, photos, videos, medical records, KYC documents.
4. Campaigner grants AZMI perpetual rights for platform, social media & promotional use.
5. AZMI charges zero platform fee. Only actual third-party charges (gateway, marketing, GST) deducted.
6. AZMI may contact Campaigner via email, SMS, WhatsApp or calls.
7. AZMI provides periodic updates on funds raised.
8. Disputes resolved via AZMI's two-tier escalation matrix.
9. Funds released only after verification of invoices and documents.
10. Excess or terminated campaign funds refunded to donors or used for similar causes transparently.
11. Misrepresentation leads to immediate termination and possible legal action.
12. Campaigner indemnifies AZMI against claims from incorrect information.
13. Campaigner has read and voluntarily agreed to all terms.
14. Governed by laws of India. Exclusive jurisdiction: Ahmedabad, Gujarat.

ANNEXURE A - EXPENSE BREAK-UP
• Platform Fee by AZMI: 0% (Zero)
• Payment Gateway Charges: Approx 2%
• Marketing Charges (if applicable): As agreed
• GST & Taxes: 18% on applicable charges`;

type Step = "details" | "sign" | "done";

function collectDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform || (navigator as any).userAgentData?.platform || "Unknown",
    screenSize: `${screen.width}x${screen.height} (DPR: ${window.devicePixelRatio})`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function nowIST(): string {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true,
  }) + " IST";
}

export default function SignCAF() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  const [step, setStep] = useState<Step>("details");
  const [saving, setSaving] = useState(false);
  const [cafId, setCafId] = useState("");
  const [signedTimestamp, setSignedTimestamp] = useState("");
  const [consent, setConsent] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [tokenError, setTokenError] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);

  const urlToken = new URLSearchParams(window.location.search).get("token") || "";

  const [form, setForm] = useState({
    campaignerName: "",
    campaignerPhone: "",
    beneficiaryName: "",
    purpose: "",
    targetAmount: "",
    hospital: "",
    campaignTitle: "",
  });

  useEffect(() => {
    if (!urlToken) return;
    setTokenLoading(true);
    fetch(`/api/caf/request/${urlToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.message) {
          setTokenError(data.message);
        } else {
          setTokenData(data);
          setForm({
            campaignerName: data.campaignerName || "",
            campaignerPhone: data.campaignerPhone || "",
            beneficiaryName: data.beneficiaryName || "",
            purpose: data.purpose || "",
            targetAmount: data.targetAmount || "",
            hospital: data.hospital || "",
            campaignTitle: data.campaignTitle || "",
          });
        }
      })
      .catch(() => setTokenError("Failed to load signing request"))
      .finally(() => setTokenLoading(false));
  }, [urlToken]);

  useEffect(() => {
    if (step !== "sign") return;
    let cancelled = false;
    function initPad() {
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const w = canvas.offsetWidth || canvas.parentElement?.offsetWidth || 600;
      canvas.width = w * ratio;
      canvas.height = 220 * ratio;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(ratio, ratio);
      if (padRef.current) padRef.current.off();
      padRef.current = new SignaturePad(canvas, {
        backgroundColor: "rgb(255,255,255)",
        penColor: "rgb(10, 36, 99)",
        minWidth: 1.5,
        maxWidth: 4,
      });
      padRef.current.clear();
    }
    requestAnimationFrame(() => requestAnimationFrame(initPad));
    return () => { cancelled = true; };
  }, [step]);

  async function handleSign() {
    if (!padRef.current || padRef.current.isEmpty()) {
      toast({ title: "Please draw your signature", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const signatureDataUrl = padRef.current.toDataURL("image/png");
      const deviceInfo = collectDeviceInfo();
      const ts = nowIST();
      setSignedTimestamp(ts);

      const saveRes = await fetch("/api/caf/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          signatureDataUrl,
          deviceInfo,
          requestToken: urlToken || undefined,
        }),
      });
      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.message);
      const id = saved.cafId;
      const returnedIp: string | undefined = saved.ipAddress;
      setCafId(id);

      // Format admin timestamp from token creation date (IST)
      const adminSignedAt = tokenData?.createdAt
        ? new Date(tokenData.createdAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
          }) + " IST"
        : ts; // for non-token flows, CM timestamp = signing time

      // Fetch server's own public IP (shown as Campaign Manager IP for non-admin CAFs)
      let serverIp: string | undefined;
      try {
        const sipRes = await fetch("/api/server-ip");
        const sipData = await sipRes.json();
        serverIp = sipData.ip;
      } catch (_) {}

      await generateCAFPdf({
        cafId: id,
        campaignerName: form.campaignerName,
        campaignerPhone: form.campaignerPhone,
        beneficiaryName: form.beneficiaryName,
        purpose: form.purpose,
        targetAmount: form.targetAmount,
        hospital: form.hospital,
        campaignTitle: form.campaignTitle || form.purpose,
        signatureDataUrl,
        signedAt: ts,
        ipAddress: returnedIp,
        deviceInfo,
        generatedByAdmin: !!tokenData,
        adminName: tokenData?.adminName || undefined,
        adminSignedAt,
        adminIpAddress: serverIp,
      });

      setStep("done");
      toast({ title: "CAF Signed & PDF Downloaded", description: `Reference: ${id}` });
    } catch (err: any) {
      toast({ title: "Signing failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  }

  const stepList = [
    { id: "details" as Step, label: "Campaign Details" },
    { id: "sign" as Step, label: "Digital Signature" },
    { id: "done" as Step, label: "Complete" },
  ];
  const stepIdx = stepList.findIndex(s => s.id === step);

  if (urlToken && tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#0a2463] mx-auto" />
          <p className="text-gray-600 font-medium">Loading your signing request…</p>
        </div>
      </div>
    );
  }
  if (urlToken && tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-black text-gray-900">Link Not Available</h2>
          <p className="text-gray-500 text-sm">{tokenError}</p>
          <a href="/"><Button variant="outline">Go to Home</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#0a2463] text-white py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Shield className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <h1 className="text-lg font-black tracking-tight">Consent Agreement for Fundraising</h1>
            <p className="text-blue-200 text-xs">Azmi Foundation · Legally Binding under IT Act 2000</p>
          </div>
        </div>
      </div>

      {urlToken && tokenData && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>This signing request was prepared by <strong>Azmi Foundation Admin</strong>. Your details are pre-filled. Please review and proceed.</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-8">
          {stepList.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${i < stepIdx ? "bg-green-500 text-white" : i === stepIdx ? "bg-[#0a2463] text-white" : "bg-gray-200 text-gray-400"}`}>
                  {i < stepIdx ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] font-semibold text-center leading-tight
                  ${i === stepIdx ? "text-[#0a2463]" : "text-gray-400"}`}>{s.label}</span>
              </div>
              {i < stepList.length - 1 && (
                <div className={`h-0.5 flex-1 mb-4 ${i < stepIdx ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Details ── */}
        {step === "details" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <h2 className="text-xl font-black text-[#0a2463]">Campaign Details</h2>
              <p className="text-gray-500 text-sm mt-1">Fill in or review the campaign information before signing.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Campaigner Full Name *</Label>
                <Input value={form.campaignerName} onChange={e => setForm(f => ({ ...f, campaignerName: e.target.value }))} placeholder="e.g. Mohammed Raza" />
              </div>
              <div>
                <Label>Mobile Number *</Label>
                <Input type="tel" maxLength={10} value={form.campaignerPhone}
                  onChange={e => setForm(f => ({ ...f, campaignerPhone: e.target.value.replace(/\D/g, "") }))} placeholder="10-digit mobile" />
              </div>
              <div>
                <Label>Beneficiary Name</Label>
                <Input value={form.beneficiaryName} onChange={e => setForm(f => ({ ...f, beneficiaryName: e.target.value }))} placeholder="Patient / Beneficiary name" />
              </div>
              <div>
                <Label>Target Amount (Rs.)</Label>
                <Input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="e.g. 500000" />
              </div>
              <div className="sm:col-span-2">
                <Label>Campaign Title</Label>
                <Input value={form.campaignTitle} onChange={e => setForm(f => ({ ...f, campaignTitle: e.target.value }))} placeholder="e.g. Help Raza fight cancer" />
              </div>
              <div className="sm:col-span-2">
                <Label>Purpose of Fundraising</Label>
                <Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="e.g. Medical treatment for liver disease" />
              </div>
              <div className="sm:col-span-2">
                <Label>Hospital / Institution</Label>
                <Input value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))} placeholder="e.g. Apollo Hospital, Ahmedabad" />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Consent Agreement for Fundraising (CAF) — Please read fully</Label>
              <div className="border border-gray-200 rounded-xl bg-gray-50 p-4 h-64 overflow-y-auto text-xs text-gray-700 font-mono leading-relaxed whitespace-pre-wrap">
                {CAF_TEXT}
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded" />
              <span className="text-sm text-gray-700">
                I have read the entire Consent Agreement for Fundraising (CAF) and voluntarily consent to electronically sign this document under the Information Technology Act, 2000.
              </span>
            </label>
            <Button
              className="w-full bg-[#0a2463] hover:bg-blue-900 text-white gap-2"
              disabled={!consent || !form.campaignerName.trim() || form.campaignerPhone.length < 10}
              onClick={() => setStep("sign")}
            >
              Proceed to Signature <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── STEP 2: Sign ── */}
        {step === "sign" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <h2 className="text-xl font-black text-[#0a2463] flex items-center gap-2">
                <Pen className="w-5 h-5" /> Draw Your Signature
              </h2>
              <p className="text-gray-500 text-sm mt-1">Use your finger or stylus to sign in the box below.</p>
            </div>
            <div className="border-2 border-[#0a2463] rounded-xl overflow-hidden bg-white">
              <div className="bg-gray-50 px-3 py-1.5 text-xs text-gray-400 border-b border-gray-100 flex items-center gap-2">
                <Pen className="w-3 h-3" /> Sign here — draw your full signature
              </div>
              <canvas
                ref={canvasRef}
                className="block w-full touch-none cursor-crosshair"
                style={{ height: 220 }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => padRef.current?.undo()}>
                <RotateCcw className="w-4 h-4" /> Undo
              </Button>
              <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => padRef.current?.clear()}>
                <Trash2 className="w-4 h-4" /> Clear
              </Button>
              <Button className="flex-1 bg-[#0a2463] hover:bg-blue-900 text-white gap-2"
                onClick={handleSign} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {saving ? "Generating PDF…" : "Sign & Download PDF"}
              </Button>
            </div>
            <button onClick={() => setStep("details")} className="text-sm text-gray-400 hover:text-gray-600">← Back to Details</button>
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              By clicking "Sign & Download PDF", you confirm this is your electronic signature under the Information Technology Act, 2000. Your device information and exact timestamp will be recorded.
            </p>
          </div>
        )}

        {/* ── STEP 3: Done ── */}
        {step === "done" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">CAF Signed Successfully!</h2>
              <p className="text-gray-500 text-sm mt-2">Your Consent Agreement has been digitally signed and the PDF has been downloaded.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Reference ID</span>
                <span className="font-mono font-bold text-[#0a2463]">{cafId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Campaigner</span>
                <span className="font-semibold">{form.campaignerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-semibold">{form.campaignerPhone}</span>
              </div>
              <div className="flex justify-between flex-wrap gap-1">
                <span className="text-gray-500">Signed At</span>
                <span className="font-semibold text-xs">{signedTimestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Device</span>
                <span className="text-xs text-gray-600 truncate max-w-[160px]">{collectDeviceInfo().platform}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <a href="/"><Button variant="outline">Go to Home</Button></a>
              <a href="/campaigns"><Button className="bg-[#0a2463] hover:bg-blue-900 text-white">Browse Campaigns</Button></a>
            </div>
            <p className="text-xs text-gray-400">Keep your Reference ID safe. Contact us at support@azmifoundation.com for any queries.</p>
          </div>
        )}
      </div>
    </div>
  );
}
