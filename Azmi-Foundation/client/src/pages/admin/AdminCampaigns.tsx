import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Star, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Campaign } from "@shared/schema";

const emptyForm = {
  title: "", description: "", story: "", category: "other" as const,
  targetAmount: "", imageUrl: "", videoUrl: "", status: "active" as const, featured: false,
};

export default function AdminCampaigns() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Campaign | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [updateDialog, setUpdateDialog] = useState<number | null>(null);
  const [updateForm, setUpdateForm] = useState({ title: "", content: "" });

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns").then(r => r.json()),
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

  const addUpdateMutation = useMutation({
    mutationFn: async ({ campaignId, data }: any) => {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/updates`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setUpdateDialog(null);
      setUpdateForm({ title: "", content: "" });
      toast({ title: "Update posted" });
    },
  });

  function openCreate() { setEditItem(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(c: Campaign) {
    setEditItem(c);
    setForm({ title: c.title, description: c.description, story: c.story || "", category: c.category as any, targetAmount: c.targetAmount, imageUrl: c.imageUrl || "", videoUrl: c.videoUrl || "", status: c.status as any, featured: c.featured || false });
    setDialogOpen(true);
  }

  const statusColor: Record<string, string> = { active: "bg-green-100 text-green-700", completed: "bg-blue-100 text-blue-700", paused: "bg-gray-100 text-gray-600" };

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
          <div className="space-y-4">
            {campaigns?.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-0 flex">
                  {c.imageUrl && (
                    <img src={c.imageUrl} alt={c.title} className="w-32 h-28 object-cover flex-shrink-0" />
                  )}
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
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-gray-500">
                        <span className="font-bold text-gray-800">₹{Number(c.currentAmount).toLocaleString()}</span>
                        <span className="mx-1">of</span>
                        <span>₹{Number(c.targetAmount).toLocaleString()}</span>
                        <span className="ml-2 text-green-600 font-medium">
                          {Math.min(100, Math.round((Number(c.currentAmount) / Number(c.targetAmount)) * 100))}%
                        </span>
                      </div>
                      <div className="flex gap-2">
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
              <div>
                <Label>Image URL</Label>
                <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
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
                disabled={saveMutation.isPending}
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
