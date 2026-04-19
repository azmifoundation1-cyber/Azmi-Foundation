import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Settings, Lock, User, Globe, Shield, CheckCircle, Loader2, ExternalLink, Copy } from "lucide-react";

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);

  const changePw = useMutation({
    mutationFn: async () => {
      if (pwForm.newPassword !== pwForm.confirmPassword) throw new Error("Passwords do not match");
      if (pwForm.newPassword.length < 8) throw new Error("New password must be at least 8 characters");
      const res = await fetch("/api/admin/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");
      return data;
    },
    onSuccess: () => {
      toast({ title: "Password changed", description: "Your admin password has been updated successfully." });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast({ title: `${label} copied!` }));
  }

  const siteLinks = [
    { label: "Home Page", path: "/" },
    { label: "Donate Page", path: "/donate" },
    { label: "Campaigns Page", path: "/campaigns" },
    { label: "About Page", path: "/about" },
    { label: "Contact Page", path: "/contact" },
  ];

  const adminInfo = [
    { label: "Organisation Name", value: "Azmi Foundation" },
    { label: "PAN (80G)", value: "AAGTA9354B" },
    { label: "GTM Container", value: "GTM-WZ3N7F24" },
    { label: "Meta Pixel ID", value: "1637614274117773" },
    { label: "Razorpay Key (live)", value: "rzp_live_SciP83UKVvOlON" },
    { label: "UPI Handle", value: "8320218861@okbizaxis" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-600" /> Settings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Admin account settings and site configuration reference</p>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Your Admin Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Name</p>
                <p className="font-semibold text-gray-800">{(user as any)?.firstName} {(user as any)?.lastName}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Email / Login</p>
                <p className="font-semibold text-gray-800">{(user as any)?.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Role</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Status</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                  <CheckCircle className="w-3 h-3" /> Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-500" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input
                type={showPw ? "text" : "password"}
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="Your current password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>New Password</Label>
                <Input
                  type={showPw ? "text" : "password"}
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type={showPw ? "text" : "password"}
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} className="rounded" />
                Show passwords
              </label>
              <div className="flex-1" />
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                disabled={changePw.isPending || !pwForm.currentPassword || !pwForm.newPassword}
                onClick={() => changePw.mutate()}
              >
                {changePw.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Site Links Quick Access */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" /> Site Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {siteLinks.map(l => (
                <a
                  key={l.path}
                  href={l.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {l.label}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Integration Reference */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" /> Integration Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 mb-3">Click any value to copy it to clipboard.</p>
            <div className="space-y-2">
              {adminInfo.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <button
                    onClick={() => copyToClipboard(value, label)}
                    className="flex items-center gap-1.5 font-mono text-xs font-semibold text-gray-800 hover:text-blue-600 transition-colors group"
                    title="Click to copy"
                  >
                    {value}
                    <Copy className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <Shield className="w-4 h-4" /> Session
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Sign out of admin panel</p>
              <p className="text-xs text-gray-400">You'll be redirected to the login page.</p>
            </div>
            <a href="/api/logout">
              <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                Logout
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
