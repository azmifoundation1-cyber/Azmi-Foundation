import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Megaphone, Users, ClipboardList, MessageSquare, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "wouter";

interface AdminStats {
  totalDonations: number;
  totalAmount: number;
  activeCampaigns: number;
  totalUsers: number;
  pendingRegistrations: number;
  newMessages: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Not admin");
      return res.json();
    },
  });

  const { data: recentDonations } = useQuery({
    queryKey: ["/api/donations"],
    queryFn: async () => {
      const res = await fetch("/api/donations");
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { label: "Total Donations", value: stats?.totalDonations ?? 0, icon: Heart, color: "text-red-500", bg: "bg-red-50", href: "/admin/donations" },
    { label: "Amount Raised", value: `₹${(stats?.totalAmount ?? 0).toLocaleString()}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", href: "/admin/donations" },
    { label: "Active Campaigns", value: stats?.activeCampaigns ?? 0, icon: Megaphone, color: "text-blue-500", bg: "bg-blue-50", href: "/admin/campaigns" },
    { label: "Registered Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-purple-500", bg: "bg-purple-50", href: "/admin/users" },
    { label: "Pending Applications", value: stats?.pendingRegistrations ?? 0, icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-50", href: "/admin/registrations" },
    { label: "New Messages", value: stats?.newMessages ?? 0, icon: MessageSquare, color: "text-yellow-600", bg: "bg-yellow-50", href: "/admin/messages" },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of Azmi Foundation's activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
            <Link key={label} href={href}>
              <a>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                      <p className="text-sm text-gray-500">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>

        {/* Recent Donations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" /> Recent Donations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!recentDonations || recentDonations.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No donations yet</p>
            ) : (
              <div className="space-y-0">
                {recentDonations.slice(0, 8).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                        {d.isAnonymous ? "A" : (d.donorName?.[0] || "?")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.isAnonymous ? "Anonymous" : d.donorName}</p>
                        <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">₹{Number(d.amount).toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === "completed" ? "bg-green-100 text-green-700" : d.status === "failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-3">
              <Link href="/admin/donations">
                <a className="text-sm text-green-600 hover:text-green-700 font-medium">View all donations →</a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
