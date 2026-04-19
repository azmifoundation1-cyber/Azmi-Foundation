import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Megaphone, Users, ClipboardList, MessageSquare, TrendingUp, Loader2, FileText, Phone, RefreshCw, BarChart2, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalDonations: number;
  totalAmount: number;
  activeCampaigns: number;
  totalUsers: number;
  pendingRegistrations: number;
  newMessages: number;
}

const CHART_PERIOD_OPTIONS = [7, 14, 30] as const;
const PIE_COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

export default function AdminDashboard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [chartDays, setChartDays] = useState<7 | 14 | 30>(30);
  const [syncing, setSyncing] = useState(false);

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => fetch("/api/admin/stats").then(r => r.json()),
  });

  const { data: recentDonations } = useQuery<any[]>({
    queryKey: ["/api/donations"],
    queryFn: () => fetch("/api/donations").then(r => r.json()),
    select: d => d.slice(0, 8),
  });

  const { data: trendData } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/donations"],
    queryFn: () => fetch("/api/admin/analytics/donations").then(r => r.json()),
  });

  const { data: campaigns } = useQuery<any[]>({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns").then(r => r.json()),
  });

  const { data: campaignStats } = useQuery<Record<number, { total: number; count: number }>>({
    queryKey: ["/api/admin/analytics/campaigns"],
    queryFn: () => fetch("/api/admin/analytics/campaigns").then(r => r.json()),
  });

  async function handleRazorpaySync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/razorpay/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      qc.invalidateQueries({ queryKey: ["/api/donations"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/analytics/donations"] });
      toast({ title: "Razorpay Sync Complete", description: data.message });
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    }
    setSyncing(false);
  }

  const chartSlice = trendData ? trendData.slice(-(chartDays)) : [];
  const chartMax = chartSlice.reduce((m, d) => Math.max(m, d.total), 0) || 1000;

  const pieData = (campaigns || [])
    .filter(c => campaignStats?.[c.id]?.total)
    .map(c => ({ name: c.title.slice(0, 28) + (c.title.length > 28 ? "…" : ""), value: campaignStats![c.id].total }))
    .slice(0, 6);

  const statCards = [
    { label: "Total Donations", value: stats?.totalDonations ?? 0, icon: Heart, color: "text-red-500", bg: "bg-red-50", href: "/admin/donations" },
    { label: "Amount Raised", value: `₹${(stats?.totalAmount ?? 0).toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", href: "/admin/donations" },
    { label: "Active Campaigns", value: stats?.activeCampaigns ?? 0, icon: Megaphone, color: "text-blue-500", bg: "bg-blue-50", href: "/admin/campaigns" },
    { label: "Registered Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-purple-500", bg: "bg-purple-50", href: "/admin/users" },
    { label: "Pending Applications", value: stats?.pendingRegistrations ?? 0, icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-50", href: "/admin/registrations" },
    { label: "New Messages", value: stats?.newMessages ?? 0, icon: MessageSquare, color: "text-yellow-600", bg: "bg-yellow-50", href: "/admin/messages" },
  ];

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Overview of Azmi Foundation's activity</p>
          </div>
          <Button variant="outline" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50" onClick={handleRazorpaySync} disabled={syncing}>
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncing ? "Syncing…" : "Sync Razorpay"}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
            <Link key={label} href={href}>
              <a>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                      <p className="text-sm text-gray-500">{label}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donation Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-green-600" /> Donation Trend
              </CardTitle>
              <div className="flex gap-1">
                {CHART_PERIOD_OPTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setChartDays(d)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${chartDays === d ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {chartSlice.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartSlice} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={Math.floor(chartSlice.length / 6)} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                      formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Raised"]}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2} fill="url(#greenGrad)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Campaign Breakdown Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-500" /> By Campaign
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No donations yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, marginTop: 4 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Campaign Quick Stats */}
        {campaigns && campaigns.length > 0 && campaignStats && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-500" /> Campaign Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.map(c => {
                  const raised = campaignStats[c.id]?.total ?? Number(c.currentAmount);
                  const goal = Number(c.targetAmount);
                  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
                  const donorCount = campaignStats[c.id]?.count ?? 0;
                  const statusColors: Record<string, string> = { active: "bg-green-100 text-green-700", paused: "bg-yellow-100 text-yellow-700", completed: "bg-blue-100 text-blue-700", hidden: "bg-gray-100 text-gray-500" };
                  return (
                    <div key={c.id} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate flex-1">{c.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${statusColors[c.status] || "bg-gray-100 text-gray-500"}`}>{c.status}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 w-40">
                        <p className="text-sm font-bold text-gray-900">₹{raised.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-gray-400">{pct}% of ₹{goal.toLocaleString("en-IN")} · {donorCount} donors</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Donations */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" /> Recent Donations
            </CardTitle>
            <Link href="/admin/donations">
              <a className="text-xs text-green-600 hover:text-green-700 font-medium">View all →</a>
            </Link>
          </CardHeader>
          <CardContent>
            {!recentDonations || recentDonations.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No donations yet</p>
            ) : (
              <div className="space-y-0">
                {recentDonations.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${d.taxReceiptRequested ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        {d.isAnonymous ? "A" : (d.donorName?.[0] || "?")}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{d.isAnonymous ? "Anonymous" : d.donorName}</p>
                          {d.taxReceiptRequested && (
                            <span className="flex-shrink-0 text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <FileText className="w-2.5 h-2.5" /> 80G
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400">
                            {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                          {d.donorPhone && (
                            <p className="text-xs text-gray-400 flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" /> {d.donorPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-700">₹{Number(d.amount).toLocaleString("en-IN")}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === "completed" ? "bg-green-100 text-green-700" : d.status === "failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
