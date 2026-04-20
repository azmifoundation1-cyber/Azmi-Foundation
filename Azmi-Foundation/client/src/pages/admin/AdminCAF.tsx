import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { generateCAFPdf } from "@/lib/generate-caf-pdf";
import { useAuth } from "@/hooks/use-auth";
import {
  FileText, CheckCircle, XCircle, Phone, Calendar, Search,
  Download, Plus, Pen, RotateCcw, Trash2, Loader2, Link2,
  Clock, Copy, ExternalLink, Shield, User, Star, AlertTriangle,
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
  signedAt?: string;
  deviceInfo?: any;
  adminGeneratedBy?: string;
  createdAt: string;
}

interface CAFRequest {
  id: number;
  token: string;
  adminName: string;
  campaignerName: string;
  campaignerPhone: string;
  beneficiaryName?: string;
  purpose?: string;
  targetAmount?: string;
  hospital?: string;
  campaignTitle?: string;
  status: "pending" | "signed";
  signedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

const EMPTY_FORM = {
  campaignerName: "", campaignerPhone: "",
  beneficiaryName: "", purpose: "", targetAmount: "",
  hospital: "", campaignTitle: "",
};

function cafRef(id: number) { return `CAF-${String(id).padStart(6, "0")}`; }

function nowIST() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  }) + " IST";
}

function collectDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform || (navigator as any).userAgentData?.platform || "Unknown",
    screenSize: `${screen.width}x${screen.height} (DPR: ${window.devicePixelRatio})`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export default function AdminCAF() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminDisplayName = (user as any)?.firstName
    ? `${(user as any).firstName} ${(user as any).lastName || ""}`.trim()
    : (user as any)?.email || "Admin";

  const [tab, setTab] = useState<"signed" | "requests">("signed");
  const [search, setSearch] = useState("");
  const [pdfOpen, setPdfOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [linkForm, setLinkForm] = useState({ ...EMPTY_FORM, expiryHours: "72" });
  const [generatedLink, setGeneratedLink] = useState("");
  const [redownloading, setRedownloading] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  const { data: meInfo } = useQuery<{ role: string }>({
    queryKey: ["/api/admin/me"],
    queryFn: () => fetch("/api/admin/me").then(r => r.json()),
  });
  const isSuperAdmin = meInfo?.role === "super_admin";

  const { data: records = [], isLoading: loadingRecords } = useQuery<CAFRecord[]>({ queryKey: ["/api/admin/caf"] });
  const { data: requests = [], isLoading: loadingRequests } = useQuery<CAFRequest[]>({ queryKey: ["/api/admin/caf/requests"] });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Init signature pad for PDF generate dialog
  useEffect(() => {
    if (!pdfOpen) return;
    let cancelled = false;
    function initPad() {
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const w = canvas.offsetWidth || canvas.parentElement?.offsetWidth || 560;
      canvas.width = w * ratio;
      canvas.height = 160 * ratio;
      canvas.getContext("2d")!.scale(ratio, ratio);
      if (padRef.current) padRef.current.off();
      padRef.current = new SignaturePad(canvas, {
        backgroundColor: "rgb(255,255,255)",
        penColor: "rgb(10, 36, 99)",
        minWidth: 1.5, maxWidth: 4,
      });
      padRef.current.clear();
    }
    const t = setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(initPad)), 220);
    return () => { cancelled = true; clearTimeout(t); };
  }, [pdfOpen]);

  const filtered = records.filter(r =>
    [r.campaignerName, r.campaignerPhone, r.beneficiaryName, r.purpose, r.campaignTitle]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );
  const filteredReqs = requests.filter(r =>
    [r.campaignerName, r.campaignerPhone, r.purpose, r.campaignTitle]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  async function handleGeneratePdf() {
    if (!form.campaignerName.trim() || !form.campaignerPhone.trim()) {
      toast({ title: "Campaigner name and phone are required", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const signatureDataUrl = padRef.current && !padRef.current.isEmpty()
        ? padRef.current.toDataURL("image/png") : "";
      const ts = nowIST();
      const cafId = `CAF-ADM-${Date.now().toString().slice(-6)}`;
      const adminDevice = collectDeviceInfo();
      let adminIp: string | undefined;
      try {
        const ipRes = await fetch("/api/admin/my-ip");
        const ipData = await ipRes.json();
        adminIp = ipData.ip;
      } catch (_) {}
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
        signedAt: ts,
        generatedByAdmin: true,
        adminName: adminDisplayName,
        adminSignedAt: ts,
        adminIpAddress: adminIp,
        adminDeviceInfo: adminDevice,
      });
      toast({ title: "PDF generated!", description: `${cafId} downloaded` });
      setPdfOpen(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      toast({ title: "PDF generation failed", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  }

  async function handleCreateLink() {
    if (!linkForm.campaignerName.trim() || !linkForm.campaignerPhone.trim()) {
      toast({ title: "Campaigner name and phone are required", variant: "destructive" });
      return;
    }
    setCreatingLink(true);
    try {
      const res = await fetch("/api/admin/caf/create-request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...linkForm, expiryHours: Number(linkForm.expiryHours) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setGeneratedLink(data.link);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/caf/requests"] });
      toast({ title: "Signing link created!", description: "Share the link with the campaigner." });
    } catch (err: any) {
      toast({ title: "Failed to create link", description: err.message, variant: "destructive" });
    }
    setCreatingLink(false);
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
        signedAt: r.signedAt
          ? new Date(r.signedAt).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
            }) + " IST"
          : new Date(r.createdAt).toLocaleString("en-IN"),
        generatedByAdmin: !!r.adminGeneratedBy,
        adminName: r.adminGeneratedBy || adminDisplayName,
        deviceInfo: r.deviceInfo,
        ipAddress: r.ipAddress || undefined,
      });
      toast({ title: "PDF downloaded", description: cafRef(r.id) });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
    setRedownloading(null);
  }

  async function handleDeleteCAF(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/caf/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/caf"] });
      toast({ title: "CAF deleted permanently", description: `CAF-${String(id).padStart(6, "0")} removed` });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied to clipboard!" });
  }

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">CAF Management</h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5 flex-wrap">
            <User className="w-3.5 h-3.5" /> Logged in as <strong>{adminDisplayName}</strong>
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Super Admin
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-sm px-3 py-1">
            {records.length} Signed
          </Badge>
          {pendingCount > 0 && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-sm px-3 py-1">
              {pendingCount} Pending Links
            </Badge>
          )}
          <Button variant="outline" className="gap-2" onClick={() => { setLinkForm({ ...EMPTY_FORM, expiryHours: "72" }); setGeneratedLink(""); setLinkOpen(true); }}>
            <Link2 className="w-4 h-4" /> Generate Signing Link
          </Button>
          <Button className="bg-[#0a2463] hover:bg-blue-900 text-white gap-2" onClick={() => { setForm(EMPTY_FORM); setPdfOpen(true); }}>
            <Plus className="w-4 h-4" /> Generate CAF PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["signed", "requests"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px
              ${tab === t ? "border-[#0a2463] text-[#0a2463]" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
            {t === "signed" ? "Signed CAFs" : "Signing Requests"}
            {t === "requests" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search by name, phone, purpose…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* ── Tab: Signed CAFs ── */}
      {tab === "signed" && (
        loadingRecords ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No signed CAFs yet</p>
            <p className="text-sm mt-1">CAFs signed via /sign-caf will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-[#0a2463] font-bold bg-blue-50 px-2 py-0.5 rounded">{cafRef(r.id)}</span>
                      {r.otpVerified
                        ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1"><CheckCircle className="w-3 h-3" /> OTP Verified</Badge>
                        : <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1"><XCircle className="w-3 h-3" /> Unverified</Badge>}
                      {r.adminGeneratedBy && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs gap-1"><Shield className="w-3 h-3" /> Admin: {r.adminGeneratedBy}</Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{r.campaignerName}</h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5"><Phone className="w-3 h-3" /> {r.campaignerPhone}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {r.signedAt && (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Signed: {new Date(r.signedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })} IST
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="gap-1.5 text-[#0a2463] border-blue-200 hover:bg-blue-50"
                      disabled={redownloading === r.id} onClick={() => redownloadPdf(r)}>
                      {redownloading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      Download PDF
                    </Button>
                    {/* Delete — Super Admins only */}
                    {isSuperAdmin && (
                      confirmDeleteId === r.id ? (
                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span className="text-xs text-red-700 font-medium">Delete forever?</span>
                          <Button size="sm" variant="destructive" className="h-6 px-2 text-xs"
                            disabled={deletingId === r.id} onClick={() => handleDeleteCAF(r.id)}>
                            {deletingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs"
                            onClick={() => setConfirmDeleteId(null)}>No</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 h-7"
                          onClick={() => setConfirmDeleteId(r.id)}>
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  {r.beneficiaryName && <div><span className="text-gray-400 text-xs uppercase tracking-wide block">Beneficiary</span><span className="font-medium">{r.beneficiaryName}</span></div>}
                  {r.campaignTitle && <div><span className="text-gray-400 text-xs uppercase tracking-wide block">Campaign</span><span className="font-medium">{r.campaignTitle}</span></div>}
                  {r.targetAmount && <div><span className="text-gray-400 text-xs uppercase tracking-wide block">Target</span><span className="font-bold text-[#0a2463]">Rs. {Number(r.targetAmount).toLocaleString("en-IN")}</span></div>}
                  {r.purpose && <div className="col-span-2 sm:col-span-3"><span className="text-gray-400 text-xs uppercase tracking-wide block">Purpose</span><span className="font-medium">{r.purpose}</span></div>}
                  {r.hospital && <div className="col-span-2 sm:col-span-3"><span className="text-gray-400 text-xs uppercase tracking-wide block">Hospital</span><span className="font-medium">{r.hospital}</span></div>}
                  {r.ipAddress && <div><span className="text-gray-400 text-xs uppercase tracking-wide block">IP Address</span><span className="font-mono text-xs">{r.ipAddress}</span></div>}
                  {r.deviceInfo && (
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-gray-400 text-xs uppercase tracking-wide block">Device</span>
                      <span className="text-xs text-gray-600">
                        {r.deviceInfo.platform && `${r.deviceInfo.platform}`}
                        {r.deviceInfo.screenSize && ` · ${r.deviceInfo.screenSize}`}
                        {r.deviceInfo.language && ` · ${r.deviceInfo.language}`}
                        {r.deviceInfo.timezone && ` · ${r.deviceInfo.timezone}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Tab: Signing Requests ── */}
      {tab === "requests" && (
        loadingRequests ? (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        ) : filteredReqs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Link2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No signing links yet</p>
            <p className="text-sm mt-1">Create a signing link for a campaigner using the button above.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredReqs.map(r => {
              const expired = r.expiresAt && new Date(r.expiresAt) < new Date();
              const link = `${window.location.origin}/sign-caf?token=${r.token}`;
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">REQ-{String(r.id).padStart(5, "0")}</span>
                        {r.status === "signed"
                          ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1"><CheckCircle className="w-3 h-3" /> Signed</Badge>
                          : expired
                          ? <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-xs gap-1"><XCircle className="w-3 h-3" /> Expired</Badge>
                          : <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs gap-1"><Clock className="w-3 h-3" /> Pending</Badge>}
                        <Badge className="bg-gray-50 text-gray-600 border-gray-200 text-xs gap-1"><Shield className="w-3 h-3" /> {r.adminName}</Badge>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{r.campaignerName}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm"><Phone className="w-3 h-3" /> {r.campaignerPhone}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />Created: {new Date(r.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      {r.expiresAt && <div className={expired ? "text-red-500" : "text-gray-400"}><Clock className="w-3 h-3 inline mr-1" />Expires: {new Date(r.expiresAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>}
                      {r.signedAt && <div className="text-green-600"><CheckCircle className="w-3 h-3 inline mr-1" />Signed: {new Date(r.signedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>}
                    </div>
                  </div>
                  {r.status === "pending" && !expired && (
                    <div className="mt-3 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                      <span className="text-xs text-gray-600 font-mono truncate flex-1">{link}</span>
                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-gray-600 flex-shrink-0" onClick={() => copyLink(link)}>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </Button>
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-[#0a2463] flex-shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </Button>
                      </a>
                    </div>
                  )}
                  {(r.purpose || r.campaignTitle) && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {r.campaignTitle && <div><span className="text-gray-400 text-xs uppercase tracking-wide block">Campaign</span><span className="font-medium">{r.campaignTitle}</span></div>}
                      {r.purpose && <div><span className="text-gray-400 text-xs uppercase tracking-wide block">Purpose</span><span className="font-medium">{r.purpose}</span></div>}
                      {r.targetAmount && <div><span className="text-gray-400 text-xs uppercase tracking-wide block">Target</span><span className="font-bold text-[#0a2463]">Rs. {Number(r.targetAmount).toLocaleString("en-IN")}</span></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Generate CAF PDF Dialog ── */}
      <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0a2463] font-black text-xl flex items-center gap-2">
              <FileText className="w-5 h-5" /> Generate CAF PDF
            </DialogTitle>
            <p className="text-gray-500 text-sm">PDF will be stamped: Generated by <strong>{adminDisplayName}</strong> — Azmi Foundation Admin</p>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "campaignerName", label: "Campaigner Full Name *", placeholder: "e.g. Mohammed Raza" },
                { key: "campaignerPhone", label: "Mobile Number *", placeholder: "10-digit mobile", type: "tel" },
                { key: "beneficiaryName", label: "Beneficiary Name", placeholder: "Patient / Beneficiary name" },
                { key: "targetAmount", label: "Target Amount (Rs.)", placeholder: "e.g. 500000", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input type={f.type || "text"} placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              {[
                { key: "campaignTitle", label: "Campaign Title", placeholder: "e.g. Help Raza fight cancer", span: true },
                { key: "purpose", label: "Purpose of Fundraising", placeholder: "e.g. Medical treatment", span: true },
                { key: "hospital", label: "Hospital / Institution", placeholder: "e.g. Apollo Hospital", span: true },
              ].map(f => (
                <div key={f.key} className="sm:col-span-2">
                  <Label>{f.label}</Label>
                  <Input placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div>
              <Label className="mb-2 block flex items-center gap-2"><Pen className="w-3.5 h-3.5" /> Admin Signature <span className="text-gray-400 font-normal">(optional)</span></Label>
              <div className="border-2 border-[#0a2463] rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-3 py-1.5 text-xs text-gray-400 border-b flex items-center justify-between">
                  <span>Draw signature</span>
                  <div className="flex gap-3">
                    <button onClick={() => padRef.current?.undo()} className="flex items-center gap-1 text-gray-500 hover:text-gray-800"><RotateCcw className="w-3 h-3" /> Undo</button>
                    <button onClick={() => padRef.current?.clear()} className="flex items-center gap-1 text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /> Clear</button>
                  </div>
                </div>
                <canvas ref={canvasRef} className="block w-full touch-none cursor-crosshair" style={{ height: 160 }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave blank to generate without signature.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setPdfOpen(false); setForm(EMPTY_FORM); }}>Cancel</Button>
              <Button className="flex-1 bg-[#0a2463] hover:bg-blue-900 text-white gap-2"
                disabled={generating || !form.campaignerName.trim() || !form.campaignerPhone.trim()} onClick={handleGeneratePdf}>
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Download className="w-4 h-4" /> Generate & Download</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Generate Signing Link Dialog ── */}
      <Dialog open={linkOpen} onOpenChange={v => { setLinkOpen(v); if (!v) { setGeneratedLink(""); setLinkForm({ ...EMPTY_FORM, expiryHours: "72" }); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0a2463] font-black text-xl flex items-center gap-2">
              <Link2 className="w-5 h-5" /> Generate Signing Link for Campaigner
            </DialogTitle>
            <p className="text-gray-500 text-sm">Pre-fill the details and share a secure link. The campaigner signs via their phone with OTP verification.</p>
          </DialogHeader>

          {generatedLink ? (
            <div className="space-y-4 pt-2">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                <p className="font-bold text-green-800">Signing link created successfully!</p>
                <p className="text-sm text-green-600">Share this link with <strong>{linkForm.campaignerName}</strong> to collect their signature.</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Signing Link</p>
                <p className="font-mono text-sm text-[#0a2463] break-all">{generatedLink}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => copyLink(generatedLink)}>
                    <Copy className="w-4 h-4" /> Copy Link
                  </Button>
                  <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="w-4 h-4" /> Open Link
                    </Button>
                  </a>
                </div>
              </div>
              <Button className="w-full bg-[#0a2463] hover:bg-blue-900 text-white" onClick={() => { setLinkOpen(false); setTab("requests"); setGeneratedLink(""); }}>
                View in Signing Requests
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "campaignerName", label: "Campaigner Full Name *", placeholder: "e.g. Mohammed Raza" },
                  { key: "campaignerPhone", label: "Mobile Number *", placeholder: "10-digit mobile", type: "tel" },
                  { key: "beneficiaryName", label: "Beneficiary Name", placeholder: "Patient / Beneficiary" },
                  { key: "targetAmount", label: "Target Amount (Rs.)", placeholder: "e.g. 500000", type: "number" },
                ].map(f => (
                  <div key={f.key}>
                    <Label>{f.label}</Label>
                    <Input type={f.type || "text"} placeholder={f.placeholder}
                      value={(linkForm as any)[f.key]}
                      onChange={e => setLinkForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                {[
                  { key: "campaignTitle", label: "Campaign Title", placeholder: "e.g. Help Raza fight cancer" },
                  { key: "purpose", label: "Purpose of Fundraising", placeholder: "e.g. Medical treatment" },
                  { key: "hospital", label: "Hospital / Institution", placeholder: "e.g. Apollo Hospital" },
                ].map(f => (
                  <div key={f.key} className="sm:col-span-2">
                    <Label>{f.label}</Label>
                    <Input placeholder={f.placeholder} value={(linkForm as any)[f.key]} onChange={e => setLinkForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <Label>Link Expiry</Label>
                  <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background"
                    value={linkForm.expiryHours} onChange={e => setLinkForm(p => ({ ...p, expiryHours: e.target.value }))}>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                    <option value="72">72 hours (3 days)</option>
                    <option value="168">7 days</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setLinkOpen(false)}>Cancel</Button>
                <Button className="flex-1 bg-[#0a2463] hover:bg-blue-900 text-white gap-2"
                  disabled={creatingLink || !linkForm.campaignerName.trim() || !linkForm.campaignerPhone.trim()} onClick={handleCreateLink}>
                  {creatingLink ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Link2 className="w-4 h-4" /> Create Signing Link</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
