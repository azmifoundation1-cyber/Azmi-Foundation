import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Pencil, Trash2, Star, Loader2, RefreshCw, AlertCircle, CheckCircle,
  Upload, Link as LinkIcon, Play, Pause, EyeOff, Eye, CheckSquare, Copy,
  Users, IndianRupee, ExternalLink, FileText, X, ImagePlus, Video, File,
  CalendarIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Campaign, CampaignDocument } from "@shared/schema";

const emptyForm = {
  title: "", description: "", story: "", category: "other" as const,
  targetAmount: "", imageUrl: "", videoUrl: "", localVideoUrl: "",
  galleryImages: [] as string[],
  status: "active" as const, featured: false, endDate: "",
  upiId: "", upiName: "", bankAccountName: "", bankAccountNumber: "", bankIfsc: "", bankName: "",
};

type Tab = "basic" | "media" | "payments" | "documents";

async function uploadFile(file: File): Promise<{ url: string; fileType: string; originalName: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export default function AdminCampaigns() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [updateDialog, setUpdateDialog] = useState<number | null>(null);
  const [updateForm, setUpdateForm] = useState({ title: "", content: "" });
  const [uploading, setUploading] = useState<string | null>(null); // which field is uploading
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [amountDialog, setAmountDialog] = useState<Campaign | null>(null);
  const [amountValue, setAmountValue] = useState("");
  const [savingAmount, setSavingAmount] = useState(false);
  const [docName, setDocName] = useState("");
  const [docUploading, setDocUploading] = useState(false);

  const heroFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const docFileRef = useRef<HTMLInputElement>(null);

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns").then(r => r.json()),
  });

  const { data: campaignStats } = useQuery<Record<number, { total: number; count: number }>>({
    queryKey: ["/api/admin/analytics/campaigns"],
    queryFn: () => fetch("/api/admin/analytics/campaigns").then(r => r.json()),
  });

  const { data: existingDocs = [], refetch: refetchDocs } = useQuery<CampaignDocument[]>({
    queryKey: ["/api/campaigns", editItem?.id, "documents"],
    queryFn: () => fetch(`/api/campaigns/${editItem!.id}/documents`).then(r => r.json()),
    enabled: !!editItem?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editItem ? `/api/admin/campaigns/${editItem.id}` : "/api/campaigns";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: editItem ? "Campaign updated" : "Campaign created", description: "Changes saved successfully." });
      setDialogOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/campaigns"] }); setDeleteId(null); toast({ title: "Campaign deleted" }); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/admin/campaigns/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/campaigns"] }); toast({ title: "Campaign approved & published!" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/admin/campaigns/${id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: (_data, { status }) => {
      qc.invalidateQueries({ queryKey: ["/api/campaigns"] });
      const labels: Record<string, string> = { active: "Live", paused: "Paused", hidden: "Hidden", completed: "Completed" };
      toast({ title: `Campaign set to ${labels[status] || status}` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addUpdateMutation = useMutation({
    mutationFn: async ({ campaignId, data }: any) => {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/updates`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { setUpdateDialog(null); setUpdateForm({ title: "", content: "" }); toast({ title: "Update posted" }); },
  });

  const featuredMutation = useMutation({
    mutationFn: ({ id, featured }: { id: number; featured: boolean }) =>
      fetch(`/api/admin/campaigns/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ featured }),
      }).then(r => r.json()),
    onSuccess: (_data, { featured }) => {
      qc.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: featured ? "Campaign marked as featured" : "Removed from featured" });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: ({ campaignId, docId }: { campaignId: number; docId: number }) =>
      fetch(`/api/admin/campaigns/${campaignId}/documents/${docId}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { refetchDocs(); toast({ title: "Document removed" }); },
  });

  async function handleAmountUpdate() {
    if (!amountDialog || isNaN(Number(amountValue))) return;
    setSavingAmount(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${amountDialog.id}/amount`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(amountValue) }),
      });
      if (!res.ok) throw new Error("Failed to update amount");
      qc.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: "Amount updated", description: `₹${Number(amountValue).toLocaleString("en-IN")} saved for "${amountDialog.title}"` });
      setAmountDialog(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSavingAmount(false);
  }

  function copyLink(id: number) {
    const url = `${window.location.origin}/campaigns/${id}`;
    navigator.clipboard.writeText(url).then(() => toast({ title: "Link copied!", description: url }));
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading("hero");
    try {
      const { url } = await uploadFile(file);
      setForm(f => ({ ...f, imageUrl: url }));
      toast({ title: "Image uploaded" });
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    setUploading(null);
    e.target.value = "";
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setUploading("gallery");
    try {
      const urls = await Promise.all(files.map(f => uploadFile(f).then(r => r.url)));
      setForm(f => ({ ...f, galleryImages: [...f.galleryImages, ...urls] }));
      toast({ title: `${urls.length} image(s) added to gallery` });
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    setUploading(null);
    e.target.value = "";
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading("video");
    try {
      const { url } = await uploadFile(file);
      setForm(f => ({ ...f, localVideoUrl: url }));
      toast({ title: "Video uploaded" });
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    setUploading(null);
    e.target.value = "";
  }

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !editItem) return;
    setDocUploading(true);
    try {
      const { url, fileType, originalName } = await uploadFile(file);
      const name = docName.trim() || originalName;
      const res = await fetch(`/api/admin/campaigns/${editItem.id}/documents`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, fileUrl: url, fileType }),
      });
      if (!res.ok) throw new Error("Failed to save document");
      refetchDocs();
      setDocName("");
      toast({ title: "Document uploaded", description: name });
    } catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    setDocUploading(false);
    e.target.value = "";
  }

  function openCreate() {
    setEditItem(null); setForm(emptyForm); setUseUrlInput(false); setActiveTab("basic"); setDialogOpen(true);
  }
  function openEdit(c: Campaign) {
    setEditItem(c);
    const endDateStr = (c as any).endDate ? new Date((c as any).endDate).toISOString().slice(0, 16) : "";
    setForm({
      title: c.title, description: c.description, story: c.story || "",
      category: c.category as any, targetAmount: c.targetAmount,
      imageUrl: c.imageUrl || "", videoUrl: c.videoUrl || "",
      localVideoUrl: (c as any).localVideoUrl || "",
      galleryImages: (c as any).galleryImages || [],
      status: c.status as any, featured: c.featured || false, endDate: endDateStr,
      upiId: (c as any).upiId || "", upiName: (c as any).upiName || "",
      bankAccountName: (c as any).bankAccountName || "", bankAccountNumber: (c as any).bankAccountNumber || "",
      bankIfsc: (c as any).bankIfsc || "", bankName: (c as any).bankName || "",
    });
    setUseUrlInput(!!c.imageUrl && !c.imageUrl.startsWith("/uploads/"));
    setActiveTab("basic"); setDialogOpen(true);
  }

  function handleSave() {
    const payload: any = { ...form };
    if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();
    else delete payload.endDate;
    saveMutation.mutate(payload);
  }

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700",
    paused: "bg-yellow-100 text-yellow-700", hidden: "bg-gray-100 text-gray-500",
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "basic", label: "Basic Info" },
    { id: "media", label: "Media" },
    { id: "payments", label: "Payments" },
    { id: "documents", label: "Documents" },
  ];

  const pendingCampaigns = (campaigns || []).filter(c => c.status === "paused" && c.createdBy);
  const activeCampaigns = (campaigns || []).filter(c => !(c.status === "paused" && c.createdBy));

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-sm text-gray-500 mt-1">{campaigns?.length || 0} total campaigns</p>
          </div>
          <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700 gap-2">
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
        ) : (
          <>
            {pendingCampaigns.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-yellow-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Pending Approval ({pendingCampaigns.length})
                </h2>
                <div className="space-y-3">
                  {pendingCampaigns.map(c => (
                    <Card key={c.id} className="border-yellow-200 bg-yellow-50 overflow-hidden">
                      <CardContent className="p-0 flex">
                        {c.imageUrl && <img src={c.imageUrl} alt={c.title} className="w-24 h-20 object-cover flex-shrink-0" />}
                        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm line-clamp-1">{c.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                            <p className="text-xs text-gray-400 mt-1">Target: ₹{Number(c.targetAmount).toLocaleString()} · {c.category}</p>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                              disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(c.id)}>
                              <CheckCircle className="w-3 h-3" /> Approve & Publish
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openEdit(c)}>
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(c.id)}>
                              <Trash2 className="w-3 h-3" /> Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {activeCampaigns.map((c) => (
                <Card key={c.id} className="overflow-hidden">
                  <CardContent className="p-0 flex">
                    {c.imageUrl && <img src={c.imageUrl} alt={c.title} className="w-32 h-28 object-cover flex-shrink-0" />}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 flex-1">{c.title}</h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {c.featured && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.status]}`}>{c.status}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{c.category}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                              <span className="font-bold text-gray-800">₹{Number(c.currentAmount).toLocaleString("en-IN")}</span>
                              <span>of ₹{Number(c.targetAmount).toLocaleString("en-IN")}</span>
                              <span className="text-green-600 font-semibold">
                                ({Math.min(100, Math.round((Number(c.currentAmount) / Number(c.targetAmount)) * 100))}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, Math.round((Number(c.currentAmount) / Number(c.targetAmount)) * 100))}%` }} />
                            </div>
                          </div>
                          {campaignStats?.[c.id] && (
                            <div className="flex gap-3 text-xs text-gray-500 flex-shrink-0">
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{campaignStats[c.id].count} donors</span>
                              <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />₹{campaignStats[c.id].total.toLocaleString("en-IN")}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" disabled={c.status === "active" || statusMutation.isPending}
                            className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
                            onClick={() => statusMutation.mutate({ id: c.id, status: "active" })}>
                            <Play className="w-3 h-3" /> Live
                          </Button>
                          <Button size="sm" variant="outline" disabled={c.status === "paused" || statusMutation.isPending}
                            className="h-7 text-xs gap-1 border-yellow-400 text-yellow-700 hover:bg-yellow-50 disabled:opacity-40"
                            onClick={() => statusMutation.mutate({ id: c.id, status: "paused" })}>
                            <Pause className="w-3 h-3" /> Pause
                          </Button>
                          {c.status === "hidden" ? (
                            <Button size="sm" variant="outline" disabled={statusMutation.isPending}
                              className="h-7 text-xs gap-1 border-green-400 text-green-700 bg-green-50 hover:bg-green-100"
                              onClick={() => statusMutation.mutate({ id: c.id, status: "active" })}>
                              <Eye className="w-3 h-3" /> Unhide
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled={statusMutation.isPending}
                              className="h-7 text-xs gap-1 border-gray-400 text-gray-600 hover:bg-gray-100"
                              onClick={() => statusMutation.mutate({ id: c.id, status: "hidden" })}>
                              <EyeOff className="w-3 h-3" /> Hide
                            </Button>
                          )}
                          <Button size="sm" variant="outline" disabled={c.status === "completed" || statusMutation.isPending}
                            className="h-7 text-xs gap-1 border-blue-400 text-blue-700 hover:bg-blue-50 disabled:opacity-40"
                            onClick={() => statusMutation.mutate({ id: c.id, status: "completed" })}>
                            <CheckSquare className="w-3 h-3" /> Complete
                          </Button>
                          <div className="flex-1" />
                          <Button size="sm" variant="outline"
                            className={`h-7 text-xs gap-1 ${c.featured ? "border-yellow-400 text-yellow-600 bg-yellow-50" : "text-gray-400"}`}
                            onClick={() => featuredMutation.mutate({ id: c.id, featured: !c.featured })}
                            title={c.featured ? "Remove from featured" : "Mark as featured"}>
                            <Star className={`w-3 h-3 ${c.featured ? "fill-yellow-400 text-yellow-500" : ""}`} />
                            {c.featured ? "Featured" : "Feature"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => copyLink(c.id)} title="Copy campaign link">
                            <Copy className="w-3 h-3" /> Link
                          </Button>
                          <a href={`/campaigns/${c.id}`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              <ExternalLink className="w-3 h-3" /> View
                            </Button>
                          </a>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setAmountDialog(c); setAmountValue(String(Number(c.currentAmount))); }}>
                            <IndianRupee className="w-3 h-3" /> Adjust
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setUpdateDialog(c.id)}>
                            <RefreshCw className="w-3 h-3" /> Update
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openEdit(c)}>
                            <Pencil className="w-3 h-3" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(c.id)}>
                            <Trash2 className="w-3 h-3" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* ===== Create / Edit Dialog ===== */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-6 pt-5 pb-3 border-b">
              <DialogTitle>{editItem ? `Edit: ${editItem.title.slice(0, 40)}${editItem.title.length > 40 ? "…" : ""}` : "New Campaign"}</DialogTitle>
            </DialogHeader>

            {/* Tab bar */}
            <div className="flex border-b bg-gray-50 flex-shrink-0">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === t.id ? "border-green-600 text-green-700 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

              {/* ---- BASIC INFO ---- */}
              {activeTab === "basic" && (
                <>
                  <div>
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Campaign title" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["health", "education", "environment", "community", "emergency", "other"].map(c => (
                            <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Target Amount (₹) *</Label>
                      <Input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="500000" />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> End Date & Time</Label>
                      <Input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Short Description * <span className="text-xs text-gray-400">(shown on campaign cards)</span></Label>
                    <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
                  </div>
                  <div>
                    <Label>Full Story <span className="text-xs text-gray-400">(use blank lines to separate paragraphs)</span></Label>
                    <Textarea rows={10} value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))} placeholder="Write the full campaign story here. Leave a blank line between paragraphs..." className="font-mono text-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} id="featured" />
                    <Label htmlFor="featured">Featured on homepage</Label>
                  </div>
                </>
              )}

              {/* ---- MEDIA ---- */}
              {activeTab === "media" && (
                <>
                  {/* Hero Image */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-1.5"><ImagePlus className="w-4 h-4 text-blue-500" /> Hero Image</Label>
                      <button type="button" onClick={() => setUseUrlInput(!useUrlInput)}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        {useUrlInput ? <><Upload className="w-3 h-3" /> Upload file</> : <><LinkIcon className="w-3 h-3" /> Use URL</>}
                      </button>
                    </div>
                    {useUrlInput ? (
                      <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
                    ) : (
                      <div className="flex items-center gap-3">
                        <input type="file" accept="image/*" ref={heroFileRef} className="hidden" onChange={handleHeroUpload} />
                        <Button type="button" variant="outline" className="gap-2" onClick={() => heroFileRef.current?.click()} disabled={uploading === "hero"}>
                          {uploading === "hero" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {uploading === "hero" ? "Uploading..." : "Choose Image"}
                        </Button>
                        {form.imageUrl && (
                          <div className="flex items-center gap-2">
                            <img src={form.imageUrl} alt="Hero" className="w-14 h-14 object-cover rounded border" />
                            <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Gallery Images */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-1.5"><ImagePlus className="w-4 h-4 text-purple-500" /> Gallery Images</Label>
                      <div className="flex gap-2">
                        <input type="file" accept="image/*" multiple ref={galleryFileRef} className="hidden" onChange={handleGalleryUpload} />
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1"
                          onClick={() => galleryFileRef.current?.click()} disabled={uploading === "gallery"}>
                          {uploading === "gallery" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          Add Images
                        </Button>
                      </div>
                    </div>
                    {form.galleryImages.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {form.galleryImages.map((url, i) => (
                          <div key={i} className="relative group rounded overflow-hidden aspect-square border">
                            <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                            <button type="button"
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setForm(f => ({ ...f, galleryImages: f.galleryImages.filter((_, idx) => idx !== i) }))}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No gallery images yet. Upload images to create a gallery shown on the campaign page.</p>
                    )}
                  </div>

                  {/* Local Video */}
                  <div>
                    <Label className="flex items-center gap-1.5 mb-2"><Video className="w-4 h-4 text-red-500" /> Campaign Video (upload file)</Label>
                    <div className="flex items-center gap-3">
                      <input type="file" accept="video/*" ref={videoFileRef} className="hidden" onChange={handleVideoUpload} />
                      <Button type="button" variant="outline" className="gap-2" onClick={() => videoFileRef.current?.click()} disabled={uploading === "video"}>
                        {uploading === "video" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                        {uploading === "video" ? "Uploading..." : "Upload Video"}
                      </Button>
                      {form.localVideoUrl && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-600 font-medium truncate max-w-[180px]">{form.localVideoUrl.split("/").pop()}</span>
                          <button type="button" onClick={() => setForm(f => ({ ...f, localVideoUrl: "" }))} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Max 50MB. Shown above the first paragraph of the story.</p>
                  </div>

                  {/* YouTube URL */}
                  <div>
                    <Label className="flex items-center gap-1.5 mb-1"><Video className="w-4 h-4 text-red-600" /> YouTube Video URL <span className="text-xs text-gray-400">(alternative to upload)</span></Label>
                    <Input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
                  </div>
                </>
              )}

              {/* ---- PAYMENTS ---- */}
              {activeTab === "payments" && (
                <>
                  <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded p-3">These override the global foundation payment details for this specific campaign.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>UPI ID</Label>
                      <Input value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} placeholder="8320218861@okbizaxis" />
                    </div>
                    <div>
                      <Label>UPI Display Name</Label>
                      <Input value={form.upiName} onChange={e => setForm(f => ({ ...f, upiName: e.target.value }))} placeholder="Azmi Foundation" />
                    </div>
                  </div>
                  <div className="pt-1 border-t">
                    <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Bank Account Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Account Holder Name</Label>
                        <Input value={form.bankAccountName} onChange={e => setForm(f => ({ ...f, bankAccountName: e.target.value }))} placeholder="Azmi Foundation Trust" />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input value={form.bankAccountNumber} onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))} placeholder="XXXXXXXXXXXX" />
                      </div>
                      <div>
                        <Label>IFSC Code</Label>
                        <Input value={form.bankIfsc} onChange={e => setForm(f => ({ ...f, bankIfsc: e.target.value }))} placeholder="HDFC0001234" />
                      </div>
                      <div>
                        <Label>Bank Name</Label>
                        <Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="HDFC Bank" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ---- DOCUMENTS ---- */}
              {activeTab === "documents" && (
                <>
                  {!editItem ? (
                    <div className="text-center py-8 text-gray-400">
                      <File className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Save the campaign first, then come back to upload documents.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-50 border rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">Upload Document / Image / PDF</p>
                        <div className="flex items-end gap-3 flex-wrap">
                          <div className="flex-1 min-w-[180px]">
                            <Label className="text-xs">Document Name (optional)</Label>
                            <Input value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. 80G Certificate, Hospital Letter..." className="mt-1" />
                          </div>
                          <div>
                            <input type="file" accept="image/*,video/*,application/pdf,.doc,.docx" ref={docFileRef} className="hidden" onChange={handleDocUpload} />
                            <Button type="button" variant="outline" className="gap-2 border-green-500 text-green-700 hover:bg-green-50"
                              onClick={() => docFileRef.current?.click()} disabled={docUploading}>
                              {docUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                              {docUploading ? "Uploading..." : "Choose File"}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Supports PDF, Word, images, videos. Max 50MB each.</p>
                      </div>

                      {existingDocs.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">No documents uploaded yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded ({existingDocs.length})</p>
                          {existingDocs.map(doc => (
                            <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 group">
                              <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${doc.fileType === "image" ? "bg-purple-100 text-purple-600" : doc.fileType === "video" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                                {doc.fileType === "image" ? <ImagePlus className="w-4 h-4" /> : doc.fileType === "video" ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                                <p className="text-xs text-gray-400 capitalize">{doc.fileType}</p>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><ExternalLink className="w-3 h-3" /> Open</Button>
                                </a>
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 hover:bg-red-50"
                                  onClick={() => deleteDocMutation.mutate({ campaignId: editItem.id, docId: doc.id })}
                                  disabled={deleteDocMutation.isPending}>
                                  <Trash2 className="w-3 h-3" /> Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer — always visible */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
              <div className="flex gap-2">
                {TABS.map((t, i) => i > 0 && (
                  <Button key={t.id} type="button" variant="ghost" size="sm" className="text-xs"
                    onClick={() => setActiveTab(TABS[i - 1].id)}>
                    ← {TABS[i - 1].label}
                  </Button>
                )).filter(Boolean)}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                {activeTab !== "documents" && (
                  <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-green-600 hover:bg-green-700 gap-2">
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {editItem ? "Save Changes" : "Create Campaign"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Amount Adjust Dialog */}
        <Dialog open={!!amountDialog} onOpenChange={() => setAmountDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Adjust Raised Amount</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-500">{amountDialog?.title}</p>
            <div>
              <Label>Current Amount (₹)</Label>
              <Input type="number" value={amountValue} onChange={e => setAmountValue(e.target.value)} placeholder="0" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAmountDialog(null)}>Cancel</Button>
              <Button onClick={handleAmountUpdate} disabled={savingAmount} className="bg-green-600 hover:bg-green-700">
                {savingAmount ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Post Update Dialog */}
        <Dialog open={!!updateDialog} onOpenChange={() => setUpdateDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Post Campaign Update</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Update Title</Label>
                <Input value={updateForm.title} onChange={e => setUpdateForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Surgery complete, thank you!" />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea rows={4} value={updateForm.content} onChange={e => setUpdateForm(f => ({ ...f, content: e.target.value }))} placeholder="Share the latest news with your donors..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateDialog(null)}>Cancel</Button>
              <Button onClick={() => addUpdateMutation.mutate({ campaignId: updateDialog, data: updateForm })} disabled={addUpdateMutation.isPending} className="bg-green-600 hover:bg-green-700">
                {addUpdateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Post Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Delete Campaign?</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-500">This action cannot be undone. All donation records will remain.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
