import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, User, Clock, FileText, Heart, Shield, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"applications" | "donations">("applications");

  const bootstrap = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/bootstrap", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "You are now an admin!", description: "Refresh the page to see your admin panel." });
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (e: any) => toast({ title: "Bootstrap failed", description: e.message, variant: "destructive" }),
  });

  const { data: myRegistrations, isLoading: regLoading } = useQuery({
    queryKey: ["/api/my/registrations"],
    queryFn: () => fetch("/api/my/registrations").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: myDonations, isLoading: donLoading } = useQuery({
    queryKey: ["/api/my/donations"],
    queryFn: () => fetch("/api/my/donations").then(r => r.ok ? r.json() : []),
    enabled: !!user,
  });

  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns").then(r => r.json()),
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  const isAdmin = (user as any).role === "admin";
  const campaignMap = Object.fromEntries((campaigns || []).map((c: any) => [c.id, c]));
  const totalDonated = (myDonations || []).filter((d: any) => d.status === "completed").reduce((s: number, d: any) => s + Number(d.amount), 0);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        
        {/* Profile Header */}
        <div className="mb-8 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
            <img 
              src={user.profileImageUrl || "https://github.com/shadcn.png"} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-serif text-primary">Welcome, {user.firstName || 'User'}!</h1>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-bold">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">{user.email}</p>
          </div>
          {isAdmin ? (
            <Link href="/admin">
              <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                <Shield className="w-4 h-4" /> Admin Panel
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={() => bootstrap.mutate()}
              disabled={bootstrap.isPending}
              title="Only works if no admin exists yet"
            >
              {bootstrap.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Become Admin
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center p-4">
            <p className="text-2xl font-bold text-primary">{(myRegistrations || []).length}</p>
            <p className="text-xs text-gray-500 mt-1">Applications</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-2xl font-bold text-green-600">{(myDonations || []).length}</p>
            <p className="text-xs text-gray-500 mt-1">Donations</p>
          </Card>
          <Card className="text-center p-4">
            <p className="text-2xl font-bold text-amber-600">₹{totalDonated.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total Contributed</p>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          {[
            { id: "applications", label: "My Applications", icon: FileText },
            { id: "donations", label: "My Donations", icon: Heart },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === id ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div>
            {regLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : !myRegistrations || myRegistrations.length === 0 ? (
              <Card className="p-12 text-center text-gray-400 border-dashed">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No applications yet</p>
                <p className="text-sm mt-1">Join us as a volunteer, member, or intern</p>
                <Link href="/get-involved">
                  <Button className="mt-4 bg-primary hover:bg-primary/90">Get Involved</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {myRegistrations.map((reg: any) => (
                  <Card key={reg.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 py-4 border-b border-gray-100 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="uppercase tracking-wider capitalize">{reg.type}</Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <StatusBadge status={reg.status} />
                    </CardHeader>
                    <CardContent className="p-5">
                      {reg.adminNote && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm">
                          <span className="font-semibold text-yellow-800">Admin note: </span>
                          <span className="text-yellow-700">{reg.adminNote}</span>
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="block text-gray-400 text-xs mb-1">Motivation</span>
                          <p className="text-gray-700">{reg.details?.motivation || "—"}</p>
                        </div>
                        <div>
                          <span className="block text-gray-400 text-xs mb-1">Contact Info</span>
                          <p className="text-gray-700">{reg.details?.phone}</p>
                          <p className="text-gray-700 text-xs">{reg.details?.address}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Donations Tab */}
        {activeTab === "donations" && (
          <div>
            {donLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : !myDonations || myDonations.length === 0 ? (
              <Card className="p-12 text-center text-gray-400 border-dashed">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">No donations yet</p>
                <p className="text-sm mt-1">Make a difference today by supporting a campaign</p>
                <Link href="/campaigns">
                  <Button className="mt-4 bg-green-600 hover:bg-green-700">Browse Campaigns</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {myDonations.map((d: any) => {
                  const campaign = campaignMap[d.campaignId];
                  return (
                    <Card key={d.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Heart className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">
                            {campaign ? campaign.title : (d.campaignId ? `Campaign #${d.campaignId}` : "General Donation")}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</span>
                            {d.paymentMethod && <span className="text-xs text-gray-400 capitalize">{d.paymentMethod}</span>}
                            {d.taxReceiptRequested && <span className="text-xs text-blue-600">80G receipt</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-green-700">₹{Number(d.amount).toLocaleString()}</p>
                          <DonationStatus status={d.status} />
                        </div>
                        {campaign && (
                          <Link href={`/campaigns/${campaign.id}`}>
                            <a className="text-gray-400 hover:text-primary transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status.toUpperCase()}
    </span>
  );
}

function DonationStatus({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    completed: { cls: "text-green-600", label: "Confirmed" },
    pending: { cls: "text-yellow-600", label: "Pending" },
    failed: { cls: "text-red-600", label: "Failed" },
    refunded: { cls: "text-gray-500", label: "Refunded" },
  };
  const info = map[status] || { cls: "text-gray-500", label: status };
  return <p className={`text-xs font-medium ${info.cls}`}>{info.label}</p>;
}
