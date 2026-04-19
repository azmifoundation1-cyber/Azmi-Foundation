import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, CheckCircle, XCircle, Phone, Calendar, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CAFRecord {
  id: number;
  cafId?: string;
  campaignerName: string;
  campaignerPhone: string;
  beneficiaryName?: string;
  purpose?: string;
  targetAmount?: string;
  hospital?: string;
  campaignTitle?: string;
  otpVerified: boolean;
  ipAddress?: string;
  createdAt: string;
}

export default function AdminCAF() {
  const [search, setSearch] = useState("");

  const { data: records = [], isLoading } = useQuery<CAFRecord[]>({
    queryKey: ["/api/admin/caf"],
  });

  const filtered = records.filter(r =>
    [r.campaignerName, r.campaignerPhone, r.beneficiaryName, r.purpose, r.campaignTitle]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  function cafRef(r: CAFRecord) {
    return `CAF-${String(r.id).padStart(6, "0")}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Signed CAFs</h1>
          <p className="text-gray-500 text-sm mt-0.5">Consent Agreements for Fundraising with OTP-verified signatures</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-sm px-3 py-1">
          {records.length} Total
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Search by name, phone, purpose…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No signed CAFs yet</p>
          <p className="text-sm mt-1">CAFs signed via /sign-caf will appear here</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-[#0a2463] font-bold bg-blue-50 px-2 py-0.5 rounded">
                      {cafRef(r)}
                    </span>
                    {r.otpVerified ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                        <CheckCircle className="w-3 h-3" /> OTP Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1">
                        <XCircle className="w-3 h-3" /> Unverified
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{r.campaignerName}</h3>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                    <Phone className="w-3 h-3" /> {r.campaignerPhone}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(r.createdAt).toLocaleString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                {r.beneficiaryName && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Beneficiary</span>
                    <span className="font-medium text-gray-800">{r.beneficiaryName}</span>
                  </div>
                )}
                {r.campaignTitle && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Campaign</span>
                    <span className="font-medium text-gray-800">{r.campaignTitle}</span>
                  </div>
                )}
                {r.targetAmount && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Target Amount</span>
                    <span className="font-bold text-[#0a2463]">₹{Number(r.targetAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {r.purpose && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Purpose</span>
                    <span className="font-medium text-gray-800">{r.purpose}</span>
                  </div>
                )}
                {r.hospital && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Hospital / Institution</span>
                    <span className="font-medium text-gray-800">{r.hospital}</span>
                  </div>
                )}
                {r.ipAddress && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide block">Signed From IP</span>
                    <span className="font-mono text-xs text-gray-600">{r.ipAddress}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
