import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

function detectInAppBrowser(): "instagram" | "facebook" | "other" | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua)) return "facebook";
  if (/Twitter|TikTok|Line\/|MicroMessenger/i.test(ua)) return "other";
  return null;
}

export function InAppBrowserBanner() {
  const [browser, setBrowser] = useState<"instagram" | "facebook" | "other" | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setBrowser(detectInAppBrowser());
  }, []);

  if (!browser || dismissed) return null;

  const openExternal = () => {
    const url = window.location.href;
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) {
      window.location.href = url.replace(/^https?:\/\//, "googlechrome://");
      setTimeout(() => { window.location.href = url; }, 1500);
    } else {
      window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
      setTimeout(() => { window.location.href = url; }, 1500);
    }
  };

  const label = browser === "instagram" ? "Instagram" : browser === "facebook" ? "Facebook" : "in-app";

  return (
    <div
      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold"
      style={{
        background: "linear-gradient(90deg, #f59e0b, #d97706)",
        color: "#fff",
        zIndex: 9999,
        position: "relative",
      }}
    >
      <span className="flex-1 leading-snug">
        You're inside the {label} browser.{" "}
        <span className="opacity-80">Payment may not work here.</span>
      </span>
      <button
        onClick={openExternal}
        className="flex items-center gap-1 bg-white text-amber-700 font-black text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg shrink-0 active:scale-95 transition-transform"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
      >
        <ExternalLink className="w-3 h-3" />
        Open in Chrome
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 opacity-80 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function useIsInAppBrowser(): boolean {
  const [inApp, setInApp] = useState(false);
  useEffect(() => {
    setInApp(detectInAppBrowser() !== null);
  }, []);
  return inApp;
}
