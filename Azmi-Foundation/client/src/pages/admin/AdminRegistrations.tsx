import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Registration } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const TYPE_COLORS: Record<string, string> = {
  member: "bg-purple-100 text-purple-700",
  volunteer: "bg-blue-100 text-blue-700",
  intern: "bg-cyan-100 text-cyan-700",
};

export default function AdminRegistrations() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewItem, setViewItem] = useState<Registration | null>(null);
  const [actionItem, setActionItem] = useState<{ id: number; action: "approved" | "rejected" } | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const { data: registrations, isLoading } = useQuery<Registration[]>({
    queryKey: ["/api/registrations"],
    queryFn: () => fetch("/api/registrations").then(r => r.json()),
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users").then(r => r.json()),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, note }: { id: number; status: string; note?: string }) => {
      const res = await fetch(`/api/admin/registrations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/registrations"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setActionItem(null);
      setAdminNote("");
      toast({ title: "Registration status updated" });
    },
  });

  const userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u]));

  const filtered = (registrations || []).filter(r => {
    const user = userMap[r.userId];
    const name = `${user?.firstName || ""} ${user?.lastName || ""} ${user?.email || ""}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} applications · {(registrations || []).filter(r => r.status === "pending").length} pending review</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="volunteer">Volunteer</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No registrations found</div>
            ) : filtered.map(r => {
              const user = userMap[r.userId];
              const details = r.details as any || {};
              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold flex-shrink-0 overflow-hidden">
                      {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" /> : (user?.firstName?.[0] || "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{user?.firstName} {user?.lastName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[r.type]}`}>{r.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">{user?.email} · {details.phone}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{details.motivation}</p>
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(r.createdAt!).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setViewItem(r)}>
                        <Eye className="w-3 h-3" /> View
                      </Button>
                      {r.status === "pending" && (
                        <>
                          <Button size="sm" className="h-8 gap-1 bg-green-600 hover:bg-green-700" onClick={() => setActionItem({ id: r.id, action: "approved" })}>
                            <CheckCircle className="w-3 h-3" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-red-600 hover:bg-red-50" onClick={() => setActionItem({ id: r.id, action: "rejected" })}>
                            <XCircle className="w-3 h-3" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            {viewItem && (() => {
              const user = userMap[viewItem.userId];
              const details = viewItem.details as any || {};
              return (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" /> : null}
                    </div>
                    <div>
                      <p className="font-bold">{user?.firstName} {user?.lastName}</p>
                      <p className="text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[["Type", viewItem.type], ["Status", viewItem.status], ["Phone", details.phone], ["Education", details.education], ["Occupation", details.occupation], ["Experience", details.experience]].map(([k, v]) => v ? (
                      <div key={k}><p className="text-gray-400 text-xs">{k}</p><p className="font-medium capitalize">{v}</p></div>
                    ) : null)}
                  </div>
                  {details.address && <div><p className="text-gray-400 text-xs">Address</p><p>{details.address}</p></div>}
                  {details.skills && <div><p className="text-gray-400 text-xs">Skills</p><p>{details.skills}</p></div>}
                  {details.availability && <div><p className="text-gray-400 text-xs">Availability</p><p>{details.availability}</p></div>}
                  {details.motivation && <div><p className="text-gray-400 text-xs">Motivation</p><p>{details.motivation}</p></div>}
                  {viewItem.adminNote && <div className="p-3 bg-yellow-50 rounded-lg"><p className="text-gray-400 text-xs">Admin Note</p><p>{viewItem.adminNote}</p></div>}
                </div>
              );
            })()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Confirmation Dialog */}
        <Dialog open={!!actionItem} onOpenChange={() => setActionItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className={actionItem?.action === "approved" ? "text-green-700" : "text-red-600"}>
                {actionItem?.action === "approved" ? "Approve Application?" : "Reject Application?"}
              </DialogTitle>
            </DialogHeader>
            <div>
              <Label>Admin Note (optional)</Label>
              <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add a note to the applicant..." rows={3} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionItem(null)}>Cancel</Button>
              <Button
                className={actionItem?.action === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                onClick={() => updateStatus.mutate({ id: actionItem!.id, status: actionItem!.action, note: adminNote })}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : actionItem?.action === "approved" ? "Approve" : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
