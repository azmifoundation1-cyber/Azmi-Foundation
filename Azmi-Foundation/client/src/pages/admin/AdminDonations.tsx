import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Download, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Donation } from "@shared/schema";

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

  const campaignMap = Object.fromEntries((campaigns || []).map((c: any) => [c.id, c.title]));

  const filtered = (donations || []).filter(d => {
    const matchSearch = !search || d.donorName.toLowerCase().includes(search.toLowerCase()) || d.donorEmail?.toLowerCase().includes(search.toLowerCase()) || d.paymentId?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.filter(d => d.status === "completed").reduce((s, d) => s + Number(d.amount), 0);

  function exportCSV() {
    const rows = [["ID", "Donor", "Email", "Phone", "Amount", "Status", "Method", "Campaign", "Date", "PaymentID"]];
    filtered.forEach(d => rows.push([
      String(d.id), d.donorName, d.donorEmail || "", d.donorPhone || "",
      String(d.amount), d.status, d.paymentMethod || "", campaignMap[d.campaignId!] || "General",
      new Date(d.createdAt!).toLocaleDateString(), d.paymentId || "",
    ]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv); a.download = "donations.csv"; a.click();
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} records · ₹{totalAmount.toLocaleString()} confirmed</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donor, email, payment ID..." className="pl-9" />
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
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
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
                      <tr><td colSpan={7} className="text-center py-10 text-gray-400">No donations found</td></tr>
                    ) : filtered.map(d => (
                      <tr key={d.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{d.isAnonymous ? "Anonymous" : d.donorName}</p>
                            <p className="text-xs text-gray-400">{d.donorEmail}</p>
                            {d.donorPhone && <p className="text-xs text-gray-400">{d.donorPhone}</p>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">₹{Number(d.amount).toLocaleString()}</p>
                          {d.taxReceiptRequested && <span className="text-xs text-blue-600">80G receipt</span>}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 max-w-xs">
                          {d.campaignId ? (campaignMap[d.campaignId] || `Campaign #${d.campaignId}`) : "General"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-gray-600 capitalize">{d.paymentMethod || "—"}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[d.status]}`}>{d.status}</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {new Date(d.createdAt!).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {d.status === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus.mutate({ id: d.id, status: "completed" })}>Confirm</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => updateStatus.mutate({ id: d.id, status: "failed" })}>Fail</Button>
                            </div>
                          )}
                          {d.status === "completed" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: d.id, status: "refunded" })}>Refund</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
