import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Loader2, Eye, Phone, Filter, FileText, FileImage,
  Home, Building2, Heart, User, MapPin, Users, Trash2,
  CheckCircle2, Clock, AlertCircle, XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { FundraisingApplication } from "@shared/schema";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-700 border-blue-200", icon: AlertCircle },
  under_review: { label: "Under Review", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function formatAmount(n: string | number) {
  const num = Number(n);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
}

export default function AdminApplications() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = (user as any)?.role === "super_admin";

  const [statusFilter, setStatusFilter] = useState("all");
  const [viewItem, setViewItem] = useState<FundraisingApplication | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: applications, isLoading } = useQuery<FundraisingApplication[]>({
    queryKey: ["/api/admin/applications"],
    queryFn: () => fetch("/api/admin/applications").then(r => r.json()),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, note }: { id: number; status: string; note?: string }) => {
      const res = await fetch(`/api/admin/applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({ title: "Application updated successfully" });
      setViewItem(null);
    },
  });

  const deleteApp = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/applications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({ title: "Application deleted" });
      setViewItem(null);
    },
  });

  function openItem(item: FundraisingApplication) {
    setViewItem(item);
    setAdminNote(item.adminNote || "");
    setNewStatus(item.status);
    if (item.status === "new") {
      updateStatus.mutate({ id: item.id, status: "under_review", note: item.adminNote || "" });
    }
  }

  const filtered = (applications || []).filter(a =>
    statusFilter === "all" || a.status === statusFilter
  );

  const counts = {
    new: (applications || []).filter(a => a.status === "new").length,
    under_review: (applications || []).filter(a => a.status === "under_review").length,
    approved: (applications || []).filter(a => a.status === "approved").length,
    rejected: (applications || []).filter(a => a.status === "rejected").length,
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fundraising Applications</h1>
            <p className="text-sm text-gray-500 mt-1">
              {(applications || []).length} total · {counts.new} new · {counts.under_review} under review
            </p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <Filter className="w-4 h-4 mr-1 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({(applications || []).length})</SelectItem>
              <SelectItem value="new">New ({counts.new})</SelectItem>
              <SelectItem value="under_review">Under Review ({counts.under_review})</SelectItem>
              <SelectItem value="approved">Approved ({counts.approved})</SelectItem>
              <SelectItem value="rejected">Rejected ({counts.rejected})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
                className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm ${statusFilter === key ? "ring-2 ring-primary" : ""} ${cfg.color}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-2xl font-bold">{counts[key as keyof typeof counts]}</span>
                </div>
                <p className="text-xs font-medium mt-1">{cfg.label}</p>
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No applications found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => (
              <Card
                key={app.id}
                className={`hover:shadow-md transition-all cursor-pointer ${app.status === "new" ? "border-blue-200 bg-blue-50/30" : ""}`}
                onClick={() => openItem(app)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 text-lg
                      ${app.status === "new" ? "bg-blue-500" : app.status === "approved" ? "bg-green-500" : app.status === "rejected" ? "bg-red-400" : "bg-yellow-500"}`}>
                      {app.patientName[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-gray-900 text-sm">{app.patientName}</p>
                        {app.status === "new" && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{app.problemDescription}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{app.campaignerName} ({app.campaignerRelation})</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.city} — {app.pincode}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.contactNumber}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{app.familyMembers} members</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right space-y-1">
                      <p className="text-sm font-bold text-primary">{formatAmount(app.amountNeeded)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(app.createdAt!).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(app.createdAt!).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <div className="flex gap-1 justify-end mt-1">
                        {app.medicalFileUrl && <span title="Has medical file"><FileImage className="w-3.5 h-3.5 text-purple-400" /></span>}
                        {app.idProofUrl && <span title="Has ID proof"><FileText className="w-3.5 h-3.5 text-blue-400" /></span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Application #{viewItem?.id} — {viewItem?.patientName}
            </DialogTitle>
          </DialogHeader>

          {viewItem && (
            <div className="space-y-5">
              {/* Status & Meta */}
              <div className="flex items-center justify-between">
                <StatusBadge status={viewItem.status} />
                <div className="text-right text-xs text-gray-400">
                  <p>Submitted: {new Date(viewItem.createdAt!).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  {viewItem.reviewedBy && <p>Reviewed by: {viewItem.reviewedBy}</p>}
                  {viewItem.reviewedAt && <p>at: {new Date(viewItem.reviewedAt).toLocaleString("en-IN")}</p>}
                </div>
              </div>

              {/* Two-column info grid */}
              <div className="grid grid-cols-2 gap-4">
                <InfoCard icon={User} label="Campaigner" value={viewItem.campaignerName} sub={`Relation: ${viewItem.campaignerRelation}`} />
                <InfoCard icon={Heart} label="Patient" value={viewItem.patientName} sub="" />
                <InfoCard icon={Phone} label="Contact" value={viewItem.contactNumber} sub="" link={`tel:${viewItem.contactNumber}`} />
                <InfoCard icon={MapPin} label="Location" value={`${viewItem.city}, ${viewItem.pincode}`} sub="" />
                <InfoCard icon={Users} label="Family Size" value={`${viewItem.familyMembers} members`} sub="" />
                <InfoCard
                  icon={Home}
                  label="Living Situation"
                  value={viewItem.houseType === "own" ? "Own House" : "Rented"}
                  sub={`Patient: ${viewItem.patientLocation === "home" ? "At Home" : "In Hospital"}`}
                />
              </div>

              {/* Amount */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount Requested</p>
                <p className="text-3xl font-bold text-primary">{formatAmount(viewItem.amountNeeded)}</p>
                <p className="text-sm text-gray-500">₹{Number(viewItem.amountNeeded).toLocaleString("en-IN")}</p>
              </div>

              {/* Problem description */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Problem / Disease / Cause</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-4 leading-relaxed whitespace-pre-wrap border">{viewItem.problemDescription}</p>
              </div>

              {/* Documents */}
              {(viewItem.medicalFileUrl || viewItem.idProofUrl) && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Uploaded Documents</p>
                  <div className="flex gap-3 flex-wrap">
                    {viewItem.medicalFileUrl && (
                      <a
                        href={viewItem.medicalFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 text-sm hover:bg-purple-100 transition-colors"
                      >
                        <FileImage className="w-4 h-4" />
                        Medical File
                      </a>
                    )}
                    {viewItem.idProofUrl && (
                      <a
                        href={viewItem.idProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm hover:bg-blue-100 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        ID Proof
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Admin controls */}
              <div className="space-y-3 border-t pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Update Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Quick Contact</Label>
                    <a href={`tel:${viewItem.contactNumber}`} className="block">
                      <Button variant="outline" type="button" className="w-full gap-2">
                        <Phone className="w-4 h-4" /> Call Campaigner
                      </Button>
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Admin Note (internal)</Label>
                  <Textarea
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    rows={3}
                    placeholder="Internal notes about this application..."
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            {isSuperAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this application permanently?")) {
                    deleteApp.mutate(viewItem!.id);
                  }
                }}
                disabled={deleteApp.isPending}
                className="gap-1.5 mr-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
            <Button
              className="bg-primary hover:bg-primary/90 gap-2"
              onClick={() => updateStatus.mutate({ id: viewItem!.id, status: newStatus, note: adminNote })}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function InfoCard({ icon: Icon, label, value, sub, link }: { icon: any; label: string; value: string; sub: string; link?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border">
      <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </p>
      {link ? (
        <a href={link} className="font-semibold text-sm text-blue-600 hover:underline">{value}</a>
      ) : (
        <p className="font-semibold text-sm text-gray-900">{value}</p>
      )}
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}
