import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Search, Download, Filter, ChevronDown, ChevronRight, FileText, Phone, MapPin, CreditCard, BadgeCheck, Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Donation } from "@shared/schema";
import { generate80GReceipt } from "@/lib/generate-80g-receipt";

const EMPTY_FORM = {
  donorName: "", donorEmail: "", donorPhone: "", amount: "",
  campaignId: "", paymentMethod: "upi", paymentId: "", message: "",
  isAnonymous: false, taxReceiptRequested: false,
  donorPan: "", donorAddress: "", donorCity: "", donorState: "", donorPincode: "",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

export default function AdminDonations() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [receiptFilter, setReceiptFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { data: donations, isLoading } = useQuery<Donation[]>({
    queryKey: ["/api/donations"],
    queryFn: () => fetch("/api/donations").then(r => r.json()),
  });

  const { data: campaigns } = useQuery<any[]>({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns").then(r => r.json()),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/donations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/donations"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Donation status updated" });
    },
  });

  async function handleRazorpaySync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/razorpay/sync", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Sync failed");
      }
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/donations"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/public/stats"] });
      toast({
        title: `Razorpay Sync Complete`,
        description: data.message,
      });
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    }
    setSyncing(false);
  }

  async function handleRecordDonation() {
    if (!form.donorName.trim() || !form.amount || Number(form.amount) < 1) {
      toast({ title: "Please fill in donor name and amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          campaignId: form.campaignId ? Number(form.campaignId) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to record donation");
      }
      const donation = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/donations"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/public/stats"] });
      toast({ title: "Donation recorded", description: `₹${form.amount} from ${form.donorName} added successfully.` });
      setShowDialog(false);
      setForm({ ...EMPTY_FORM });
      if (form.taxReceiptRequested && form.donorPan) {
        const campaignMap2 = Object.fromEntries((campaigns || []).map((c: any) => [String(c.id), c.title]));
        const receiptNo = `AF-${new Date().getFullYear()}-${String(donation.id).padStart(5, "0")}`;
        await generate80GReceipt({
          receiptNo,
          paymentId: donation.paymentId || "N/A",
          donationDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
          donorName: form.donorName,
          donorPan: form.donorPan,
          donorPhone: form.donorPhone,
          donorEmail: form.donorEmail,
          donorAddress: form.donorAddress,
          donorCity: form.donorCity,
          donorState: form.donorState,
          donorPincode: form.donorPincode,
          amount: Number(form.amount),
          campaignTitle: campaignMap2[form.campaignId] || "General Donation",
          paymentMethod: form.paymentMethod,
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  }

  const campaignMap = Object.fromEntries((campaigns || []).map((c: any) => [c.id, c.title]));

  const filtered = (donations || []).filter(d => {
    const matchSearch = !search ||
      d.donorName.toLowerCase().includes(search.toLowerCase()) ||
      d.donorEmail?.toLowerCase().includes(search.toLowerCase()) ||
      d.paymentId?.toLowerCase().includes(search.toLowerCase()) ||
      (d as any).donorPan?.toLowerCase().includes(search.toLowerCase()) ||
      (d as any).donorPhone?.includes(search);
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const matchReceipt = receiptFilter === "all" ||
      (receiptFilter === "80g" && d.taxReceiptRequested) ||
      (receiptFilter === "no80g" && !d.taxReceiptRequested);
    const matchCampaign = campaignFilter === "all" ||
      (campaignFilter === "general" ? !d.campaignId : String(d.campaignId) === campaignFilter);
    const donationDate = new Date(d.createdAt!);
    const matchFrom = !dateFrom || donationDate >= new Date(dateFrom);
    const matchTo = !dateTo || donationDate <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchStatus && matchReceipt && matchCampaign && matchFrom && matchTo;
  });

  const totalAmount = filtered.filter(d => d.status === "completed").reduce((s, d) => s + Number(d.amount), 0);
  const total80G = (donations || []).filter(d => d.taxReceiptRequested && d.status === "completed").length;

  function exportCSV() {
    const rows = [["ID", "Donor", "Email", "Phone", "PAN", "Address", "City", "State", "PIN", "Amount", "Status", "Method", "Campaign", "80G Receipt", "Date", "PaymentID"]];
    filtered.forEach(d => rows.push([
      String(d.id),
      d.donorName,
      d.donorEmail || "",
      d.donorPhone || "",
      (d as any).donorPan || "",
      (d as any).donorAddress || "",
      (d as any).donorCity || "",
      (d as any).donorState || "",
      (d as any).donorPincode || "",
      String(d.amount),
      d.status,
      d.paymentMethod || "",
      campaignMap[d.campaignId!] || "General",
      d.taxReceiptRequested ? "Yes" : "No",
      new Date(d.createdAt!).toLocaleDateString(),
      d.paymentId || "",
    ]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = `donations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  async function handleReissueReceipt(d: any) {
    if (!d.donorPan) {
      toast({ title: "Cannot re-issue receipt", description: "No 80G details on record for this donation.", variant: "destructive" });
      return;
    }
    setGeneratingPdf(d.id);
    try {
      const receiptNo = `AF-${new Date(d.createdAt).getFullYear()}-${String(d.id).padStart(5, "0")}`;
      await generate80GReceipt({
        receiptNo,
        paymentId: d.paymentId || "N/A",
        donationDate: new Date(d.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
        donorName: d.donorName,
        donorPan: d.donorPan,
        donorPhone: d.donorPhone || "",
        donorEmail: d.donorEmail || "",
        donorAddress: d.donorAddress || "",
        donorCity: d.donorCity || "",
        donorState: d.donorState || "",
        donorPincode: d.donorPincode || "",
        amount: Number(d.amount),
        campaignTitle: campaignMap[d.campaignId] || "General Donation",
        paymentMethod: d.paymentMethod || "Razorpay",
      });
      toast({ title: "80G Receipt re-issued", description: `Receipt downloaded for ${d.donorName}` });
    } catch {
      toast({ title: "PDF generation failed", variant: "destructive" });
    }
    setGeneratingPdf(null);
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filtered.length} records · ₹{totalAmount.toLocaleString()} confirmed
              {total80G > 0 && <span className="ml-3 text-amber-600 font-semibold">· {total80G} with 80G receipt</span>}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={handleRazorpaySync}
              disabled={syncing}
              title="Fetch all captured payments from Razorpay and store in database"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? "Syncing..." : "Sync Razorpay"}
            </Button>
            <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => { setForm({ ...EMPTY_FORM }); setShowDialog(true); }}>
              <Plus className="w-4 h-4" /> Record Donation
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportCSV}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filters Row 1 */}
        <div className="flex flex-wrap gap-3 mb-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search donor, email, PAN, payment ID..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="w-4 h-4 mr-1 text-gray-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={receiptFilter} onValueChange={setReceiptFilter}>
            <SelectTrigger className="w-40">
              <FileText className="w-4 h-4 mr-1 text-amber-500" />
              <SelectValue placeholder="80G Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Donations</SelectItem>
              <SelectItem value="80g">80G Requested</SelectItem>
              <SelectItem value="no80g">No 80G</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Filters Row 2 — date range + campaign */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="general">General (no campaign)</SelectItem>
              {(campaigns || []).map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.title.slice(0, 36)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>From</span>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 h-9" />
            <span>to</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 h-9" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-red-500 hover:underline">Clear</button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                      <th className="w-8 py-3 px-3"></th>
                      <th className="text-left py-3 px-4">Donor</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Campaign</th>
                      <th className="text-left py-3 px-4">Method</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-gray-400">No donations found</td>
                      </tr>
                    ) : filtered.map(d => {
                      const isExpanded = expandedId === d.id;
                      const has80G = d.taxReceiptRequested && (d as any).donorPan;
                      return (
                        <Fragment key={d.id}>
                          {/* Main row */}
                          <tr
                            key={d.id}
                            className={`border-b hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? "bg-amber-50/30" : ""}`}
                            onClick={() => setExpandedId(isExpanded ? null : d.id)}
                          >
                            <td className="py-3 px-3 text-gray-400">
                              {isExpanded
                                ? <ChevronDown className="w-4 h-4" />
                                : <ChevronRight className="w-4 h-4" />}
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">{d.isAnonymous ? "Anonymous" : d.donorName}</p>
                                <p className="text-xs text-gray-400">{d.donorEmail}</p>
                                {d.donorPhone && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" /> {d.donorPhone}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-gray-900">₹{Number(d.amount).toLocaleString()}</p>
                              {d.taxReceiptRequested && (
                                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-0.5 mt-0.5 ${has80G ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"}`}>
                                  <FileText className="w-2.5 h-2.5" />
                                  {has80G ? "80G ✓" : "80G pending"}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-600 max-w-[160px] truncate">
                              {d.campaignId ? (campaignMap[d.campaignId] || `Campaign #${d.campaignId}`) : "General"}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs text-gray-600 capitalize">{d.paymentMethod || "—"}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[d.status]}`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-500">
                              {new Date(d.createdAt!).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                              <div className="flex flex-col gap-1">
                                {d.status === "pending" && (
                                  <div className="flex gap-1">
                                    <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus.mutate({ id: d.id, status: "completed" })}>Confirm</Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => updateStatus.mutate({ id: d.id, status: "failed" })}>Fail</Button>
                                  </div>
                                )}
                                {d.status === "completed" && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: d.id, status: "refunded" })}>Refund</Button>
                                )}
                                {has80G && (
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                                    disabled={generatingPdf === d.id}
                                    onClick={() => handleReissueReceipt(d)}
                                  >
                                    {generatingPdf === d.id
                                      ? <Loader2 className="w-3 h-3 animate-spin" />
                                      : <><FileText className="w-3 h-3 mr-1" />80G PDF</>
                                    }
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded details row */}
                          {isExpanded && (
                            <tr className="border-b bg-amber-50/20">
                              <td colSpan={8} className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                                  {/* Payment Details */}
                                  <div className="bg-white border border-gray-100 rounded p-3 space-y-2">
                                    <p className="font-black text-gray-500 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                      <CreditCard className="w-3 h-3" /> Payment Details
                                    </p>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Donation ID</span>
                                        <span className="font-semibold">#{d.id}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Payment ID</span>
                                        <span className="font-mono text-xs text-gray-700 truncate ml-2 max-w-[140px]">{d.paymentId || "—"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Method</span>
                                        <span className="font-semibold capitalize">{d.paymentMethod || "—"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Anonymous</span>
                                        <span className="font-semibold">{d.isAnonymous ? "Yes" : "No"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Contact Details */}
                                  <div className="bg-white border border-gray-100 rounded p-3 space-y-2">
                                    <p className="font-black text-gray-500 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                      <Phone className="w-3 h-3" /> Contact Details
                                    </p>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Name</span>
                                        <span className="font-semibold">{d.isAnonymous ? "Anonymous" : d.donorName}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Email</span>
                                        <span className="font-semibold truncate ml-2 max-w-[140px]">{d.donorEmail || "—"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Phone</span>
                                        <span className="font-semibold">{d.donorPhone || "—"}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 80G Details */}
                                  <div className={`border rounded p-3 space-y-2 ${has80G ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
                                    <p className={`font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5 ${has80G ? "text-amber-700" : "text-gray-500"}`}>
                                      <BadgeCheck className="w-3 h-3" /> 80G Tax Receipt
                                    </p>
                                    {d.taxReceiptRequested ? (
                                      <div className="space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">PAN</span>
                                          <span className="font-mono font-bold text-amber-800">{(d as any).donorPan || "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Address</span>
                                          <span className="font-semibold text-right ml-2 max-w-[150px] break-words">{(d as any).donorAddress || "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">City / State</span>
                                          <span className="font-semibold">{(d as any).donorCity || "—"} / {(d as any).donorState || "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">PIN Code</span>
                                          <span className="font-semibold">{(d as any).donorPincode || "—"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-400">Receipt No.</span>
                                          <span className="font-mono font-bold text-amber-700">
                                            AF-{new Date(d.createdAt!).getFullYear()}-{String(d.id).padStart(5, "0")}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-gray-400 text-xs">No 80G receipt requested</p>
                                    )}
                                  </div>
                                </div>

                                {/* Address full row if long */}
                                {(d as any).donorAddress && (
                                  <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                                    <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-gray-400" />
                                    <span>
                                      {(d as any).donorAddress}, {(d as any).donorCity} – {(d as any).donorPincode}, {(d as any).donorState}, India
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Record Manual Donation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Record Offline Donation</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Record a donation received via UPI, bank transfer, cash, or cheque.</p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-2">
            {/* Donor Name */}
            <div className="col-span-2 sm:col-span-1">
              <Label>Donor Name <span className="text-red-500">*</span></Label>
              <Input value={form.donorName} onChange={e => setForm(f => ({ ...f, donorName: e.target.value }))} placeholder="Full name" className="mt-1" />
            </div>
            {/* Amount */}
            <div className="col-span-2 sm:col-span-1">
              <Label>Amount (₹) <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 5000" className="mt-1" />
            </div>
            {/* Email */}
            <div className="col-span-2 sm:col-span-1">
              <Label>Email Address</Label>
              <Input type="email" value={form.donorEmail} onChange={e => setForm(f => ({ ...f, donorEmail: e.target.value }))} placeholder="donor@example.com" className="mt-1" />
            </div>
            {/* Phone */}
            <div className="col-span-2 sm:col-span-1">
              <Label>Phone Number</Label>
              <Input value={form.donorPhone} onChange={e => setForm(f => ({ ...f, donorPhone: e.target.value }))} placeholder="10-digit mobile" className="mt-1" />
            </div>
            {/* Campaign */}
            <div className="col-span-2 sm:col-span-1">
              <Label>Campaign (optional)</Label>
              <Select value={form.campaignId} onValueChange={v => setForm(f => ({ ...f, campaignId: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="General Fund" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General Fund</SelectItem>
                  {(campaigns || []).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Payment Method */}
            <div className="col-span-2 sm:col-span-1">
              <Label>Payment Method</Label>
              <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer / NEFT / RTGS</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="razorpay">Razorpay (manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Payment Ref / UTR */}
            <div className="col-span-2">
              <Label>Payment Reference / UTR Number</Label>
              <Input value={form.paymentId} onChange={e => setForm(f => ({ ...f, paymentId: e.target.value }))} placeholder="UTR / Transaction ID / Cheque number (optional)" className="mt-1" />
            </div>
            {/* Message */}
            <div className="col-span-2">
              <Label>Message / Note</Label>
              <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Donor's message or internal note..." className="mt-1" rows={2} />
            </div>

            {/* Checkboxes */}
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))} />
                Anonymous donation
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.taxReceiptRequested} onChange={e => setForm(f => ({ ...f, taxReceiptRequested: e.target.checked }))} />
                80G Tax Receipt required
              </label>
            </div>

            {/* 80G fields — shown only if receipt requested */}
            {form.taxReceiptRequested && (
              <>
                <div className="col-span-2">
                  <div className="border-t pt-3 mb-2">
                    <p className="text-sm font-semibold text-amber-700">80G Receipt Details</p>
                    <p className="text-xs text-gray-500">Required to issue a valid 80G income tax receipt.</p>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>PAN Card Number</Label>
                  <Input value={form.donorPan} onChange={e => setForm(f => ({ ...f, donorPan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" maxLength={10} className="mt-1 font-mono" />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={form.donorAddress} onChange={e => setForm(f => ({ ...f, donorAddress: e.target.value }))} placeholder="House No., Street, Area" className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>City</Label>
                  <Input value={form.donorCity} onChange={e => setForm(f => ({ ...f, donorCity: e.target.value }))} placeholder="City" className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>State</Label>
                  <Input value={form.donorState} onChange={e => setForm(f => ({ ...f, donorState: e.target.value }))} placeholder="State" className="mt-1" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>PIN Code</Label>
                  <Input value={form.donorPincode} onChange={e => setForm(f => ({ ...f, donorPincode: e.target.value }))} placeholder="6-digit PIN" maxLength={6} className="mt-1" />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleRecordDonation} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {submitting ? "Recording..." : "Record Donation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
