import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateCAFPdf } from "@/lib/generate-caf-pdf";
import { CheckCircle, FileText, Pen, Phone, RefreshCw, Loader2, Shield, ChevronRight, RotateCcw, Trash2 } from "lucide-react";

const CAF_TEXT = `CONSENT AGREEMENT FOR FUNDRAISING (CAF)

This Consent Agreement for Fundraising ("CAF") is signed and executed in Ahmedabad, Gujarat, India.

BETWEEN
AZMI FOUNDATION, a Public Charitable Trust registered under the Bombay Public Trusts Act, 1950, having Registration No. E/22280/AHMEDABAD dated 23-07-2018, PAN AAGTA9354B, 80G and 12A registered, with its registered office at Gomtipur Bridge East-End, Opp. Kamdar Maidan, Gomtipur, Ahmedabad – 380021, Gujarat (hereinafter referred to as "AZMI" or "the Platform")

AND
The Campaigner, acting as the Beneficiary / Patient or Legal Guardian or authorised Family Member / Representative (hereinafter referred to as the "CAMPAIGNER").

WHEREAS AZMI is a crowdfunding platform providing services for raising funds for Medical, Educational, Hunger Relief, Disaster Relief and other Social Causes.

NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:

1. The campaign shall commence on or after the date of signing with the stated target amount. AZMI does not guarantee achievement of the target.

2. The funds raised shall be used only for the purpose mentioned above.

3. AZMI shall have exclusive rights to all personal information, photographs, videos, medical records, and KYC documents provided by the Campaigner.

4. The Campaigner grants AZMI perpetual rights to use the above information on the platform, social media, and promotional materials for fundraising purposes.

5. AZMI charges zero platform fee. Only actual third-party charges (payment gateway, marketing, GST) shall be deducted as per Annexure A.

6. AZMI may communicate with the Campaigner via email, SMS, WhatsApp or calls for campaign updates.

7. AZMI shall provide periodic updates on funds raised and balance available.

8. Any dispute shall first be resolved through AZMI's two-tier escalation matrix.

9. AZMI shall release funds only after verification of proper invoices and documents.

10. In case of excess funds or campaign termination, AZMI may refund to donors or use for similar charitable causes with transparency.

11. Any misrepresentation or fraud by the Campaigner shall lead to immediate termination of the campaign and possible legal action.

12. The Campaigner agrees to indemnify AZMI against any claims arising due to incorrect information provided.

13. The Campaigner has read, understood and voluntarily agreed to all terms of this agreement.

14. This agreement is governed by the laws of India. Any dispute shall be subject to the exclusive jurisdiction of courts at Ahmedabad, Gujarat.

ANNEXURE – A: INDICATIVE EXPENSE BREAK-UP
• Platform Fee by AZMI: 0% (Zero)
• Payment Gateway Charges: Approx 2%
• Marketing Charges (if applicable): As agreed
• GST & Taxes: 18% on applicable charges`;

type Step = "details" | "otp" | "sign" | "done";

