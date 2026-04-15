import { useRoute, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Share2, Users, CheckCircle, ShieldCheck, CheckCircle2,
  ChevronRight, ChevronDown, Loader2, ArrowLeft, Copy, Check,
  Clock, Bell, Calendar, Facebook, Twitter, FileText, Download,
  IndianRupee, Phone, MapPin, Building2, Hash, AlertTriangle,
  Scroll, Landmark, Handshake, Flag, Briefcase, ClipboardList,
  Home as HomeIcon, Building
} from "lucide-react";
import type { Campaign, Donation, CampaignUpdate } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { generate80GReceipt, type ReceiptData } from "@/lib/generate-80g-receipt";

declare global {
  interface Window { Razorpay: any; }
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];
const C3_PRESETS = [680, 2040, 6800];

const CAMPAIGN_STORIES: Record<number, {
  story: string[];
  images: string[];
  youtubeId?: string;
  localVideo?: string;
}> = {
  1: {
    story: [
      "For over 6 years, AZMI Foundation has dedicated itself to reaching the unreached. In the villages surrounding Ahmedabad, thousands of families lack access to clean drinking water — a basic human right that most of us take for granted.",
      "Our team travels every week to remote communities, installing hand pumps, distributing water purification tablets, and educating families about safe water practices. Every rupee raised goes directly toward building sustainable water infrastructure that will serve these communities for decades.",
      "Today, the families who once walked miles for water have access to clean sources within their neighborhoods. Children no longer miss school collecting water. Women have time for income-generating activities. This is what your donation achieves — real, lasting change.",
      "Dr. Shahbaaz Azmi leads our field operations personally, ensuring complete transparency in how every donation is utilized. Together, we can ensure clean water reaches every corner of Gujarat.",
    ],
    images: [
      "https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80",
    ],
  },
  2: {
    story: [
      "Education is the most powerful weapon we can give a child. At AZMI Foundation, we believe no child should be denied the right to learn due to poverty. Since 2018, we have been sponsoring the education of underprivileged children across Ahmedabad.",
      "Our program covers school fees, books, uniforms, and stationery for children from families who cannot afford even the basics. We also provide after-school tutoring and mentorship, ensuring these children don't just attend school — they thrive.",
      "Over the past year alone, we have supported more than 300 children across 12 schools in Gomtipur and surrounding areas. Many of our early recipients have gone on to secondary education and vocational training, breaking the cycle of poverty for their entire families.",
      "By donating to this campaign, you are directly sponsoring a child's future. Every ₹1,000 covers one month of a child's complete educational needs. Your generosity today shapes tomorrow's leaders.",
    ],
    images: [
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80",
    ],
  },
  3: {
    localVideo: "/shahbaaz-video.mp4",
    story: [
      "For 18 years, Dr. Shahbaaz Azmi's father fed the forgotten — the homeless, the hungry, the abandoned. He fed over 2 lakh people using his own savings, sitting down to share meals with strangers on the roadside. Serving the poor was not charity for him. It was his religion.",
      "Today, this selfless man lies in critical condition — heart failure, kidney failure, and a brain haemorrhage. He cannot eat or move without assistance. His son, Dr. Shahbaaz, is now fighting alone to save his father's life while keeping this 18-year legacy alive. His clinic is shut. His savings are gone. The medical bills keep rising.",
      "Yet every single day, Dr. Shahbaaz ensures 2,000 people are fed. He reaches slum families and footpath dwellers who have no other food source. For them, this is not charity — it is survival. If we stop, they go hungry.",
      "846 families in Ahmedabad need groceries right now. Just ₹680 provides one complete grocery kit for a family. Please help us carry this legacy forward — before it is too late.",
    ],
    images: [
      "/shahbaaz-thumb.jpg",
      "/azmi-img3.jpg",
      "/azmi-img3.jpg",
      "/azmi-img4.jpg",
      "/azmi-img1.jpg",
      "/azmi-img2.jpg",
    ],
  },
};

const GOAL = 575280;
const RAISED = 25470;
const NEEDED = GOAL - RAISED;

