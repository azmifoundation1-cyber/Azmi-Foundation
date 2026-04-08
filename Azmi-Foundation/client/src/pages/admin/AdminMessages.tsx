import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, Mail, Phone, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ContactMessage } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  read: "bg-gray-100 text-gray-600",
  replied: "bg-green-100 text-green-700",
};

export default function AdminMessages() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewItem, setViewItem] = useState<ContactMessage | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const { data: messages, isLoading } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/messages"],
    queryFn: () => fetch("/api/admin/messages").then(r => r.json()),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, note }: { id: number; status: string; note?: string }) => {
      const res = await fetch(`/api/admin/messages/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Message status updated" });
      setViewItem(null);
      setAdminNote("");
    },
  });

  function openMessage(m: ContactMessage) {
    setViewItem(m);
    setAdminNote(m.adminNote || "");
    if (m.status === "new") {
      updateStatus.mutate({ id: m.id, status: "read" });
    }
  }

  const filtered = (messages || []).filter(m => statusFilter === "all" || m.status === statusFilter);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} messages · {(messages || []).filter(m => m.status === "new").length} new</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="w-4 h-4 mr-1 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No messages found</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => (
              <Card key={m.id} className={`hover:shadow-md transition-shadow cursor-pointer ${m.status === "new" ? "border-blue-200 bg-blue-50/30" : ""}`} onClick={() => openMessage(m)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${m.status === "new" ? "bg-blue-500" : "bg-gray-400"}`}>
                    {m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                      {m.status === "new" && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium mt-0.5">{m.subject}</p>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{m.message}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-400">{new Date(m.createdAt!).toLocaleDateString()}</p>
                    <div className="flex justify-end gap-2 mt-1">
                      {m.email && <a href={`mailto:${m.email}`} onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-blue-600"><Mail className="w-3.5 h-3.5" /></a>}
                      {m.phone && <a href={`tel:${m.phone}`} onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-green-600"><Phone className="w-3.5 h-3.5" /></a>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewItem?.subject}</DialogTitle>
            </DialogHeader>
            {viewItem && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                  <div className="flex gap-2"><span className="text-gray-400 w-16">From:</span><span className="font-medium">{viewItem.name}</span></div>
                  <div className="flex gap-2"><span className="text-gray-400 w-16">Email:</span><a href={`mailto:${viewItem.email}`} className="text-blue-600 hover:underline">{viewItem.email}</a></div>
                  {viewItem.phone && <div className="flex gap-2"><span className="text-gray-400 w-16">Phone:</span><a href={`tel:${viewItem.phone}`} className="text-blue-600">{viewItem.phone}</a></div>}
                  <div className="flex gap-2"><span className="text-gray-400 w-16">Date:</span><span>{new Date(viewItem.createdAt!).toLocaleString()}</span></div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Message</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white border rounded-lg p-3">{viewItem.message}</p>
                </div>
                <div>
                  <Label>Admin Note (internal)</Label>
                  <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add internal notes..." rows={2} />
                </div>
              </div>
            )}
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
              {viewItem?.email && (
                <Button variant="outline" className="gap-2" onClick={() => window.open(`mailto:${viewItem.email}?subject=Re: ${viewItem.subject}`)}>
                  <Mail className="w-4 h-4" /> Reply by Email
                </Button>
              )}
              {viewItem?.status !== "replied" && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus.mutate({ id: viewItem!.id, status: "replied", note: adminNote })}>
                  Mark as Replied
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
