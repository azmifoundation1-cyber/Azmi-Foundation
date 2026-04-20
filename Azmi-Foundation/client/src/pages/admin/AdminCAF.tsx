import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { generateCAFPdf } from "@/lib/generate-caf-pdf";
import {
  FileText, CheckCircle, XCircle, Phone, Calendar,
  Search, Download, Plus, Pen, RotateCcw, Trash2, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface CAFRecord {
  id: number;
  campaignerName: string;
  campaignerPhone: string;
  beneficiaryName?: string;
  purpose?: string;
  targetAmount?: string;
  hospital?: string;
  campaignTitle?: string;
  signatureDataUrl?: string;
  otpVerified: boolean;
  ipAddress?: string;
  createdAt: string;
}

const EMPTY_FORM = {
  campaignerName: "",
  campaignerPhone: "",
  beneficiaryName: "",
  purpose: "",
  targetAmount: "",
  hospital: "",
  campaignTitle: "",
};

export default function AdminCAF() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [redownloading, setRedownloading] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  const { data: records = [], isLoading } = useQuery<CAFRecord[]>({
    queryKey: ["/api/admin/caf"],
  });

  const filtered = records.filter(r =>
    [r.campaignerName, r.campaignerPhone, r.beneficiaryName, r.purpose, r.campaignTitle]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  // Init signature pad when dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    function initPad() {
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const w = canvas.offsetWidth || canvas.parentElement?.offsetWidth || 560;
      const h = 160;
      canvas.width = w * ratio;
      canvas.height = h * ratio;
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

    // Dialog has a CSS transition (~200ms). Wait for it, then double-RAF to
    // ensure the browser has measured the canvas before we read offsetWidth.
    const t = setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(initPad)), 220);

    return () => { cancelled = true; clearTimeout(t); };
  }, [open]);

  function cafRef(id: number) {
    return `CAF-${String(id).padStart(6, "0")}`;
  }

  async function handleGenerate() {
    if (!form.campaignerName.trim() || !form.campaignerPhone.trim()) {
      toast({ title: "Campaigner name and phone are required", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const signatureDataUrl = padRef.current && !padRef.current.isEmpty()
        ? padRef.current.toDataURL("image/png")
        : "";

      const id = Date.now(); // local-only ref for admin PDFs
      const cafId = `CAF-ADM-${String(id).slice(-6)}`;
      const now = new Date().toLocaleString("en-IN", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      await generateCAFPdf({
        cafId,
        campaignerName: form.campaignerName,
        campaignerPhone: form.campaignerPhone,
        beneficiaryName: form.beneficiaryName,
        purpose: form.purpose,
        targetAmount: form.targetAmount,
        hospital: form.hospital,
        campaignTitle: form.campaignTitle,
        signatureDataUrl,
        signedAt: now,
        generatedByAdmin: true,
      });

      toast({ title: "PDF generated!", description: `${cafId} downloaded` });
      setOpen(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      toast({ title: "PDF generation failed", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  }

  async function redownloadPdf(r: CAFRecord) {
    setRedownloading(r.id);
    try {
      await generateCAFPdf({
        cafId: cafRef(r.id),
        campaignerName: r.campaignerName,
        campaignerPhone: r.campaignerPhone,
        beneficiaryName: r.beneficiaryName || "",
        purpose: r.purpose || "",
        targetAmount: r.targetAmount || "",
        hospital: r.hospital || "",
        campaignTitle: r.campaignTitle || "",
        signatureDataUrl: r.signatureDataUrl || "",
        signedAt: new Date(r.createdAt).toLocaleString("en-IN", {
          day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        }),
        generatedByAdmin: false,
      });
      toast({ title: "PDF downloaded", description: cafRef(r.id) });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
    setRedownloading(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Signed CAFs</h1>
          <p className="text-gray-500 text-sm mt-0.5">Consent Agreements for Fundraising</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-sm px-3 py-1">
            {records.length} Total
          </Badge>
          <Button
            className="bg-[#0a2463] hover:bg-blue-900 text-white gap-2"
            onClick={() => setOpen(true)}
          >
            <Plus className="w-4 h-4" /> Generate CAF PDF
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Search by name, phone, purpose…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Records list */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No signed CAFs yet</p>
          <p className="text-sm mt-1">CAFs signed via /sign-caf will appear here, or generate one above.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-[#0a2463] font-bold bg-blue-50 px-2 py-0.5 rounded">
                      {cafRef(r.id)}
                    </span>
                    {r.otpVerified ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                        <CheckCircle className="w-3 h-3" /> OTP Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1">
                        <XCircle className="w-3 h-3" /> Unverified
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{r.campaignerName}</h3>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                    <Phone className="w-3 h-3" /> {r.campaignerPhone}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(r.createdAt).toLocaleString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-[#0a2463] border-blue-200 hover:bg-blue-50"
                    disabled={redownloading === r.id}
                    onClick={() => redownloadPdf(r)}
                  >
                    {redownloading === r.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />}
                    Download PDF
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                {r.beneficiaryName && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Beneficiary</span>
                    <span className="font-medium text-gray-800">{r.beneficiaryName}</span>
                  </div>
                )}
                {r.campaignTitle && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Campaign</span>
                    <span className="font-medium text-gray-800">{r.campaignTitle}</span>
                  </div>
                )}
                {r.targetAmount && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Target Amount</span>
                    <span className="font-bold text-[#0a2463]">
                      ₹{Number(r.targetAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                {r.purpose && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Purpose</span>
                    <span className="font-medium text-gray-800">{r.purpose}</span>
                  </div>
                )}
                {r.hospital && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Hospital / Institution</span>
                    <span className="font-medium text-gray-800">{r.hospital}</span>
                  </div>
                )}
                {r.ipAddress && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Signed From IP</span>
                    <span className="font-mono text-xs text-gray-600">{r.ipAddress}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Generate CAF PDF Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0a2463] font-black text-xl flex items-center gap-2">
              <FileText className="w-5 h-5" /> Generate CAF PDF
            </DialogTitle>
            <p className="text-gray-500 text-sm">
              Fill in the campaigner details and optionally add an admin signature. The PDF will be stamped as "Generated by Azmi Foundation Admin".
            </p>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Campaigner Full Name *</Label>
                <Input
                  value={form.campaignerName}
                  onChange={e => setForm(f => ({ ...f, campaignerName: e.target.value }))}
                  placeholder="e.g. Mohammed Raza"
                />
              </div>
              <div>
                <Label>Mobile Number *</Label>
                <Input
                  type="tel"
                  maxLength={10}
                  value={form.campaignerPhone}
                  onChange={e => setForm(f => ({ ...f, campaignerPhone: e.target.value.replace(/\D/g, "") }))}
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <Label>Beneficiary Name</Label>
                <Input
                  value={form.beneficiaryName}
                  onChange={e => setForm(f => ({ ...f, beneficiaryName: e.target.value }))}
                  placeholder="Patient / Beneficiary name"
                />
              </div>
              <div>
                <Label>Target Amount (₹)</Label>
                <Input
                  type="number"
                  value={form.targetAmount}
                  onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                  placeholder="e.g. 500000"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Campaign Title</Label>
                <Input
                  value={form.campaignTitle}
                  onChange={e => setForm(f => ({ ...f, campaignTitle: e.target.value }))}
                  placeholder="e.g. Help Raza fight cancer"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Purpose of Fundraising</Label>
                <Input
                  value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  placeholder="e.g. Medical treatment for liver disease"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Hospital / Institution (if applicable)</Label>
                <Input
                  value={form.hospital}
                  onChange={e => setForm(f => ({ ...f, hospital: e.target.value }))}
                  placeholder="e.g. Apollo Hospital, Ahmedabad"
                />
              </div>
            </div>

            {/* Signature pad */}
            <div>
              <Label className="mb-2 block flex items-center gap-2">
                <Pen className="w-3.5 h-3.5" /> Admin Signature <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <div className="border-2 border-[#0a2463] rounded-xl overflow-hidden bg-white">
                <div className="bg-gray-50 px-3 py-1.5 text-xs text-gray-400 border-b border-gray-100 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Pen className="w-3 h-3" /> Draw signature here</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => padRef.current?.undo()}
                      className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-xs"
                    >
                      <RotateCcw className="w-3 h-3" /> Undo
                    </button>
                    <button
                      type="button"
                      onClick={() => padRef.current?.clear()}
                      className="text-red-400 hover:text-red-600 flex items-center gap-1 text-xs"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  </div>
                </div>
                <canvas
                  ref={canvasRef}
                  className="block w-full touch-none cursor-crosshair"
                  style={{ height: 160 }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Leave blank to generate without a signature. The PDF will be stamped "Generated By: Azmi Foundation Admin".
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setOpen(false); setForm(EMPTY_FORM); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#0a2463] hover:bg-blue-900 text-white gap-2"
                disabled={generating || !form.campaignerName.trim() || !form.campaignerPhone.trim()}
                onClick={handleGenerate}
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                  : <><Download className="w-4 h-4" /> Generate & Download PDF</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