export default function SignCAF() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  const [step, setStep] = useState<Step>("details");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [cafId, setCafId] = useState("");
  const [consent, setConsent] = useState(false);

  const [form, setForm] = useState({
    campaignerName: "",
    campaignerPhone: "",
    beneficiaryName: "",
    purpose: "",
    targetAmount: "",
    hospital: "",
    campaignTitle: "",
  });

  // Init signature pad when on sign step
  useEffect(() => {
    if (step !== "sign" || !canvasRef.current) return;
    const canvas = canvasRef.current;

    function resize() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")!.scale(ratio, ratio);
      padRef.current?.clear();
    }

    padRef.current = new SignaturePad(canvas, {
      backgroundColor: "rgb(255,255,255)",
      penColor: "rgb(10, 36, 99)",
      minWidth: 1.5,
      maxWidth: 4,
    });

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [step]);

  async function sendOTP() {
    if (!form.campaignerPhone || form.campaignerPhone.length < 10) {
      toast({ title: "Enter a valid 10-digit phone number", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/caf/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.campaignerPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOtpSent(true);
      if (data.devOtp) setDevOtp(data.devOtp);
      toast({ title: "OTP sent!", description: "Check your phone for the 6-digit code." });
    } catch (err: any) {
      toast({ title: "Failed to send OTP", description: err.message, variant: "destructive" });
    }
    setSending(false);
  }

  async function verifyOTP() {
    if (otpInput.length !== 6) {
      toast({ title: "Enter the 6-digit OTP", variant: "destructive" });
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/caf/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.campaignerPhone, otp: otpInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Invalid OTP");
      toast({ title: "OTP Verified!", description: "Please draw your signature to complete." });
      setStep("sign");
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    }
    setVerifying(false);
  }

  async function handleSign() {
    if (!padRef.current || padRef.current.isEmpty()) {
      toast({ title: "Please draw your signature", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const signatureDataUrl = padRef.current.toDataURL("image/png");

      // 1. Save to DB
      const saveRes = await fetch("/api/caf/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, signatureDataUrl }),
      });
      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.message);
      const id = saved.cafId;
      setCafId(id);

      // 2. Generate PDF client-side
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
        signedAt: new Date().toLocaleString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      });

      setStep("done");
      toast({ title: "CAF Signed & PDF Downloaded", description: `Reference: ${id}` });
    } catch (err: any) {
      toast({ title: "Signing failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  }

  const stepList: { id: Step; label: string }[] = [
    { id: "details", label: "Campaign Details" },
    { id: "otp", label: "OTP Verification" },
    { id: "sign", label: "Digital Signature" },
    { id: "done", label: "Complete" },
  ];
  const stepIdx = stepList.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0a2463] text-white py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Shield className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div>
            <h1 className="text-lg font-black tracking-tight">Consent Agreement for Fundraising</h1>
            <p className="text-blue-200 text-xs">Azmi Foundation · Legally Binding under IT Act 2000</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="flex items-center gap-1 mb-8">
          {stepList.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex-1 flex flex-col items-center gap-1`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i < stepIdx ? "bg-green-500 text-white" : i === stepIdx ? "bg-[#0a2463] text-white" : "bg-gray-200 text-gray-400"}`}>
                  {i < stepIdx ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] font-semibold text-center leading-tight ${i === stepIdx ? "text-[#0a2463]" : "text-gray-400"}`}>{s.label}</span>
              </div>
              {i < stepList.length - 1 && (
                <div className={`h-0.5 flex-1 mb-4 ${i < stepIdx ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Campaign Details ── */}
        {step === "details" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <h2 className="text-xl font-black text-[#0a2463]">Campaign Details</h2>
              <p className="text-gray-500 text-sm mt-1">Fill in the campaign information before reading and signing the agreement.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Campaigner Full Name *</Label>
                <Input value={form.campaignerName} onChange={e => setForm(f => ({ ...f, campaignerName: e.target.value }))} placeholder="e.g. Mohammed Raza" />
              </div>
              <div>
                <Label>Mobile Number *</Label>
                <Input type="tel" maxLength={10} value={form.campaignerPhone} onChange={e => setForm(f => ({ ...f, campaignerPhone: e.target.value.replace(/\D/g, "") }))} placeholder="10-digit mobile" />
              </div>
              <div>
                <Label>Beneficiary Name</Label>
                <Input value={form.beneficiaryName} onChange={e => setForm(f => ({ ...f, beneficiaryName: e.target.value }))} placeholder="Patient/Beneficiary name" />
              </div>
              <div>
                <Label>Target Amount (₹)</Label>
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
                <Label>Hospital / Institution (if applicable)</Label>
                <Input value={form.hospital} onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))} placeholder="e.g. Apollo Hospital, Ahmedabad" />
              </div>
            </div>

            {/* CAF Text */}
            <div>
              <Label className="mb-2 block">Consent Agreement for Fundraising (CAF)</Label>
              <div className="border border-gray-200 rounded-xl bg-gray-50 p-4 h-64 overflow-y-auto text-xs text-gray-700 font-mono leading-relaxed whitespace-pre-wrap">
                {CAF_TEXT}
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded" />
              <span className="text-sm text-gray-700">
                I have read the entire Consent Agreement for Fundraising (CAF). I voluntarily consent to electronically sign this document under the Information Technology Act, 2000.
              </span>
            </label>

            <Button
              className="w-full bg-[#0a2463] hover:bg-blue-900 text-white gap-2"
              disabled={!consent || !form.campaignerName.trim() || form.campaignerPhone.length < 10}
              onClick={() => setStep("otp")}
            >
              Proceed to OTP Verification <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === "otp" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <h2 className="text-xl font-black text-[#0a2463] flex items-center gap-2">
                <Phone className="w-5 h-5" /> OTP Verification
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                We'll send a 6-digit OTP to <strong>{form.campaignerPhone}</strong> to verify your identity.
              </p>
            </div>

            {!otpSent ? (
              <Button className="w-full bg-[#0a2463] hover:bg-blue-900 text-white gap-2" onClick={sendOTP} disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                {sending ? "Sending OTP…" : `Send OTP to ${form.campaignerPhone}`}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-medium">
                  ✓ OTP sent to {form.campaignerPhone}
                  {devOtp && (
                    <span className="block mt-1 text-amber-700 font-bold text-xs">
                      [Dev Mode] Your OTP: <span className="font-mono text-base">{devOtp}</span>
                    </span>
                  )}
                </div>
                <div>
                  <Label>Enter 6-Digit OTP</Label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 123456"
                    className="text-2xl tracking-widest font-mono text-center"
                  />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2" onClick={verifyOTP} disabled={verifying || otpInput.length < 6}>
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {verifying ? "Verifying…" : "Verify & Proceed"}
                </Button>
                <button onClick={() => { setOtpSent(false); setOtpInput(""); setDevOtp(""); }} className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Resend OTP
                </button>
              </div>
            )}

            <button onClick={() => setStep("details")} className="text-sm text-gray-400 hover:text-gray-600">← Back to Details</button>
          </div>
        )}

        {/* ── STEP 3: Signature ── */}
        {step === "sign" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <h2 className="text-xl font-black text-[#0a2463] flex items-center gap-2">
                <Pen className="w-5 h-5" /> Draw Your Signature
              </h2>
              <p className="text-gray-500 text-sm mt-1">Use your finger or stylus to sign in the box below. This will be embedded in the signed CAF PDF.</p>
            </div>

            {/* Signature Canvas */}
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
              <Button variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => padRef.current?.clear()}>
                <Trash2 className="w-4 h-4" /> Clear
              </Button>
              <Button
                className="flex-1 bg-[#0a2463] hover:bg-blue-900 text-white gap-2"
                onClick={handleSign}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {saving ? "Generating PDF…" : "Sign & Download PDF"}
              </Button>
            </div>

            {/* Legal note */}
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              By clicking "Sign & Download PDF", you confirm this is your electronic signature. This document is legally binding under the Information Technology Act, 2000 and is equivalent to a physical signature.
            </p>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === "done" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">CAF Signed Successfully!</h2>
              <p className="text-gray-500 text-sm mt-2">Your Consent Agreement has been digitally signed and the PDF has been downloaded to your device.</p>
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
              <div className="flex justify-between">
                <span className="text-gray-500">OTP Verified</span>
                <span className="text-green-600 font-bold">✓ Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Signed At</span>
                <span className="font-semibold">{new Date().toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <a href="/">
                <Button variant="outline">Go to Home</Button>
              </a>
              <a href="/campaigns">
                <Button className="bg-[#0a2463] hover:bg-blue-900 text-white">Browse Campaigns</Button>
              </a>
            </div>
            <p className="text-xs text-gray-400">
              Keep your Reference ID safe. Contact us at support@azmifoundation.com for any queries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
