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
import { Plus, Pencil, Trash2, Star, Loader2, RefreshCw, AlertCircle, CheckCircle, Upload, Link as LinkIcon, Play, Pause, EyeOff, Eye, CheckSquare, Copy, Users, IndianRupee, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Campaign } from "@shared/schema";

const emptyForm = {
  title: "", description: "", story: "", category: "other" as const,
  targetAmount: "", imageUrl: "", videoUrl: "", status: "active" as const, featured: false,
  upiId: "", upiName: "", bankAccountName: "", bankAccountNumber: "", bankIfsc: "", bankName: "",
};

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
}

export default function AdminCampaigns() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Campaign | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [updateDialog, setUpdateDialog] = useState<number | null>(null);
  const [updateForm, setUpdateForm] = useState({ title: "", content: "" });
  const [uploading, setUploading] = useState(false);
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [amountDialog, setAmountDialog] = useState<Campaign | null>(null);
  const [amountValue, setAmountValue] = useState("");
  const [savingAmount, setSavingAmount] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns").then(r => r.json()),
  });

  const { data: campaignStats } = useQuery<Record<number, { total: number; count: number }>>({
    queryKey: ["/api/admin/analytics/campaigns"],
    queryFn: () => fetch("/api/admin/analytics/campaigns").then(r => r.json()),
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
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/campaigns"] }); toast({ title: "Campaign approved & published!" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/admin/campaigns/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      }).then(r => r.json()),
    onSuccess: (_data, { featured }) => {
      qc.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({ title: featured ? "Campaign marked as featured" : "Removed from featured" });
    },
  });

  async function handleAmountUpdate() {
    if (!amountDialog || isNaN(Number(amountValue))) return;
    setSavingAmount(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${amountDialog.id}/amount`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amountValue) }),
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setForm(f => ({ ...f, imageUrl: url }));
      toast({ title: "Image uploaded successfully" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function openCreate() { setEditItem(null); setForm(emptyForm); setUseUrlInput(false); setDialogOpen(true); }
  function openEdit(c: Campaign) {
    setEditItem(c);
    setForm({ title: c.title, description: c.description, story: c.story || "", category: c.category as any, targetAmount: c.targetAmount, imageUrl: c.imageUrl || "", videoUrl: c.videoUrl || "", status: c.status as any, featured: c.featured || false, upiId: (c as any).upiId || "", upiName: (c as any).upiName || "", bankAccountName: (c as any).bankAccountName || "", bankAccountNumber: (c as any).bankAccountNumber || "", bankIfsc: (c as any).bankIfsc || "", bankName: (c as any).bankName || "" });
    setUseUrlInput(!!c.imageUrl && !c.imageUrl.startsWith("/uploads/"));
    setDialogOpen(true);
  }

  const statusColor: Record<string, string> = { active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700", paused: "bg-yellow-100 text-yellow-700", hidden: "bg-gray-100 text-gray-500" };

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
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate(c.id)}>
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
                        {/* Progress + analytics */}
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
                        {/* Quick status row */}
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
                          {/* Featured star toggle */}
                          <Button size="sm" variant="outline"
                            className={`h-7 text-xs gap-1 ${c.featured ? "border-yellow-400 text-yellow-600 bg-yellow-50" : "text-gray-400"}`}
                            onClick={() => featuredMutation.mutate({ id: c.id, featured: !c.featured })}
                            title={c.featured ? "Remove from featured" : "Mark as featured"}>
                            <Star className={`w-3 h-3 ${c.featured ? "fill-yellow-400 text-yellow-500" : ""}`} />
                            {c.featured ? "Featured" : "Feature"}
                          </Button>
                          {/* Copy campaign link */}
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => copyLink(c.id)} title="Copy campaign link">
                            <Copy className="w-3 h-3" /> Link
                          </Button>
                          {/* View live */}
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

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Campaign" : "New Campaign"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
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
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Target Amount (₹) *</Label>
                <Input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="500000" />
              </div>
              <div>
                <Label>Short Description *</Label>
                <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
              </div>
              <div>
                <Label>Full Story</Label>
                <Textarea rows={4} value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))} placeholder="Detailed story shown on campaign page..." />
              </div>

              {/* Image upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Campaign Image</Label>
                  <button type="button" onClick={() => setUseUrlInput(!useUrlInput)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    {useUrlInput ? <><Upload className="w-3 h-3" /> Upload file</> : <><LinkIcon className="w-3 h-3" /> Use URL instead</>}
                  </button>
                </div>
                {useUrlInput ? (
                  <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
                ) : (
                  <div className="flex items-center gap-3">
                    <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleFileChange} />
                    <Button type="button" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? "Uploading..." : "Choose Image"}
                    </Button>
                    {form.imageUrl && (
                      <div className="flex items-center gap-2">
                        <img src={form.imageUrl} alt="Preview" className="w-12 h-12 object-cover rounded border" />
                        <span className="text-xs text-green-600 font-medium">Image ready</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label>YouTube Video URL</Label>
                <Input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/..." />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} id="featured" />
                <Label htmlFor="featured">Featured on homepage</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={saveMutation.isPending || uploading}
                onClick={() => saveMutation.mutate({ ...form, targetAmount: String(form.targetAmount) })}
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editItem ? "Update" : "Create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600"><AlertCircle className="w-5 h-5" /> Delete Campaign?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-500">This action cannot be undone. All associated data will be lost.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Adjust Raised Amount Dialog */}
        <Dialog open={!!amountDialog} onOpenChange={() => setAmountDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><IndianRupee className="w-5 h-5 text-green-600" /> Adjust Raised Amount</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-gray-500">Manually set the displayed raised amount for <strong>{amountDialog?.title}</strong>. This overrides the automatically calculated total.</p>
              <div>
                <Label>New Amount (₹)</Label>
                <Input
                  type="number"
                  value={amountValue}
                  onChange={e => setAmountValue(e.target.value)}
                  placeholder="e.g. 250000"
                  min={0}
                />
              </div>
              <div className="text-xs text-gray-400 flex gap-4">
                <span>Current: <strong>₹{Number(amountDialog?.currentAmount ?? 0).toLocaleString("en-IN")}</strong></span>
                <span>Target: <strong>₹{Number(amountDialog?.targetAmount ?? 0).toLocaleString("en-IN")}</strong></span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAmountDialog(null)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" disabled={savingAmount} onClick={handleAmountUpdate}>
                {savingAmount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Amount"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Campaign Update Dialog */}
        <Dialog open={!!updateDialog} onOpenChange={() => setUpdateDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Post Campaign Update</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Update Title</Label>
                <Input value={updateForm.title} onChange={e => setUpdateForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Milestone reached!" />
              </div>
              <div>
                <Label>Update Content</Label>
                <Textarea rows={4} value={updateForm.content} onChange={e => setUpdateForm(f => ({ ...f, content: e.target.value }))} placeholder="Share progress with donors..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateDialog(null)}>Cancel</Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={addUpdateMutation.isPending}
                onClick={() => addUpdateMutation.mutate({ campaignId: updateDialog, data: updateForm })}
              >
                {addUpdateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