export default function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:id");
  const id = Number(params?.id);

  // Shared state
  const [amount, setAmount] = useState(id === 3 ? "680" : "1000");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [copied, setCopied] = useState(false);
  const [donating, setDonating] = useState(false);
  const [activeTab, setActiveTab] = useState<"story" | "updates" | "supporters">("story");
  const [want80G, setWant80G] = useState(true);
  const [donorPan, setDonorPan] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [donorCity, setDonorCity] = useState("");
  const [donorState, setDonorState] = useState("");
  const [donorPincode, setDonorPincode] = useState("");
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Campaign 3 — accordion state
  const [upiOpen, setUpiOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // FAQ open states
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Live countdown
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const upiId = "8320218861@okbizaxis";

  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ["/api/campaigns", id],
    queryFn: () => fetch(`/api/campaigns/${id}`).then(r => r.json()),
    enabled: !!id,
  });

  const { data: supporters = [] } = useQuery<Donation[]>({
    queryKey: ["/api/donations/campaign", id],
    queryFn: () => fetch(`/api/donations/campaign/${id}`).then(r => r.json()),
    enabled: !!id,
  });

  const { data: updates = [] } = useQuery<CampaignUpdate[]>({
    queryKey: ["/api/campaigns", id, "updates"],
    queryFn: () => fetch(`/api/campaigns/${id}/updates`).then(r => r.json()),
    enabled: !!id,
  });

  const { data: allCampaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: () => fetch("/api/campaigns").then(r => r.json()),
  });

  // Countdown timer
  useEffect(() => {
    const tick = () => {
      const rawEnd = campaign?.endDate
        ? campaign.endDate
        : (id === 3 ? "2026-04-30T18:29:59.000Z" : null);
      const endDate = rawEnd ? new Date(rawEnd).getTime() : null;
      if (!endDate) return;
      const diff = endDate - Date.now();
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [campaign?.endDate, id]);

  const handleDonate = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1) return;

    // For campaign 3 simplified: only validate PAN if 80G AND they actually entered a PAN
    const isC3 = id === 3;
    if (want80G && !isAnon && !isC3) {
      if (!donorName.trim()) { toast({ title: "Name required for 80G receipt", variant: "destructive" }); return; }
      if (!donorPan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(donorPan.trim().toUpperCase())) {
        toast({ title: "Valid PAN required for 80G receipt", description: "Format: ABCDE1234F", variant: "destructive" }); return;
      }
      if (!donorPhone.trim() || !/^\d{10}$/.test(donorPhone.trim())) {
        toast({ title: "Valid 10-digit mobile required for 80G receipt", variant: "destructive" }); return;
      }
      if (!donorAddress.trim() || !donorCity.trim() || !donorState.trim()) {
        toast({ title: "Address required for 80G receipt", variant: "destructive" }); return;
      }
      if (!donorPincode.trim() || !/^\d{6}$/.test(donorPincode.trim())) {
        toast({ title: "Valid 6-digit PIN code required", variant: "destructive" }); return;
      }
    }
    if (isC3) {
      if (!donorName.trim()) { toast({ title: "Please enter your name", variant: "destructive" }); return; }
      if (!donorPhone.trim() || !/^\d{10}$/.test(donorPhone.trim())) {
        toast({ title: "Please enter a valid 10-digit phone number", variant: "destructive" }); return;
      }
    }

    setDonating(true);
    try {
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.body.appendChild(script);
        });
      }
      const keyRes = await fetch("/api/razorpay/key");
      const { key } = await keyRes.json();
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, campaignId: id, donorName: isAnon ? "" : donorName }),
      });
      if (!orderRes.ok) throw new Error("Order creation failed");
      const { orderId, amount: orderAmount, currency } = await orderRes.json();

      const rzp = new window.Razorpay({
        key, amount: orderAmount, currency, order_id: orderId,
        name: "AZMI Foundation",
        description: campaign?.title || "Donation",
        image: "/logo.png",
        prefill: {
          name: isAnon ? "" : donorName,
          email: isAnon ? "" : donorEmail,
          contact: isAnon ? "" : donorPhone,
        },
        theme: { color: id === 3 ? "#e53e3e" : "#1a1a2e" },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                campaignId: id,
                amount: String(amt),
                donorName: isAnon ? "Anonymous" : (donorName || "Anonymous"),
                donorEmail: donorEmail || null,
                donorPhone: donorPhone || null,
                isAnonymous: isAnon,
                taxReceiptRequested: want80G && !isAnon,
                donorPan: want80G && donorPan ? donorPan.toUpperCase() : null,
                donorAddress: want80G && donorAddress ? donorAddress : null,
                donorCity: want80G && donorCity ? donorCity : null,
                donorState: want80G && donorState ? donorState : null,
                donorPincode: want80G && donorPincode ? donorPincode : null,
              }),
            });
            if (!verifyRes.ok) throw new Error("Verification failed");
            const donationData = await verifyRes.json();

            // Generate 80G PDF if all required fields present
            if (want80G && !isAnon && donorPan && donorAddress && donorCity && donorState && donorPincode) {
              const receiptNo = `AF-${new Date().getFullYear()}-${String(donationData.id).padStart(5, "0")}`;
              const receipt: ReceiptData = {
                receiptNo, paymentId: response.razorpay_payment_id,
                donationDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
                donorName: donorName.trim(), donorPan: donorPan.trim().toUpperCase(),
                donorPhone: donorPhone.trim(), donorEmail: donorEmail.trim(),
                donorAddress: donorAddress.trim(), donorCity: donorCity.trim(),
                donorState: donorState.trim(), donorPincode: donorPincode.trim(),
                amount: amt, campaignTitle: campaign?.title || "General Donation", paymentMethod: "Razorpay",
              };
              setLastReceipt(receipt);
              setGeneratingPdf(true);
              await generate80GReceipt(receipt);
              setGeneratingPdf(false);
            }

            const families = Math.floor(amt / 680);
            // WhatsApp thank-you trigger for campaign 3
            if (id === 3 && donorPhone) {
              const msg = encodeURIComponent(
                `Thank you ${donorName || ""}! You just fed ${families > 0 ? families : 1} ${families === 1 ? "family" : "families"}. Your 80G receipt will arrive within 24 hours. Share this campaign: https://azmifoundation.com/campaigns/3`
              );
              setTimeout(() => window.open(`https://wa.me/91${donorPhone.replace(/\D/g, "")}?text=${msg}`, "_blank"), 1500);
            }

            toast({
              title: "Thank You! Donation Successful",
              description: `You just helped feed ${families > 0 ? families : 1} ${families === 1 ? "family" : "families"}. Thank you!`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/donations/campaign", id] });
            queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id] });
            queryClient.invalidateQueries({ queryKey: ["/api/campaigns/featured"] });
            setDonating(false);
            setDonorName(""); setDonorEmail(""); setDonorPhone(""); setAmount(id === 3 ? "680" : "1000");
          } catch {
            toast({ title: "Payment recorded but verification pending.", description: "Our team will confirm your donation soon.", variant: "destructive" });
            setDonating(false);
          }
        },
        modal: { ondismiss: () => setDonating(false) },
      });
      rzp.open();
    } catch {
      toast({ title: "Payment Error", description: "Could not initiate payment. Please try again.", variant: "destructive" });
      setDonating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Support this cause: ${campaign?.title} — ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleFacebookShare = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
  const handleTwitterShare = () => {
    const text = encodeURIComponent(`I just donated to "${campaign?.title}" by Azmi Foundation. Join me!`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-black text-primary uppercase">Campaign Not Found</h2>
            <Link href="/campaigns"><Button className="rounded-none">Back to Campaigns</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const liveRaised = Math.max(Number(campaign.currentAmount) || 0, RAISED);
  const percent = Math.min(100, Math.round((liveRaised / GOAL) * 100));
  const story = CAMPAIGN_STORIES[id] || CAMPAIGN_STORIES[1];
  const relatedCampaigns = allCampaigns.filter(c => c.id !== campaign.id && c.category === campaign.category).slice(0, 3);
  const daysLeft = campaign.endDate ? Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / 86400000)) : null;
  const liveCount = Math.max(supporters.length, 7);

  // ─────────────────────────────────────────────────────────────────
  // CAMPAIGN 3 — Conversion-Optimised Layout
  // ─────────────────────────────────────────────────────────────────
  if (id === 3) {
    const families = amount ? Math.floor(Number(amount) / 680) : 0;

    return (
      <div className="min-h-screen flex flex-col bg-white font-sans">
        <Navbar />

        {/* ── STICKY PROGRESS BAR ── */}
        <div className="sticky top-20 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                <span className="text-red-600">₹{liveRaised.toLocaleString("en-IN")} raised</span>
                <span className="text-gray-400">Goal: ₹5,75,280</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 1.2, ease: "circOut" }}
                  className="h-full bg-red-500 rounded-full"
                />
              </div>
            </div>
            <a href="#donate-form">
              <Button className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-none px-4 py-2 text-xs shrink-0">
                Donate →
              </Button>
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-14 items-start">

          {/* ── LEFT COLUMN — Story content ── */}
          <div className="lg:col-span-2 space-y-8">

          {/* ── H1 HEADLINE ── */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="bg-red-600 text-white text-xs font-black uppercase tracking-[0.3em] px-3 py-1.5">Urgent</span>
              <span className="bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-[0.3em] px-3 py-1.5">Ahmedabad, Gujarat</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary leading-tight tracking-tight">
              18-Year Legacy at Risk — Help Us Feed 846 Families
            </h1>
          </div>

          {/* ── TRUST BAR ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { Icon: Scroll,    line1: "80G Tax Exemption", line2: "AAGTA9354BF20261", color: "border-amber-200 bg-amber-50 text-amber-700" },
              { Icon: Flag,      line1: "NGO Darpan Verified", line2: "GJ/2021/0276308", color: "border-blue-200 bg-blue-50 text-blue-700" },
              { Icon: Handshake, line1: "CSR-1 Registered", line2: "CSR00108803", color: "border-green-200 bg-green-50 text-green-700" },
              { Icon: Heart,     line1: `${liveCount} people donated`, line2: "Join them today", color: "border-rose-200 bg-rose-50 text-rose-700" },
            ].map(({ Icon, line1, line2, color }) => (
              <div key={line1} className={`border rounded-none p-3 text-center ${color}`}>
                <Icon className="w-5 h-5 mx-auto mb-1.5" />
                <p className="text-xs font-black uppercase tracking-wide mt-1 leading-tight">{line1}</p>
                <p className="text-[10px] font-bold opacity-70 mt-0.5 leading-tight truncate">{line2}</p>
              </div>
            ))}
          </div>

          {/* ── STORY ── */}
          <div className="space-y-4 text-gray-700 leading-relaxed text-base sm:text-lg">
            <p>
              Dr. Shahbaaz's father fed over 2 lakh strangers from his own savings. Today he lies in ICU — heart failure, kidney failure, brain haemorrhage. His son is feeding 2,000 people alone, with an empty bank account. <strong className="text-primary">846 families in Ahmedabad have no other food source.</strong>
            </p>
            <div className="my-4 rounded-none bg-black" style={{ position: "relative", overflow: "hidden" }}>
              <video
                src="/shahbaaz-video.mp4"
                autoPlay
                muted
                playsInline
                controls
                preload="auto"
                className="w-full h-auto block"
                style={{ maxWidth: "100%", display: "block" }}
              />
              {/* Milaap watermark blur — top-right corner */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "22%",
                  height: "13%",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  backgroundColor: "rgba(0,0,0,0.04)",
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              />
            </div>
            <p>
              Grocery kits ship on <strong>30 April 2026</strong>. We need to reach <strong>₹5,75,280</strong> before then. Currently: <span className="text-green-600 font-black">₹{liveRaised.toLocaleString("en-IN")}</span> raised. <span className="text-red-600 font-black">₹{Math.max(0, GOAL - liveRaised).toLocaleString("en-IN")} still needed.</span>
            </p>
          </div>

          {/* ── IMPACT SECTION ── */}
          <div className="bg-amber-50 border-2 border-amber-200 p-6 space-y-4">
            <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Your Donation Impact</p>
            <p className="text-xl sm:text-2xl font-black text-primary leading-tight">
              ₹680 = 1 family's groceries for a month.
              <span className="block text-base font-bold text-gray-500 mt-1">That is less than one restaurant meal.</span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { amt: "₹680", impact: "1 family", Icon: HomeIcon },
                { amt: "₹2,040", impact: "3 families", Icon: Building },
                { amt: "₹6,800", impact: "10 families", Icon: Building2 },
              ].map(({ amt, impact, Icon }) => (
                <div key={amt} className="bg-white border border-amber-200 p-3 text-center space-y-1">
                  <Icon className="w-6 h-6 mx-auto text-amber-600" />
                  <p className="text-sm font-black text-primary">{amt}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{impact}</p>
                </div>
              ))}
            </div>
          </div>

          </div>{/* ── END LEFT COLUMN ── */}

          {/* ── RIGHT COLUMN — Sticky form ── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-28 space-y-4">

          {/* ── DONATION FORM ── */}
          <div id="donate-form" className="bg-white border-2 border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Choose Amount</p>

            {/* 3 Preset Amounts */}
            <div className="grid grid-cols-3 gap-3">
              {C3_PRESETS.map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className={`py-4 text-center border-2 transition-all duration-200 ${amount === String(a)
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-gray-200 text-gray-700 hover:border-red-400 hover:text-red-600"
                  }`}
                >
                  <p className="text-lg font-black">₹{a.toLocaleString("en-IN")}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wide opacity-80">
                    {a === 680 ? "1 family" : a === 2040 ? "3 families" : "10 families"}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
              <Input
                type="number"
                value={C3_PRESETS.includes(Number(amount)) ? "" : amount}
                onChange={e => setAmount(e.target.value)}
                onFocus={() => { if (C3_PRESETS.includes(Number(amount))) setAmount(""); }}
                className="pl-8 rounded-none border-2 border-gray-200 focus:border-red-400 font-bold text-primary h-12"
                placeholder="Other amount"
                min="1"
              />
            </div>

            {families > 0 && (
              <p className="text-center text-xs font-black text-red-600 bg-red-50 py-2 border border-red-100 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Your ₹{Number(amount).toLocaleString("en-IN")} will feed <strong>{families} {families === 1 ? "family" : "families"}</strong>
              </p>
            )}

            {/* Form Fields */}
            <div className="space-y-3">
              <Input
                type="text"
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
                className="rounded-none border-2 border-gray-200 focus:border-red-400 font-bold text-primary h-12"
                placeholder="Your Name *"
                disabled={isAnon}
                required
              />
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="tel"
                  value={donorPhone}
                  onChange={e => setDonorPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="pl-9 rounded-none border-2 border-gray-200 focus:border-red-400 font-bold text-primary h-12"
                  placeholder="Phone Number * (for 80G receipt on WhatsApp)"
                  disabled={isAnon}
                  maxLength={10}
                  required
                />
              </div>
              <Input
                type="email"
                value={donorEmail}
                onChange={e => setDonorEmail(e.target.value)}
                className="rounded-none border-2 border-gray-200 focus:border-red-400 font-bold text-primary h-12"
                placeholder="Email (optional)"
                disabled={isAnon}
              />
            </div>

            {/* 80G Pre-checked */}
            {!isAnon && (
              <div
                onClick={() => setWant80G(!want80G)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-2 transition-all ${want80G ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-gray-50 hover:border-amber-300"}`}
              >
                <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${want80G ? "border-amber-500 bg-amber-500" : "border-gray-300"}`}>
                  {want80G && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-black text-primary uppercase tracking-widest">
                    I want my 80G tax receipt (auto-sent after payment)
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Claim income tax deduction under Section 80G. Certificate No. AAGTA9354BF20261.
                  </p>
                </div>
              </div>
            )}

            {/* 80G expanded details */}
            <AnimatePresence>
              {want80G && !isAnon && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-2 border-amber-300 bg-amber-50/60 p-4 space-y-3">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                      <FileText className="w-3 h-3 inline mr-1" /> 80G Receipt Details
                      <span className="text-gray-400 ml-1 font-normal normal-case">(enter PAN to download PDF receipt)</span>
                    </p>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600" />
                      <Input
                        type="text"
                        value={donorPan}
                        onChange={e => setDonorPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                        className="pl-8 rounded-none border-2 border-amber-300 focus:border-amber-500 font-bold text-primary h-11 bg-white text-sm uppercase tracking-widest"
                        placeholder="PAN Number (e.g. ABCDE1234F)"
                        maxLength={10}
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-3.5 h-3.5 text-amber-600" />
                      <textarea
                        value={donorAddress}
                        onChange={e => setDonorAddress(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 border-2 border-amber-300 focus:border-amber-500 font-bold text-primary bg-white text-sm resize-none rounded-none outline-none"
                        placeholder="Full Address (House/Street/Area)"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600" />
                        <Input type="text" value={donorCity} onChange={e => setDonorCity(e.target.value)} className="pl-8 rounded-none border-2 border-amber-300 h-11 bg-white text-sm font-bold text-primary" placeholder="City" />
                      </div>
                      <Input type="text" value={donorState} onChange={e => setDonorState(e.target.value)} className="rounded-none border-2 border-amber-300 h-11 bg-white text-sm font-bold text-primary" placeholder="State" />
                    </div>
                    <Input
                      type="text"
                      value={donorPincode}
                      onChange={e => setDonorPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="rounded-none border-2 border-amber-300 h-11 bg-white text-sm font-bold text-primary"
                      placeholder="PIN Code (6 digits)"
                      maxLength={6}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Anonymous toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => { setIsAnon(!isAnon); if (!isAnon) setWant80G(false); }}
                className={`w-4 h-4 border-2 flex items-center justify-center transition-all ${isAnon ? "border-primary bg-primary" : "border-gray-300 group-hover:border-primary"}`}
              >
                {isAnon && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Donate Anonymously</span>
            </label>

            {/* Re-download receipt */}
            {lastReceipt && (
              <Button
                variant="outline"
                onClick={async () => { setGeneratingPdf(true); await generate80GReceipt(lastReceipt); setGeneratingPdf(false); }}
                disabled={generatingPdf}
                className="w-full rounded-none border-2 border-amber-300 text-amber-700 font-black uppercase tracking-widest text-xs h-11"
              >
                {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-3.5 h-3.5 mr-2" /> Re-download 80G Receipt</>}
              </Button>
            )}
          </div>

          {/* ── PAYMENT SECTION ── */}
          <div className="space-y-3">
            {/* Primary: Razorpay */}
            <Button
              onClick={handleDonate}
              disabled={donating || !amount || Number(amount) < 1}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-none py-7 text-base shadow-lg shadow-red-200"
            >
              {donating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2 fill-white" />
                  Feed a Family — ₹{Number(amount) > 0 ? Number(amount).toLocaleString("en-IN") : "680"}
                </>
              )}
            </Button>
            <p className="text-center text-[10px] text-gray-400 font-medium">
              Secured by Razorpay · UPI / Card / NetBanking / Wallet
            </p>

            {/* UPI Accordion */}
            <div className="border-2 border-gray-100">
              <button
                onClick={() => { setUpiOpen(!upiOpen); setBankOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Pay via UPI directly — 8320218861@okbizaxis</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${upiOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {upiOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400 pt-3 font-medium">Open any UPI app (GPay, PhonePe, Paytm, BHIM) and send to:</p>
                      <div className="bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
                        <span className="font-black text-primary text-sm">{upiId}</span>
                        <button onClick={() => { navigator.clipboard.writeText(upiId); toast({ title: "UPI ID copied!" }); }} className="text-accent font-black text-xs uppercase">Copy</button>
                      </div>
                      {!showQr ? (
                        <button onClick={() => setShowQr(true)} className="text-xs font-black text-accent uppercase tracking-widest hover:underline">
                          Show UPI QR Code →
                        </button>
                      ) : (
                        <div className="text-center space-y-2">
                          <img src="/azmi-qr.png" alt="UPI QR Code — 8320218861@okbizaxis" className="w-40 h-40 mx-auto border border-gray-200 p-2" />
                          <p className="text-[10px] text-gray-400">Scan with any UPI app · Name: AZMI FOUNDATION</p>
                        </div>
                      )}
                      <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 p-2">
                        After paying via UPI, WhatsApp us your screenshot at <strong>+91 83202 18861</strong> to receive your 80G receipt.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bank Transfer Accordion */}
            <div className="border-2 border-gray-100">
              <button
                onClick={() => { setBankOpen(!bankOpen); setUpiOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Bank Transfer — Axis Bank</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${bankOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {bankOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
                      {[
                        ["Name", "AZMI FOUNDATION"],
                        ["Account No.", "921020009805552"],
                        ["IFSC Code", "UTIB0000453"],
                        ["Bank", "Axis Bank, Relief Road, Ahmedabad"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-xs py-1.5 border-b border-gray-50">
                          <span className="text-gray-400 font-medium">{label}</span>
                          <span className="text-primary font-black">{value}</span>
                        </div>
                      ))}
                      <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 p-2 mt-2">
                        After transferring, WhatsApp your transaction ID to <strong>+91 83202 18861</strong> to receive your 80G receipt within 24 hours.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

            </div>{/* end sticky */}
          </div>{/* end right col */}
          </div>{/* end grid */}
        </div>{/* end max-w-7xl */}

        {/* ── FULL WIDTH BELOW ── */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-8 pb-12">

          {/* ── SHARE ── */}
          <div className="flex flex-wrap gap-2">
            <button onClick={handleWhatsAppShare} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Share on WhatsApp
            </button>
            <button onClick={handleFacebookShare} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors">
              <Facebook className="w-3.5 h-3.5" /> Facebook
            </button>
            <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          {/* ── FAQ ── */}
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Frequently Asked Questions</h2>
            {[
              {
                q: "Is this legit? How do I know my money reaches the right people?",
                a: "Azmi Foundation is registered with NITI Aayog NGO Darpan (GJ/2021/0276308), CSR-1 (CSR00108803), and holds 80G & 12A income tax certifications. Dr. Shahbaaz Azmi has personally fed 2 lakh people over 18 years. Every donation is tracked and reported. You will receive a detailed impact update via WhatsApp within 7 days of the grocery distribution on April 30.",
              },
              {
                q: "When will I get my 80G receipt?",
                a: "If you pay via Razorpay, your 80G receipt is auto-sent to your phone/email within 24 hours. If you pay via UPI or bank transfer, WhatsApp your payment screenshot to +91 83202 18861 and we will send your receipt within 24 hours.",
              },
              {
                q: "How exactly are funds used?",
                a: "₹680 covers one complete grocery kit — rice, dal, oil, flour, salt, sugar, and basic spices — for one family for a month. 100% of donation funds go toward grocery procurement and distribution. Administrative costs are covered separately by the Azmi family.",
              },
              {
                q: "Can I donate monthly / become a recurring donor?",
                a: "Yes! WhatsApp +91 83202 18861 or email us to set up a monthly standing commitment. Even ₹680/month sponsors one family's food security for an entire year. Thank you for your generosity.",
              },
            ].map((item, i) => (
              <div key={i} className="border border-gray-100">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left"
                >
                  <span className="text-base font-bold text-primary pr-4 leading-snug">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${faqOpen === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-base text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* ── LEGAL REGISTRATIONS ── */}
          <div className="border-t border-gray-100 pt-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Registered & Verified
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "80G", value: "AAGTA9354BF20261" },
                { label: "12A", value: "AAGTA9354BE2025101" },
                { label: "CSR-1", value: "CSR00108803" },
                { label: "NGO Darpan", value: "GJ/2021/0276308" },
                { label: "PAN", value: "AAGTA9354B" },
                { label: "Trust Reg.", value: "E/22280/AHMEDABAD" },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs">
                  <span className="font-black text-gray-500 uppercase">{c.label}</span>
                  <span className="text-gray-400">·</span>
                  <span className="font-mono text-gray-600 text-[11px]">{c.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── CONTACT NOTE ── */}
          <p className="pb-8 text-sm text-gray-400 text-center">
            Questions? WhatsApp us at <strong className="text-primary">+91 83202 18861</strong>
          </p>

        </div>

        <Footer />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // DEFAULT LAYOUT — Campaigns 1, 2, and any others
  // ─────────────────────────────────────────────────────────────────
  const defaultPercent = Math.min(100, Math.round((Number(campaign.currentAmount) / Number(campaign.targetAmount)) * 100));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/campaigns" className="hover:text-primary transition-colors">Campaigns</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-bold truncate max-w-[200px]">{campaign.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Link href="/campaigns" className="inline-flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest mb-4 hover:text-primary transition-colors">
                <ArrowLeft className="w-3 h-3" /> All Campaigns
              </Link>
              <h1 className="text-2xl sm:text-4xl font-black text-primary leading-tight tracking-tight">{campaign.title}</h1>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-none overflow-hidden aspect-video bg-gray-200">
              <img
                src={campaign.imageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80"}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/80 to-transparent p-6">
                <div className="flex items-center gap-2">
                  <span className="bg-accent text-white text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1">Active Campaign</span>
                  <span className="bg-white/20 text-white text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 backdrop-blur-sm">Ahmedabad, Gujarat</span>
                </div>
              </div>
            </motion.div>

            {/* Share Row */}
            <div className="flex flex-wrap gap-2">
              <button onClick={handleWhatsAppShare} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-green-600 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                WhatsApp
              </button>
              <button onClick={handleFacebookShare} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-blue-700 transition-colors">
                <Facebook className="w-3.5 h-3.5" /> Facebook
              </button>
              <button onClick={handleTwitterShare} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-sky-600 transition-colors">
                <Twitter className="w-3.5 h-3.5" /> Twitter
              </button>
              <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-full hover:border-primary hover:text-primary transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow-sm">
              <div className="flex border-b border-gray-100">
                {(["story", "updates", "supporters"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                    {tab === "story" && "The Story"}
                    {tab === "updates" && `Updates${updates.length > 0 ? ` (${updates.length})` : ""}`}
                    {tab === "supporters" && `Supporters (${supporters.length})`}
                  </button>
                ))}
              </div>
              <div className="p-6 sm:p-10">
                {activeTab === "story" && (
                  <div className="space-y-8">
                    {story.story.map((para, i) => (
                      <div key={i} className="space-y-6">
                        <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{para}</p>
                        {i === 0 && story.localVideo && (
                          <div className="my-4 rounded-none overflow-hidden bg-black">
                            <video src={story.localVideo} controls poster={story.images[0]} className="w-full max-h-[480px] object-contain" preload="metadata">Your browser does not support the video tag.</video>
                          </div>
                        )}
                        {story.images[i + 1] && i >= 1 && (
                          <div className="overflow-hidden aspect-video rounded-none">
                            <img src={story.images[i + 1]} alt={`Campaign image ${i + 2}`} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="pt-4 border-t border-gray-100">
                      <Link href={`/donate?campaignId=${campaign.id}`}><span className="text-accent font-black uppercase tracking-widest text-sm hover:underline cursor-pointer">Click Here To Contribute →</span></Link>
                    </div>
                  </div>
                )}
                {activeTab === "updates" && (
                  <div className="space-y-6">
                    {updates.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <Bell className="w-10 h-10 text-gray-200 mx-auto" />
                        <p className="text-gray-400 text-sm font-medium">No updates yet — check back soon!</p>
                      </div>
                    ) : updates.map((upd) => (
                      <div key={upd.id} className="border-l-2 border-accent pl-5 space-y-2 py-2">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          <Calendar className="w-3 h-3" />
                          {new Date(upd.createdAt ?? "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        <h3 className="text-sm font-black text-primary uppercase tracking-tight">{upd.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{upd.content}</p>
                        {upd.imageUrl && <img src={upd.imageUrl} alt={upd.title} className="w-full aspect-video object-cover mt-3" />}
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "supporters" && (
                  <div className="space-y-4">
                    {supporters.length === 0 ? (
                      <div className="text-center py-12"><p className="text-gray-400 text-sm font-medium">Be the first to support this cause!</p></div>
                    ) : (
                      <>
                        {supporters.slice(0, 10).map((s) => (
                          <div key={s.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                              {s.isAnonymous ? "A" : (s.donorName?.[0] || "A").toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-primary text-sm truncate">{s.isAnonymous ? "Anonymous" : (s.donorName || "Anonymous")}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{new Date(s.createdAt ?? "").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                            </div>
                            <p className="text-accent font-black text-base shrink-0">₹{Number(s.amount).toLocaleString()}</p>
                          </div>
                        ))}
                        {supporters.length > 10 && <p className="text-center text-accent font-black text-sm uppercase tracking-widest pt-2">+{supporters.length - 10} more supporters</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (STICKY DONATION WIDGET) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-primary text-white px-5 py-3 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest">Verified by AZMI Foundation</span>
                <ChevronRight className="w-4 h-4 ml-auto shrink-0" />
              </div>

              <div className="bg-white shadow-sm p-6 space-y-5">
                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-black text-primary tracking-tighter">₹{Number(campaign.currentAmount).toLocaleString()}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">of ₹{Number(campaign.targetAmount).toLocaleString()} goal</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-accent tracking-tighter">{defaultPercent}%</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Funded</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 overflow-hidden rounded-full">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${defaultPercent}%` }} transition={{ duration: 1.5, ease: "circOut" }} className="h-full bg-accent shadow-[0_0_8px_rgba(212,175,55,0.5)] rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                    <div className="flex items-center gap-1.5"><Users className="w-3 h-3" />{supporters.length} Supporters</div>
                    {daysLeft !== null && (
                      <div className={`flex items-center gap-1.5 font-black ${daysLeft <= 3 ? "text-red-500" : "text-gray-400"}`}>
                        <Clock className="w-3 h-3" />{daysLeft === 0 ? "Last day!" : `${daysLeft} days left`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5 space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map(a => (
                      <button key={a} onClick={() => setAmount(String(a))}
                        className={`py-2 text-xs font-black uppercase tracking-wider border-2 transition-all duration-200 ${amount === String(a) ? "border-primary bg-primary text-white" : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"}`}>
                        ₹{a >= 1000 ? `${a / 1000}K` : a}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="pl-8 rounded-none border-2 border-gray-200 focus:border-primary font-bold text-primary h-12" placeholder="Enter amount" min="1" />
                  </div>

                  <Input type="text" value={donorName} onChange={e => setDonorName(e.target.value)} className="rounded-none border-2 border-gray-200 focus:border-primary font-bold text-primary h-12" placeholder="Your Name" disabled={isAnon} />
                  <Input type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} className="rounded-none border-2 border-gray-200 focus:border-primary font-bold text-primary h-12" placeholder="Email (optional)" disabled={isAnon} />
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="tel" value={donorPhone} onChange={e => setDonorPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="pl-9 rounded-none border-2 border-gray-200 focus:border-primary font-bold text-primary h-12" placeholder="Mobile Number (optional)" disabled={isAnon} maxLength={10} />
                  </div>

                  {!isAnon && (
                    <div onClick={() => setWant80G(!want80G)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-2 transition-all duration-300 ${want80G ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50/40"}`}>
                      <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-all ${want80G ? "border-amber-500 bg-amber-500" : "border-gray-300"}`}>
                        {want80G && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-primary uppercase tracking-widest"><IndianRupee className="w-3 h-3 inline mr-1 text-amber-600" />I want an 80G Tax Exemption Receipt</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Claim income tax deduction under Section 80G. PAN & address required.</p>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {want80G && !isAnon && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                        <div className="border-2 border-amber-300 bg-amber-50/60 p-4 space-y-3">
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1"><FileText className="w-3 h-3" /> 80G Receipt Details <span className="text-red-500 ml-1">— All fields mandatory</span></p>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600" />
                            <Input type="text" value={donorPan} onChange={e => setDonorPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} className="pl-8 rounded-none border-2 border-amber-300 focus:border-amber-500 font-bold text-primary h-11 bg-white text-sm uppercase tracking-widest" placeholder="PAN Number (e.g. ABCDE1234F)" maxLength={10} />
                          </div>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 w-3.5 h-3.5 text-amber-600" />
                            <textarea value={donorAddress} onChange={e => setDonorAddress(e.target.value)} className="w-full pl-8 pr-3 py-2.5 border-2 border-amber-300 focus:border-amber-500 font-bold text-primary bg-white text-sm resize-none rounded-none outline-none" placeholder="Full Address (House/Street/Area)" rows={2} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600" /><Input type="text" value={donorCity} onChange={e => setDonorCity(e.target.value)} className="pl-8 rounded-none border-2 border-amber-300 focus:border-amber-500 font-bold text-primary h-11 bg-white text-sm" placeholder="City" /></div>
                            <Input type="text" value={donorState} onChange={e => setDonorState(e.target.value)} className="rounded-none border-2 border-amber-300 focus:border-amber-500 font-bold text-primary h-11 bg-white text-sm" placeholder="State" />
                          </div>
                          <Input type="text" value={donorPincode} onChange={e => setDonorPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="rounded-none border-2 border-amber-300 focus:border-amber-500 font-bold text-primary h-11 bg-white text-sm" placeholder="PIN Code (6 digits)" maxLength={6} />
                          <p className="text-[9px] text-amber-700 bg-amber-100 p-2 border border-amber-200">Your 80G receipt (PDF) will be auto-downloaded immediately after successful payment.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div onClick={() => { setIsAnon(!isAnon); if (!isAnon) setWant80G(false); }} className={`w-4 h-4 border-2 flex items-center justify-center transition-all ${isAnon ? "border-primary bg-primary" : "border-gray-300 group-hover:border-primary"}`}>
                      {isAnon && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Donate Anonymously</span>
                  </label>

                  {lastReceipt && (
                    <Button variant="outline" onClick={async () => { setGeneratingPdf(true); await generate80GReceipt(lastReceipt); setGeneratingPdf(false); }} disabled={generatingPdf} className="w-full rounded-none border-2 border-amber-300 text-amber-700 font-black uppercase tracking-widest text-xs h-11">
                      {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-3.5 h-3.5 mr-2" /> Re-download 80G Receipt</>}
                    </Button>
                  )}

                  <Button onClick={handleDonate} disabled={donating || !amount || Number(amount) < 1} className="w-full bg-primary hover:bg-black text-white font-black uppercase tracking-[0.3em] rounded-none py-6 text-sm gold-edge">
                    {donating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Heart className="w-4 h-4 mr-2" /> Donate ₹{Number(amount) > 0 ? Number(amount).toLocaleString() : ""}</>}
                  </Button>
                </div>
              </div>

              {/* Legal Credentials */}
              <div className="bg-white shadow-sm p-5 space-y-3">
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2 border-b border-gray-100 pb-3"><ShieldCheck className="w-3.5 h-3.5 text-accent" /> Legal Registrations</h3>
                <div className="space-y-2">
                  {[
                    { Icon: Scroll,    label: "80G Tax Exemption", value: "AAGTA9354BF20261", sub: "AY 2026-27 to 2028-29", color: "text-amber-600" },
                    { Icon: Landmark,  label: "12A IT Exemption", value: "AAGTA9354BE2025101", sub: "Income Tax Act 1961", color: "text-blue-600" },
                    { Icon: Handshake, label: "CSR-1 Registered", value: "CSR00108803", sub: "Ministry of Corporate Affairs", color: "text-green-600" },
                    { Icon: Flag,      label: "NGO Darpan ID", value: "GJ/2021/0276308", sub: "NITI Aayog, Govt. of India", color: "text-purple-600" },
                  ].map(c => (
                    <div key={c.label} className="flex items-start gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                      <c.Icon className={`w-4 h-4 leading-none mt-0.5 shrink-0 ${c.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${c.color}`}>{c.label}</p>
                        <p className="text-[11px] font-black text-primary tracking-wider truncate">{c.value}</p>
                        <p className="text-[9px] text-gray-400">{c.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Transfer */}
              <div className="bg-white shadow-sm p-6 space-y-3">
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-accent" /> Bank Transfer (80G)</h3>
                <div className="space-y-2 text-[11px] text-gray-500 font-bold">
                  <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="text-primary">AZMI FOUNDATION</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">A/C No.</span><span className="text-primary">921020009805552</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">IFSC</span><span className="text-primary">UTIB0000453</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Bank</span><span className="text-primary">Axis Bank, Relief Road</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Campaigns */}
      {relatedCampaigns.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Related Campaigns</h2>
              <Link href="/campaigns"><span className="text-xs text-accent font-black uppercase tracking-widest hover:underline cursor-pointer">View All →</span></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedCampaigns.map((c) => {
                const pct = Math.min(100, Math.round((Number(c.currentAmount) / Number(c.targetAmount)) * 100));
                return (
                  <Link key={c.id} href={`/campaigns/${c.id}`}>
                    <div className="bg-white shadow-sm hover:shadow-lg transition-shadow cursor-pointer group">
                      <div className="aspect-video overflow-hidden">
                        <img src={c.imageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80"} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-5 space-y-3">
                        <h3 className="font-black text-primary text-sm uppercase tracking-tight line-clamp-2 group-hover:text-accent transition-colors">{c.title}</h3>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <span>₹{Number(c.currentAmount).toLocaleString()} raised</span>
                          <span className="text-accent">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
