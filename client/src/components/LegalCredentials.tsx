import { CREDENTIALS_LIST, ORG_CREDENTIALS } from "@/lib/org-credentials";
import { ShieldCheck, ExternalLink } from "lucide-react";

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-100 text-amber-700" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-700" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", badge: "bg-green-100 text-green-700" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", badge: "bg-purple-100 text-purple-700" },
  gray: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", badge: "bg-gray-100 text-gray-700" },
  rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-800", badge: "bg-rose-100 text-rose-700" },
};

interface LegalCredentialsProps {
  compact?: boolean;
}

export function LegalCredentials({ compact = false }: LegalCredentialsProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {CREDENTIALS_LIST.map((c) => {
          const col = COLOR_MAP[c.color];
          return (
            <div
              key={c.label}
              className={`flex items-center gap-1.5 px-2.5 py-1 border text-xs font-bold ${col.bg} ${col.border} ${col.text}`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 px-4 py-1.5 mb-4">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs font-black text-primary uppercase tracking-widest">Fully Verified & Registered</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-primary uppercase tracking-tight">
            Our Legal Credentials
          </h2>
          <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
            Azmi Foundation is a fully registered, government-verified NGO with all mandatory tax and compliance certifications in place.
          </p>
        </div>

        {/* Credentials grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {CREDENTIALS_LIST.map((c) => {
            const col = COLOR_MAP[c.color];
            return (
              <div
                key={c.label}
                className={`border-2 p-4 ${col.bg} ${col.border} group hover:shadow-md transition-all duration-200`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none mt-0.5">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${col.text}`}>
                      {c.label}
                    </p>
                    <p className={`font-black text-sm tracking-wider ${col.text}`}>
                      {c.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{c.sub}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom info bar */}
        <div className="bg-primary text-white p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-4 text-xs">
            <span><span className="text-gray-400">PAN:</span> <span className="font-black tracking-widest">{ORG_CREDENTIALS.pan}</span></span>
            <span><span className="text-gray-400">Estd:</span> <span className="font-black">{ORG_CREDENTIALS.estd}</span></span>
            <span><span className="text-gray-400">Email:</span> <span className="font-black">{ORG_CREDENTIALS.email}</span></span>
          </div>
          <a
            href="https://ngodarpan.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-black uppercase tracking-widest"
          >
            Verify on NGO Darpan <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
