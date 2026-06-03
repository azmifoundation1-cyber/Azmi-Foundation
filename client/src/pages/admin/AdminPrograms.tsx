import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Program } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-yellow-100 text-yellow-700",
  ongoing: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
};

const emptyForm = { title: "", description: "", imageUrl: "", category: "general", location: "", status: "upcoming" as const, date: "" };

export default function AdminPrograms() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Program | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
    queryFn: () => fetch("/api/programs").then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editItem ? `/api/admin/programs/${editItem.id}` : "/api/programs";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({ title: editItem ? "Program updated" : "Program created" });
      setDialogOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/admin/programs/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/programs"] }); setDeleteId(null); toast({ title: "Program deleted" }); },
  });

  function openCreate() { setEditItem(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(p: Program) {
    setEditItem(p);
    setForm({ title: p.title, description: p.description, imageUrl: p.imageUrl || "", category: p.category || "general", location: p.location || "", status: p.status as any, date: p.date ? new Date(p.date).toISOString().slice(0, 10) : "" });
    setDialogOpen(true);
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
            <p className="text-sm text-gray-500 mt-1">{programs?.length || 0} programs</p>
          </div>
          <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700 gap-2">
            <Plus className="w-4 h-4" /> New Program
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {programs?.map(p => (
              <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  {p.imageUrl && <img src={p.imageUrl} alt={p.title} className="w-full h-40 object-cover" />}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{p.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        {p.category && <span className="capitalize mr-2 bg-gray-100 px-2 py-0.5 rounded">{p.category}</span>}
                        {p.date && new Date(p.date).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => openEdit(p)}>
                          <Pencil className="w-3 h-3" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleteId(p.id)}>
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Program" : "New Program"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Program title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="health, education..." />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Program description..." />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, State" />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate({ ...form, date: form.date ? new Date(form.date) : null })}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editItem ? "Update" : "Create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600"><AlertCircle className="w-5 h-5" /> Delete Program?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-500">This will permanently remove this program.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
