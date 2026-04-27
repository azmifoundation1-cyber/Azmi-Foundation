import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Share2, Users, CheckCircle, ShieldCheck,
  ChevronRight, Loader2, ArrowLeft, Copy, Check,
  Clock, Bell, Calendar, Facebook, Twitter, Instagram, FileText, Download, IndianRupee, Phone, MapPin, Building2, Hash,
  AlertTriangle, Lock, Shield
} from "lucide-react";
import type { Campaign, Donation, CampaignUpdate } from "@shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generate80GReceipt, type ReceiptData } from "@/lib/generate-80g-receipt";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function extractYoutubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

const PRESET_AMOUNTS_MAP: Record<number, number[]> = {
  3: [680, 1360, 3400, 6800],
  4: [500, 3500, 5000, 10000],
  5: [500, 1000, 2500, 5000],
  6: [100, 300, 1000, 2500],
};

const PRESET_LABELS_MAP: Record<number, string[]> = {
  3: ["1 family's groceries", "2 families' groceries", "5 families' groceries", "10 families' groceries"],
  4: ["1 physio session", "Week of medicines", "Home nurse visit", "1 month physio"],
  5: ["1 day's medicines", "Week of stoma bags", "Month of medicines", "Reversal surgery fund"],
  6: ["Basic clothing support", "Child's proper wear", "Family clothes kit", "Support 5 families"],
};

const DEFAULT_PRESET_LABELS = ["Small help", "Medium support", "Big impact", "Life changer"];

const PAYMENT_ICONS = [
  { name: "GPay", color: "#4285F4", label: "G" },
  { name: "PhonePe", color: "#5f259f", label: "₱" },
  { name: "Paytm", color: "#00b9f1", label: "P" },
  { name: "UPI", color: "#F97316", label: "U" },
  { name: "BHIM", color: "#0f3cc9", label: "B" },
];

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
      "Dr. Shahbaaz Azmi leads our field operations personally, ensuring complete transparency in how every donation is utilized. Together, we can ensure clean water reaches every corner of Gujarat."
    ],
    images: [
      "https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80"
    ],
  },
  2: {
    story: [
      "Education is the most powerful weapon we can give a child. At AZMI Foundation, we believe no child should be denied the right to learn due to poverty. Since 2018, we have been sponsoring the education of underprivileged children across Ahmedabad.",
      "Our program covers school fees, books, uniforms, and stationery for children from families who cannot afford even the basics. We also provide after-school tutoring and mentorship, ensuring these children don't just attend school — they thrive.",
      "Over the past year alone, we have supported more than 300 children across 12 schools in Gomtipur and surrounding areas. Many of our early recipients have gone on to secondary education and vocational training, breaking the cycle of poverty for their entire families.",
      "By donating to this campaign, you are directly sponsoring a child's future. Every ₹1,000 covers one month of a child's complete educational needs. Your generosity today shapes tomorrow's leaders."
    ],
    images: [
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80"
    ],
  },
  3: {
    localVideo: "/shahbaaz-video.mp4",
    story: [
      "For 18 years, Dr. Shahbaaz Azmi's father fed the forgotten — the homeless, the hungry, the abandoned. He fed over 2 lakh people using his own savings, sitting down to share meals with strangers on the roadside. Serving the poor was not charity for him. It was his religion.",
      "Today, this selfless man lies in critical condition — heart failure, kidney failure, and a brain haemorrhage. He cannot eat or move without assistance. His son, Dr. Shahbaaz, is now fighting alone to save his father's life while keeping this 18-year legacy alive. His clinic is shut. His savings are gone. The medical bills keep rising.",
      "Yet every single day, Dr. Shahbaaz ensures 2,000 people are fed. He reaches slum families and footpath dwellers who have no other food source. For them, this is not charity — it is survival. If we stop, they go hungry.",
      "846 families in Ahmedabad need groceries right now. Just ₹680 provides one complete grocery kit for a family. Please help us carry this legacy forward — before it is too late."
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
  4: {
    story: [
      "My name is Alqma, and I'm writing this with a heavy, shattered heart — tears blurring my vision as I beg the world to help save my father, my hero, Anwar (49 years old). Papa was our entire world: the strong, smiling man who woke at dawn every day for his car repair work, sweating through long hours to give us everything — my studies, our home, my mother's gentle smiles, my little siblings' innocent dreams. He'd wrap me in his arms and say, \"Beta, Papa is always here. No matter what, I won't let anything happen to you.\" He was our shield. Our provider. Our everything.",
      "Then came the nightmare no one saw coming — a horrific accident that crushed his skull and stole his strength. Severe traumatic brain injury: blood flooding his brain, fractures everywhere, unbearable suffering. Doctors at Meera Hospital rushed him into emergency care, warning that immediate craniotomy (brain surgery) was critical. He battled in the ICU, machines keeping him alive, while we watched in helpless agony — praying every second, promising God anything, just to hear his voice once more.",
      "We poured in every last rupee — our savings wiped out, relatives drained dry, jewellery sold. The hospital handed us an official estimate: approximately ₹1 crore 5 lakh (₹1.05 crore) for full treatment — craniotomy, extended ICU days, daily medicines, repeated CT/MRI scans, and ongoing recovery. That number felt like a death sentence. With broken hearts and no money left, we had no choice but to discharge Papa and bring him home on basic care — because staying longer would have meant abandoning him to fate. We carried him home, praying every step of the way.",
      "Now he's here, in the same room where he used to laugh and play with us — but he's a shadow of himself. He struggles to speak even a word. His body barely moves. His eyes look straight into mine with silent pain, as if begging, \"Beta, please don't give up on me.\" Doctors insist that for any real chance at recovery, Papa needs urgent continuous home care: daily specialised physiotherapy (₹500–₹3,000/session), trained nurse visits, powerful brain medicines, and follow-up scans. Without this, his condition could worsen at any moment.",
      "Papa saved us from every hardship life threw at us. Now I'm on my knees, alone and desperate, pleading for a miracle. Your compassion could be the light that brings my father back — lets him call my name again, walk to embrace his family, smile like the hero he is. Even ₹500 covers one full physiotherapy session. ₹3,500 funds a week of medicines. ₹5,000 pays for a home nurse visit. ₹10,000 gives Papa a full month of physiotherapy. Please donate whatever your heart can give — or simply share this story. Every rupee, every share, every dua keeps Papa fighting. 🤲❤️",
    ],
    images: [
      "",
      "",
      "/anwar-icu-bed.jpeg",
      "/anwar-head-bandage.jpeg",
      "/anwar-before-work.jpeg",
      "/anwar-before-formal.jpeg",
    ],
    localVideo: "/anwar-video.mp4",
  },
  5: {
    story: [
      "My name is Harsh Shrimali. For as long as I can remember, the sound of my childhood was the sound of my father, Nanak Shrimali, and my mother, Hansaben, preparing for their shifts. They weren't doctors, engineers, or wealthy businessmen. They were Security Guards.",
      "It happened without warning. A few weeks ago, my father complained of a sharp, biting pain in his stomach. By midnight, he was screaming in agony. The doctors' words felt like a physical blow: his appendix had burst inside him — Appendicular Lump with Perforation, a life-threatening emergency. He was immediately taken into surgery for an Exploratory Laparotomy.",
      "To save my father, the surgeons had to perform a Double Barrel Ileostomy — they brought a loop of his small intestine through an opening in his abdomen. My strong, proud father now lives with his intestines outside his body. He cannot walk without help. He cannot even sit up to eat without wincing in pain.",
      "We are buried under a debt of ₹7,00,000 (7 Lakhs). My father was our primary provider. My mother had to quit her job because my father requires 24-hour nursing care. Overnight, our family's income went from two salaries to zero. I am 18 years old, and I am now the sole earner for a family of six, earning ₹12,000 a month — with ₹9,500 in rent alone.",
      "My father spent his life protecting people he didn't even know. He stood guard at gates so that others could feel safe. Now, he is the one who is unprotected. Please be the guardian for the man who was a guardian for everyone else. Your donation, no matter how small, is a brick in the wall that protects my family from homelessness.",
    ],
    images: [
      "/harsh-hospital.jpeg",
      "/harsh-hospital.jpeg",
    ],
  },
  6: {
    youtubeId: "TCf1jndVZGA",
    story: [
      "Not everyone has the privilege of choosing what to wear. For many families in our city, clothing is not about fashion — it is about survival, dignity, and basic human respect.",
      "We meet children wearing the same torn clothes every day. We meet mothers who hesitate to step outside because they don't have proper clothes. We meet fathers working in extreme heat, wearing worn-out, damaged garments that barely protect them. This is not just poverty. This is a loss of dignity.",
      "At Azmi Foundation, we are starting a mission to provide clean, wearable clothes, basic daily outfits, and essential garments for men, women, and children. Because something as simple as a proper set of clothes can restore confidence, allow someone to work with dignity, and help a child go outside without shame.",
      "Somewhere today, someone is staying inside — not because they want to — but because they have nothing decent to wear. With your support, we can change that. 🙏 Join Azmi Foundation. Let's give not just clothes… but dignity.",
    ],
    images: [
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80",
      "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800&q=80",
    ],
  },
};

export default function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:id");
  const id = Number(params?.id);
  const PRESET_AMOUNTS = PRESET_AMOUNTS_MAP[id] || [500, 1000, 2500, 5000];
  const PRESET_LABELS = PRESET_LABELS_MAP[id] || DEFAULT_PRESET_LABELS;
  const [amount, setAmount] = useState(() => String(PRESET_AMOUNTS_MAP[id]?.[1] ?? 1000));
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [copied, setCopied] = useState(false);
  const [donating, setDonating] = useState(false);
  const [activeTab, setActiveTab] = useState<"story" | "updates" | "supporters" | "documents">("story");

  // 80G Receipt fields
  const [want80G, setWant80G] = useState(false);
  const [donorPan, setDonorPan] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [donorCity, setDonorCity] = useState("");
  const [donorState, setDonorState] = useState("");
  const [donorPincode, setDonorPincode] = useState("");
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(true);

  // Donation popup — appears 2s after page open, once per campaign visit
  const [showDonationPopup, setShowDonationPopup] = useState(false);
  const [popupAmount, setPopupAmount] = useState("");
  const [popupCustom, setPopupCustom] = useState(false);

  // Social proof donation ticker
  const FAKE_DONORS = [
    { name: "Mohd Arshad", amount: 500 }, { name: "Priya Sharma", amount: 1000 },
    { name: "Razia Begum", amount: 300 }, { name: "Suresh Kumar", amount: 2000 },
    { name: "Fatima Khan", amount: 500 }, { name: "Ramesh Patel", amount: 750 },
    { name: "Anjali Singh", amount: 1500 }, { name: "Ibrahim Shaikh", amount: 500 },
    { name: "Sunita Devi", amount: 300 }, { name: "Vikram Mehta", amount: 1000 },
    { name: "Noor Jahan", amount: 500 }, { name: "Deepak Verma", amount: 2500 },
    { name: "Salma Bano", amount: 400 }, { name: "Harish Gupta", amount: 1000 },
    { name: "Zainab Hussain", amount: 500 }, { name: "Kavita Yadav", amount: 600 },
    { name: "Abdul Rehman", amount: 1000 }, { name: "Meera Nair", amount: 800 },
    { name: "Irfan Ansari", amount: 300 }, { name: "Pooja Tiwari", amount: 500 },
    { name: "Tariq Siddiqui", amount: 2000 }, { name: "Anita Rawat", amount: 500 },
    { name: "Yusuf Patel", amount: 750 }, { name: "Rekha Pandey", amount: 1000 },
    { name: "Shaheen Mirza", amount: 500 }, { name: "Mukesh Joshi", amount: 300 },
  ];
  const [tickerIdx, setTickerIdx] = useState(() => Math.floor(Math.random() * 26));
  const [tickerVisible, setTickerVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIdx(i => (i + 1) % FAKE_DONORS.length);
        setTickerVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Show donation popup 2 seconds after page load
  useEffect(() => {
    const t = setTimeout(() => setShowDonationPopup(true), 2000);
    return () => clearTimeout(t);
  }, [id]);

  // Live countdown timer state
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

  const { data: campaignDocs = [] } = useQuery<any[]>({
    queryKey: ["/api/campaigns", id, "documents"],
    queryFn: () => fetch(`/api/campaigns/${id}/documents`).then(r => r.json()),
    enabled: !!id,
  });

  // ── Meta Pixel ViewContent — fires once when campaign data is first loaded ──
  useEffect(() => {
    if (!campaign?.id) return;
    try {
      (window as any).fbq?.("track", "ViewContent", {
        content_name: campaign.title,
        content_ids: [String(campaign.id)],
        content_type: "donation_campaign",
        currency: "INR",
        value: Number(campaign.targetAmount),
      });
      console.log("[MetaPixel] ViewContent fired for campaign", campaign.id);
    } catch (e) {
      console.error("[MetaPixel] ViewContent failed:", e);
    }
  }, [campaign?.id]);

  // Live countdown — ticks every second from campaign.endDate
  useEffect(() => {
    const tick = () => {
      // Fallback hardcoded date for campaign 3 if DB end_date isn't set yet
      const rawEnd = campaign?.endDate
        ? campaign.endDate
        : (id === 3 ? "2026-04-24T18:29:59.000Z" : (id === 4 ? "2026-05-18T23:59:59.000Z" : null));
      const endDate = rawEnd ? new Date(rawEnd).getTime() : null;
      if (!endDate) return;
      const diff = endDate - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds, expired: false });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [campaign?.endDate, id]);

  const handleDonate = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1) return;

    // ── Meta Pixel InitiateCheckout ──
    try {
      (window as any).fbq?.("track", "InitiateCheckout", {
        content_name: campaign?.title,
        content_ids: [String(id)],
        content_type: "donation_campaign",
        value: amt,
        currency: "INR",
        num_items: 1,
      });
      console.log("[MetaPixel] InitiateCheckout fired ₹" + amt);
    } catch (e) {
      console.error("[MetaPixel] InitiateCheckout failed:", e);
    }

    // Validate 80G fields if requested
    if (want80G && !isAnon) {
      if (!donorName.trim()) { toast({ title: "Name required for 80G receipt", variant: "destructive" }); return; }
      if (!donorPan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(donorPan.trim().toUpperCase())) {
        toast({ title: "Valid PAN required for 80G receipt", description: "Format: ABCDE1234F", variant: "destructive" }); return;
      }
      if (!donorPhone.trim() || !/^\d{10}$/.test(donorPhone.trim())) {
        toast({ title: "Valid 10-digit mobile number required for 80G receipt", variant: "destructive" }); return;
      }
      if (!donorAddress.trim()) { toast({ title: "Address required for 80G receipt", variant: "destructive" }); return; }
      if (!donorCity.trim()) { toast({ title: "City required for 80G receipt", variant: "destructive" }); return; }
      if (!donorState.trim()) { toast({ title: "State required for 80G receipt", variant: "destructive" }); return; }
      if (!donorPincode.trim() || !/^\d{6}$/.test(donorPincode.trim())) {
        toast({ title: "Valid 6-digit PIN code required for 80G receipt", variant: "destructive" }); return;
      }
    }

    setDonating(true);
    try {
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.body.appendChild(script);
        });
      }

      // Fetch Razorpay key
      const keyRes = await fetch("/api/razorpay/key");
      const { key } = await keyRes.json();

      // Create order
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, campaignId: id, donorName: isAnon ? "" : donorName }),
      });
      if (!orderRes.ok) throw new Error("Order creation failed");
      const { orderId, amount: orderAmount, currency } = await orderRes.json();

      // Open Razorpay checkout
      const rzp = new window.Razorpay({
        key,
        amount: orderAmount,
        currency,
        order_id: orderId,
        name: "AZMI Foundation",
        description: campaign?.title || "Donation",
        image: "/azmi-logo.png",
        prefill: {
          name: isAnon ? "" : donorName,
          email: isAnon ? "" : donorEmail,
          contact: isAnon ? "" : donorPhone,
        },
        theme: { color: "#1a1a2e" },
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
                donorPan: want80G ? donorPan.toUpperCase() : null,
                donorAddress: want80G ? donorAddress : null,
                donorCity: want80G ? donorCity : null,
                donorState: want80G ? donorState : null,
                donorPincode: want80G ? donorPincode : null,
              }),
            });
            if (!verifyRes.ok) throw new Error("Verification failed");
            const donationData = await verifyRes.json();

            // ── Meta Pixel Purchase event — fires only after server-confirmed payment ──
            const pixelPayload = {
              value: amt,
              currency: "INR",
              content_name: id === 4
                ? "Save Anwar Medical Emergency - 30 Days Campaign"
                : "Grocery Kits for 846 Families - 8 Days Campaign",
              content_type: "donation",
            };
            console.log("[MetaPixel] Attempting Purchase fire, fbq:", !!(window as any).fbq, pixelPayload);
            try {
              (window as any).fbq("track", "Purchase", pixelPayload);
              console.log("[MetaPixel] Purchase fired successfully", pixelPayload);
            } catch (pixelErr) {
              console.error("[MetaPixel] fbq call failed:", pixelErr);
            }
            if ((window as any).dataLayer) {
              (window as any).dataLayer.push({
                event: "purchase",
                ecommerce: { value: amt, currency: "INR" },
              });
            }

            // Build receipt data if 80G was requested
            if (want80G && !isAnon) {
              const receiptNo = `AF-${new Date().getFullYear()}-${String(donationData.id).padStart(5, "0")}`;
              const receipt: ReceiptData = {
                receiptNo,
                paymentId: response.razorpay_payment_id,
                donationDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
                donorName: donorName.trim(),
                donorPan: donorPan.trim().toUpperCase(),
                donorPhone: donorPhone.trim(),
                donorEmail: donorEmail.trim(),
                donorAddress: donorAddress.trim(),
                donorCity: donorCity.trim(),
                donorState: donorState.trim(),
                donorPincode: donorPincode.trim(),
                amount: amt,
                campaignTitle: campaign?.title || "General Donation",
                paymentMethod: "Razorpay",
              };
              setLastReceipt(receipt);
              // Auto-download
              setGeneratingPdf(true);
              await generate80GReceipt(receipt);
              setGeneratingPdf(false);
            }

            toast({
              title: "Donation Successful! 🎉",
              description: want80G && !isAnon
                ? "Your 80G receipt has been downloaded automatically."
                : "Thank you for your generous support.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/donations/campaign", id] });
            queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id] });
            queryClient.invalidateQueries({ queryKey: ["/api/campaigns/featured"] });
            setDonating(false);
            setDonorName(""); setDonorEmail(""); setDonorPhone(""); setAmount("1000");
          } catch (err) {
            console.error("[Payment] Verification/handler error:", err);
            toast({ title: "Payment recorded but verification pending.", description: "Our team will confirm your donation soon.", variant: "destructive" });
            setDonating(false);
          }
        },
        modal: {
          ondismiss: () => setDonating(false),
        },
      });
      rzp.open();
    } catch (err) {
      console.error("[Payment] Error:", err);
      setPaymentFailed(true);
      toast({ title: "Payment could not open", description: "Use UPI or WhatsApp below to complete your donation.", variant: "destructive" });
      setDonating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = campaign?.title ?? "Azmi Foundation Campaign";
  const shareText = `🙏 Help us support: "${shareTitle}". Every rupee counts — donate now and change lives!`;

  const handleWhatsAppDonate = () => {
    const amt = Number(amount) || PRESET_AMOUNTS[1];
    const msg = `🙏 Main "${campaign?.title}" campaign mein ₹${amt.toLocaleString("en-IN")} donate karna chahta/chahti hoon. Kripya confirm karein:\n${shareUrl}`;
    window.open(`https://wa.me/917861010850?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleWhatsAppStatus = () => {
    const text = encodeURIComponent(`${shareText}\n👉 ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleFacebookStory = () => {
    window.open(`https://www.facebook.com/dialog/share?app_id=&href=${encodeURIComponent(shareUrl)}&display=popup`, "_blank");
  };

  const handleInstagramShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInstagramStory = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: `Add to your story: ${shareText}`, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`I just supported "${shareTitle}" by Azmi Foundation. Join me in making a difference!`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, "_blank");
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

  const percent = Math.min(100, Math.round((Number(campaign.currentAmount) / Number(campaign.targetAmount)) * 100));
  const hardcodedStory = CAMPAIGN_STORIES[id];
  const dbGallery: string[] = (campaign as any).galleryImages || [];
  const dbLocalVideo: string | undefined = (campaign as any).localVideoUrl || undefined;
  const story = hardcodedStory || {
    story: campaign.story
      ? campaign.story
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
          .split(/\n\n+/)
          .map(s => s.replace(/^\n+|\n+$/g, ""))
          .filter(Boolean)
      : [campaign.description || ""],
    images: [campaign.imageUrl || "", ...dbGallery].filter(Boolean),
    localVideo: dbLocalVideo,
  };
  const relatedCampaigns = allCampaigns.filter(c => c.id !== campaign.id && c.category === campaign.category).slice(0, 3);

  const daysLeft = campaign.endDate
    ? Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans pb-20 lg:pb-0">
      <Navbar />


      {/* URGENT BANNER — campaigns with urgencyLabel or hardcoded 3/4 */}
      {(id === 3 || id === 4 || !!(campaign as any).urgencyLabel) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden glass-panel-neon glass-shimmer py-2 px-3"
          style={{
            background: "linear-gradient(135deg, rgba(4,0,15,0.97) 0%, rgba(12,0,28,0.96) 40%, rgba(6,0,20,0.97) 100%)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            borderTop: "none",
            borderBottom: "1px solid rgba(200,200,215,0.25)",
          }}
        >
          {/* Orb – silver left */}
          <div className="glass-orb-1 absolute pointer-events-none" style={{ top: "-20px", left: "-10px", width: "80px", height: "80px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200,200,220,0.35) 0%, transparent 70%)", filter: "blur(14px)" }} />
          {/* Orb – platinum right */}
          <div className="glass-orb-2 absolute pointer-events-none" style={{ top: "-15px", right: "-10px", width: "70px", height: "70px", borderRadius: "50%", background: "radial-gradient(circle, rgba(210,210,225,0.25) 0%, transparent 70%)", filter: "blur(12px)" }} />

          <div className="relative max-w-7xl mx-auto space-y-1.5 px-1">
            {/* Row 1: Headline + CTA */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5">
                <AlertTriangle
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: "#d4af37", filter: "drop-shadow(0 0 5px rgba(212,175,55,0.9))" }}
                />
                <span
                  className="font-black uppercase text-[11px] leading-none"
                  style={{
                    color: "#d4af37",
                    textShadow: "0 0 6px rgba(212,175,55,0.95), 0 0 14px rgba(212,175,55,0.55), 0 0 28px rgba(212,175,55,0.25)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {(campaign as any).urgencyLabel || (id === 4 ? "Help Anwar Recover — Father Needs Daily Care" : "846 Families Need Your Help")}
                </span>
              </span>
            </div>

            {/* Row 2: "Time Remaining" + countdown */}
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-bold uppercase tracking-widest shrink-0"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Time Remaining:
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { value: countdown.days,    label: "Days" },
                  { value: countdown.hours,   label: "Hrs" },
                  { value: countdown.minutes, label: "Min" },
                  { value: countdown.seconds, label: "Sec" },
                ].map(({ value, label }, i) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div
                      className="flex flex-col items-center px-2 py-0.5 min-w-[32px]"
                      style={{
                        borderRadius: "5px",
                        border: "1px solid rgba(200,200,215,0.25)",
                        background: "rgba(200,200,215,0.06)",
                        boxShadow: "0 0 6px rgba(200,200,215,0.12)",
                      }}
                    >
                      <span
                        className="text-[15px] font-black tabular-nums leading-none"
                        style={{
                          color: "#fff",
                          textShadow: "0 0 8px rgba(255,255,255,0.3)",
                        }}
                      >
                        {String(value).padStart(2, "0")}
                      </span>
                      <span
                        className="text-[7px] font-semibold uppercase tracking-wider mt-0.5"
                        style={{ color: "rgba(200,200,215,0.6)" }}
                      >
                        {label}
                      </span>
                    </div>
                    {i < 3 && (
                      <span
                        className="text-xs font-black pb-2"
                        style={{ color: "rgba(200,200,215,0.4)" }}
                      >
                        :
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-12 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-8">


            {/* Campaign Title */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Link href="/campaigns" className="inline-flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest mb-2 hover:text-primary transition-colors">
                <ArrowLeft className="w-3 h-3" /> All Campaigns
              </Link>
              <h1 className="text-lg sm:text-3xl font-black leading-tight tracking-tight text-primary">
                {campaign.title}
              </h1>
            </motion.div>

            {/* Hero — YouTube thumbnail (tap-to-open) or local video or image */}
            {(() => {
              const HARDCODED_YOUTUBE: Record<number, string> = { 3: "Z_exh7zMqDs", 6: "TCf1jndVZGA" };
              const YOUTUBE_START: Record<number, number> = { 3: 17, 6: 17 };
              const hardcodedYoutubeId = HARDCODED_YOUTUBE[id] ?? null;
              const dbYoutubeId = extractYoutubeId(campaign.videoUrl);
              const youtubeId = hardcodedYoutubeId || dbYoutubeId;
              const heroLocalVideo = hardcodedYoutubeId ? null : story.localVideo;
              const youtubeStartTime = YOUTUBE_START[id] ?? 0;
              const youtubeLink = youtubeId
                ? `https://www.youtube.com/watch?v=${youtubeId}${youtubeStartTime ? `&t=${youtubeStartTime}` : ""}`
                : null;
              const youtubeThumbnail = youtubeId
                ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
                : null;
              return (
                <div className="relative rounded-none overflow-hidden aspect-video bg-gray-900">
                  {youtubeId ? (
                    videoPlaying ? (
                      /* Inline autoplay iframe — shown after tap */
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1${youtubeStartTime ? `&start=${youtubeStartTime}` : ""}`}
                        title={campaign.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    ) : (
                      /* Thumbnail with play button — instant load, tap to play inline */
                      <button
                        onClick={() => setVideoPlaying(true)}
                        className="block w-full h-full relative group"
                        aria-label="Play campaign video"
                        style={{ background: "#000", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        <img
                          src={youtubeThumbnail!}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                          loading="eager"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                          }}
                        />
                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-black/25 group-active:bg-black/40 transition-colors" />
                        {/* Play button */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-active:scale-95 group-hover:scale-105"
                            style={{ background: "rgba(220,38,38,0.95)", boxShadow: "0 0 0 6px rgba(255,255,255,0.2), 0 4px 28px rgba(0,0,0,0.6)" }}
                          >
                            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                          <span className="text-white text-xs font-bold tracking-widest uppercase" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
                            ▶ Play Video
                          </span>
                        </div>
                        {/* YouTube badge */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 rounded px-2 py-1">
                          <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          <span className="text-white text-[9px] font-bold tracking-wider">YouTube</span>
                        </div>
                      </button>
                    )
                  
                  ) : heroLocalVideo ? (
                    <video
                      src={heroLocalVideo}
                      playsInline controls
                      preload="none"
                      className="w-full h-full object-contain"
                      poster={story.images?.[0] || campaign.imageUrl || ""}
                    >
                      <source src={heroLocalVideo} type="video/mp4" />
                    </video>
                  ) : (
                    <>
                      <img
                        src={story.images?.[0] || campaign.imageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80"}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                        loading="eager"
                        onError={(e) => { (e.target as HTMLImageElement).src = campaign.imageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80"; }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/80 to-transparent p-6">
                        <div className="flex items-center gap-2">
                          <span className="bg-accent text-white text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1">
                            Active Campaign
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Trust strip — visible immediately below video, no scroll needed */}
            <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 py-2 px-3 bg-green-50 border border-green-100 rounded-lg">
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Registered NGO
              </span>
              <span className="text-green-300 text-xs">|</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                80G Tax Benefit
              </span>
              <span className="text-green-300 text-xs">|</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
                Razorpay Secured
              </span>
              <span className="text-green-300 text-xs">|</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
                1000+ Families Helped
              </span>
            </div>

            {/* Urgency text — shown for all campaigns */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-xs sm:text-sm text-gray-700 leading-relaxed border-l-4 border-red-500 pl-3 bg-red-50 py-2 pr-3"
            >
              {id === 4 ? (
                <>
                  Anwar needs <strong>Rs. 50,000–2 lakh every month</strong> for physiotherapy, medicines and home nursing. Family savings exhausted after <strong>Rs. 1.05 crore</strong> hospital bill. His daughter Alqama is begging for one more chance.{" "}
                  <span className="text-red-600 font-bold">Time is running out.</span>
                </>
              ) : id === 3 ? (
                <>
                  We need <strong>₹5,75,280</strong> to provide groceries to <strong>846 poor families</strong> in Ahmedabad. Dr. Shahbaaz is fighting serious illness but still feeding 2000+ people daily. His father's 18-year legacy is at risk.{" "}
                  <span className="text-red-600 font-bold">Time is running out.</span>
                </>
              ) : (
                <>
                  {campaign.description}{" "}
                  {campaign.endDate && <span className="text-red-600 font-bold">Time is running out.</span>}
                </>
              )}
            </motion.p>

            {/* ── INLINE DONATION PANEL (all devices) ── */}
            {(true) && (
              <motion.div
                id="mobile-donate"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="relative overflow-hidden glass-panel-neon glass-shimmer lg:max-w-3xl lg:mx-auto"
                style={{
                  background: "linear-gradient(135deg, rgba(4,0,15,0.97) 0%, rgba(12,0,28,0.96) 40%, rgba(6,0,20,0.97) 100%)",
                  backdropFilter: "blur(32px)",
                  WebkitBackdropFilter: "blur(32px)",
                  border: "1px solid rgba(200,200,215,0.3)",
                  borderRadius: "16px",
                  padding: "14px",
                }}
              >
                {/* ── Dynamic floating aurora orbs ── */}
                {/* Orb 1: Silver – top-left */}
                <div className="glass-orb-1 absolute pointer-events-none" style={{ top: "-30px", left: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200,200,220,0.4) 0%, rgba(150,150,170,0.12) 50%, transparent 70%)", filter: "blur(18px)" }} />
                {/* Orb 2: Platinum – top-right */}
                <div className="glass-orb-2 absolute pointer-events-none" style={{ top: "-20px", right: "-15px", width: "100px", height: "100px", borderRadius: "50%", background: "radial-gradient(circle, rgba(210,210,225,0.3) 0%, rgba(170,170,190,0.1) 50%, transparent 70%)", filter: "blur(16px)" }} />
                {/* Orb 3: Gunmetal – center */}
                <div className="glass-orb-3 absolute pointer-events-none" style={{ top: "40%", left: "30%", width: "140px", height: "80px", borderRadius: "50%", background: "radial-gradient(circle, rgba(160,160,180,0.15) 0%, transparent 70%)", filter: "blur(20px)" }} />
                {/* Orb 4: Silver – bottom-right */}
                <div className="glass-orb-1 absolute pointer-events-none" style={{ bottom: "-25px", right: "-10px", width: "110px", height: "110px", borderRadius: "50%", background: "radial-gradient(circle, rgba(190,190,210,0.3) 0%, rgba(140,140,160,0.1) 50%, transparent 70%)", filter: "blur(18px)", animationDelay: "3.5s" }} />
                {/* Orb 5: Cool grey – bottom-left */}
                <div className="glass-orb-2 absolute pointer-events-none" style={{ bottom: "10%", left: "-10px", width: "80px", height: "80px", borderRadius: "50%", background: "radial-gradient(circle, rgba(180,180,200,0.18) 0%, transparent 70%)", filter: "blur(14px)", animationDelay: "2s" }} />
                {/* Glass surface highlight line */}
                <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.2) 30%, rgba(220,220,235,0.15) 60%, transparent 95%)" }} />
                {/* Bottom depth line */}
                <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent 10%, rgba(200,200,215,0.25) 50%, transparent 90%)" }} />

                <div className="relative space-y-3">
                {/* Progress summary */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-black tracking-tighter" style={{ color: "#fff", textShadow: "0 0 16px rgba(220,220,235,0.5)" }}>
                      ₹{Number(campaign.currentAmount).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>
                      of ₹{Number(campaign.targetAmount).toLocaleString("en-IN")} goal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black tabular-nums" style={{ color: "#dc2626", textShadow: "0 0 10px rgba(220,38,38,0.7), 0 0 20px rgba(220,38,38,0.3)" }}>
                      {countdown.expired ? "Ended" : `${String(countdown.days).padStart(2,"0")}d ${String(countdown.hours).padStart(2,"0")}h left`}
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "#dc2626", textShadow: "0 0 8px rgba(220,38,38,0.5)" }}>{supporters.length} Supporters</p>
                  </div>
                </div>

                {/* Urgency line above progress bar */}
                <p className="text-[11px] font-semibold leading-snug" style={{ color: "#b91c1c", textShadow: "0 0 8px rgba(185,28,28,0.5)" }}>
                  {id === 4
                    ? "Anwar needs daily physio, medicines & nursing. Without your help, his recovery may never happen."
                    : id === 3
                      ? "Sirf 7 din bache hain… 846 families ko groceries chahiye. Aapki madad se possible hai."
                      : ((campaign as any).urgencyLabel || campaign.description)
                  }
                </p>

                {/* Neon progress bar */}
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", boxShadow: "inset 0 0 4px rgba(0,0,0,0.5)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${percent}%`,
                      background: "linear-gradient(90deg, #333340, #888899, #c0c0d0, #e8e8f0)",
                      boxShadow: "0 0 10px rgba(200,200,220,0.8), 0 0 20px rgba(200,200,220,0.4), 0 0 35px rgba(180,180,200,0.2)",
                    }}
                  />
                </div>

                {/* Quick-select amounts — 2 cols */}
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_AMOUNTS.map(a => {
                    const sel = amount === String(a);
                    return (
                      <button
                        key={a}
                        onClick={() => setAmount(String(a))}
                        className="py-1.5 px-2 font-black text-left transition-all duration-300"
                        style={{
                          borderRadius: "10px",
                          border: sel ? "1px solid rgba(220,220,235,0.7)" : "1px solid rgba(255,255,255,0.1)",
                          background: sel
                            ? "linear-gradient(135deg, rgba(60,60,75,0.9) 0%, rgba(35,35,50,0.95) 60%, rgba(50,50,65,0.9) 100%)"
                            : "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                          backdropFilter: "blur(12px)",
                          WebkitBackdropFilter: "blur(12px)",
                          boxShadow: sel
                            ? "0 0 18px rgba(200,200,220,0.5), 0 0 40px rgba(180,180,205,0.2), inset 0 1px 0 rgba(255,255,255,0.15)"
                            : "inset 0 1px 0 rgba(255,255,255,0.07)",
                          color: sel ? "#fff" : "rgba(255,255,255,0.75)",
                          transform: sel ? "scale(1.02)" : "scale(1)",
                        }}
                      >
                        <span className="block text-xs" style={{ textShadow: sel ? "0 0 8px rgba(220,220,235,0.7)" : "none" }}>₹{a.toLocaleString("en-IN")}</span>
                        <span className="block text-[9px] font-medium" style={{ color: sel ? "rgba(210,210,230,0.85)" : "rgba(255,255,255,0.35)" }}>
                          {PRESET_LABELS[PRESET_AMOUNTS.indexOf(a)] ?? ""}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom amount */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-xs" style={{ color: "rgba(200,200,215,0.7)" }}>₹</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="pl-6 font-bold h-8 text-sm outline-none"
                    placeholder="Enter custom amount"
                    min="1"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                      color: "#fff",
                      backdropFilter: "blur(8px)",
                    }}
                  />
                </div>

                {/* ── Donation social proof ticker ── */}
                <div
                  className="flex items-center gap-3 px-3 py-2.5 overflow-hidden"
                  style={{
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(30,0,0,0.9) 0%, rgba(60,0,0,0.85) 100%)",
                    border: "1px solid rgba(220,38,38,0.45)",
                    boxShadow: "0 0 16px rgba(220,38,38,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
                    minHeight: "48px",
                    transition: "opacity 0.35s ease, transform 0.35s ease",
                    opacity: tickerVisible ? 1 : 0,
                    transform: tickerVisible ? "translateY(0)" : "translateY(-6px)",
                  }}
                >
                  <Heart className="w-5 h-5 shrink-0" style={{ color: "#dc2626", filter: "drop-shadow(0 0 6px rgba(220,38,38,0.8))" }} />
                  <p className="text-[13px] font-black leading-tight" style={{ color: "#fff" }}>
                    <span className="uppercase tracking-wide">{FAKE_DONORS[tickerIdx].name}</span>
                    {" "}
                    <span className="font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>has donated</span>
                    {" "}
                    <span style={{ color: "#d4af37", textShadow: "0 0 8px rgba(212,175,55,0.6)" }}>₹{FAKE_DONORS[tickerIdx].amount.toLocaleString("en-IN")}</span>
                  </p>
                </div>

                {/* Razorpay trust badge — above donate button, matches reference style */}
                <div className="flex items-center justify-center gap-1.5 py-1.5">
                  <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Secured by</span>
                  {/* Razorpay lightning bolt icon */}
                  <svg width="14" height="14" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.667 2L6 18.667H16L13.333 30 26 13.333H16L18.667 2Z" fill="#3395FF"/>
                  </svg>
                  <span className="text-[13px] font-black tracking-tight" style={{ color: "#3395FF" }}>Razorpay</span>
                </div>

                {/* ── QUICK DONATE — visible immediately, no friction ── */}
                <div className="space-y-2">
                  <button
                    onClick={handleDonate}
                    disabled={donating || !amount || Number(amount) < 1}
                    className="w-full font-black uppercase tracking-[0.15em] text-base transition-all duration-200 disabled:opacity-50 active:scale-95"
                    style={{
                      padding: "16px 0",
                      borderRadius: "10px",
                      border: "1px solid rgba(220,220,235,0.5)",
                      background: "linear-gradient(135deg, #dc2626, #991b1b)",
                      color: "#fff",
                      boxShadow: "0 0 24px rgba(220,38,38,0.5), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                  >
                    {donating ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Heart className="w-5 h-5" />
                        Donate ₹{Number(amount || 0).toLocaleString("en-IN")} Now
                      </span>
                    )}
                  </button>

                  <button
                    onClick={handleWhatsAppDonate}
                    className="w-full font-black uppercase tracking-[0.1em] text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2.5"
                    style={{
                      padding: "12px 0",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #16a34a, #15803d)",
                      color: "#fff",
                      boxShadow: "0 0 16px rgba(22,163,74,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                    }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Donate via WhatsApp
                  </button>
                </div>

                {/* Razorpay Trusted Business badge — dark panel */}
                <div className="flex justify-center py-1">
                  <img
                    src="/razorpay-trusted.png"
                    alt="Razorpay Trusted Business"
                    className="h-10 w-auto object-contain"
                    style={{ filter: "brightness(0) invert(1) opacity(0.75)" }}
                  />
                </div>

                {/* Payment fallback — shown if Razorpay fails (in-app browser / network) */}
                <AnimatePresence>
                  {paymentFailed && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-2.5 p-3"
                      style={{ borderRadius: "10px", border: "1px solid rgba(251,191,36,0.5)", background: "rgba(251,191,36,0.08)" }}
                    >
                      <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#fbbf24" }}>
                        Payment couldn't open — try these instead:
                      </p>
                      {/* UPI copy */}
                      <button
                        onClick={() => { navigator.clipboard.writeText(upiId); setUpiCopied(true); setTimeout(() => setUpiCopied(false), 2000); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 font-bold text-xs transition-all active:scale-95"
                        style={{ borderRadius: "8px", border: "1px solid rgba(251,191,36,0.4)", background: "rgba(255,255,255,0.06)", color: "#fff" }}
                      >
                        <span>UPI: <span style={{ color: "#fbbf24" }}>{upiId}</span></span>
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest" style={{ color: upiCopied ? "#4ade80" : "rgba(255,255,255,0.5)" }}>
                          {upiCopied ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                        </span>
                      </button>
                      {/* WhatsApp donate */}
                      <button
                        onClick={handleWhatsAppDonate}
                        className="w-full flex items-center justify-center gap-2 py-2.5 font-black text-sm transition-all active:scale-95"
                        style={{ borderRadius: "8px", background: "#25D366", color: "#fff", boxShadow: "0 0 12px rgba(37,211,102,0.4)" }}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Donate via WhatsApp
                      </button>
                      <button onClick={() => setPaymentFailed(false)} className="w-full text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                        ↑ Try Razorpay again
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Optional details divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Optional details</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                </div>

                {/* Name */}
                <Input
                  type="text"
                  value={donorName}
                  onChange={e => setDonorName(e.target.value)}
                  className="font-bold h-9 outline-none"
                  placeholder={want80G ? "Full Name (as per PAN)" : "Your Name (optional)"}
                  disabled={isAnon}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#fff",
                    backdropFilter: "blur(8px)",
                  }}
                />

                {/* Email */}
                <Input
                  type="email"
                  value={donorEmail}
                  onChange={e => setDonorEmail(e.target.value)}
                  className="font-bold h-9 outline-none"
                  placeholder="Email (optional)"
                  disabled={isAnon}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#fff",
                    backdropFilter: "blur(8px)",
                  }}
                />

                {/* Phone */}
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
                  <Input
                    type="tel"
                    value={donorPhone}
                    onChange={e => setDonorPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="pl-8 font-bold h-9 outline-none"
                    placeholder={want80G ? "Mobile (mandatory for 80G)" : "Mobile (optional)"}
                    disabled={isAnon}
                    maxLength={10}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                      color: "#fff",
                      backdropFilter: "blur(8px)",
                    }}
                  />
                </div>

                {/* 80G Toggle */}
                {!isAnon && (
                  <div
                    onClick={() => setWant80G(!want80G)}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-300"
                    style={{
                      borderRadius: "8px",
                      border: want80G ? "1px solid rgba(251,191,36,0.7)" : "1px solid rgba(255,255,255,0.12)",
                      background: want80G ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.05)",
                      boxShadow: want80G ? "0 0 12px rgba(251,191,36,0.3)" : "none",
                    }}
                  >
                    <div
                      className="w-4 h-4 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        borderRadius: "4px",
                        border: want80G ? "2px solid #fbbf24" : "2px solid rgba(255,255,255,0.3)",
                        background: want80G ? "#fbbf24" : "transparent",
                        boxShadow: want80G ? "0 0 8px rgba(251,191,36,0.6)" : "none",
                      }}
                    >
                      {want80G && <Check className="w-2.5 h-2.5 text-black" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest" style={{ color: want80G ? "#fbbf24" : "rgba(255,255,255,0.7)", textShadow: want80G ? "0 0 8px rgba(251,191,36,0.6)" : "none" }}>
                        <IndianRupee className="w-3 h-3 inline mr-1" style={{ color: "#fbbf24" }} />
                        I want an 80G Tax Receipt
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Claim income tax deduction under Section 80G
                      </p>
                    </div>
                  </div>
                )}

                {/* 80G Fields */}
                <AnimatePresence>
                  {want80G && !isAnon && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 p-3" style={{ borderRadius: "8px", border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.06)" }}>
                        <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1" style={{ color: "#fbbf24" }}>
                          <FileText className="w-3 h-3" /> 80G Receipt Details — all fields required
                        </p>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
                          <Input
                            type="text"
                            value={donorPan}
                            onChange={e => setDonorPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                            className="pl-8 font-bold h-9 uppercase tracking-widest"
                            placeholder="PAN Number (e.g. ABCDE1234F)"
                            maxLength={10}
                            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "6px", color: "#fff" }}
                          />
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
                          <textarea
                            value={donorAddress}
                            onChange={e => setDonorAddress(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 font-bold text-sm resize-none outline-none"
                            placeholder="Full Address"
                            rows={2}
                            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "6px", color: "#fff" }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
                            <Input
                              type="text"
                              value={donorCity}
                              onChange={e => setDonorCity(e.target.value)}
                              className="pl-8 font-bold h-9"
                              placeholder="City"
                              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "6px", color: "#fff" }}
                            />
                          </div>
                          <Input
                            type="text"
                            value={donorState}
                            onChange={e => setDonorState(e.target.value)}
                            className="font-bold h-9"
                            placeholder="State"
                            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "6px", color: "#fff" }}
                          />
                        </div>
                        <Input
                          type="text"
                          value={donorPincode}
                          onChange={e => setDonorPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="font-bold h-9"
                          placeholder="PIN Code (6 digits)"
                          maxLength={6}
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: "6px", color: "#fff" }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Anonymous toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => { setIsAnon(!isAnon); if (!isAnon) setWant80G(false); }}
                    className="w-4 h-4 flex items-center justify-center transition-all"
                    style={{
                      borderRadius: "4px",
                      border: isAnon ? "2px solid rgba(210,210,225,0.8)" : "2px solid rgba(255,255,255,0.25)",
                      background: isAnon ? "rgba(160,160,180,0.5)" : "transparent",
                      boxShadow: isAnon ? "0 0 6px rgba(200,200,220,0.5)" : "none",
                    }}
                  >
                    {isAnon && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>Donate Anonymously</span>
                </label>

                {/* Donate button */}
                <button
                  onClick={handleDonate}
                  disabled={donating || !amount || Number(amount) < 1}
                  className="w-full font-black uppercase tracking-[0.2em] text-sm transition-all duration-200 disabled:opacity-50"
                  style={{
                    padding: "14px 0",
                    borderRadius: "8px",
                    border: "1px solid rgba(220,220,235,0.5)",
                    background: "linear-gradient(135deg, rgba(220,38,38,0.9), rgba(180,20,20,0.95))",
                    color: "#fff",
                    boxShadow: "0 0 20px rgba(200,200,220,0.4), 0 0 40px rgba(180,180,205,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
                    textShadow: "0 0 10px rgba(220,220,235,0.5)",
                  }}
                >
                  {donating ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Heart className="w-4 h-4" />
                      Donate ₹{Number(amount || 0).toLocaleString("en-IN")} Now
                    </span>
                  )}
                </button>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { icon: <CheckCircle className="w-3.5 h-3.5" style={{ color: "#d8d8e8", filter: "drop-shadow(0 0 5px rgba(220,220,235,0.9))" }} />, label: "80G Receipt", glow: "rgba(200,200,215,0.18)", border: "rgba(200,200,215,0.28)" },
                    { icon: <Lock className="w-3.5 h-3.5" style={{ color: "#d8d8e8", filter: "drop-shadow(0 0 5px rgba(220,220,235,0.9))" }} />, label: "Secure Pay", glow: "rgba(200,200,215,0.18)", border: "rgba(200,200,215,0.28)" },
                    { icon: <Shield className="w-3.5 h-3.5" style={{ color: "#d8d8e8", filter: "drop-shadow(0 0 5px rgba(220,220,235,0.9))" }} />, label: "Verified NGO", glow: "rgba(200,200,215,0.18)", border: "rgba(200,200,215,0.28)" },
                  ].map(b => (
                    <div
                      key={b.label}
                      className="badge-float flex flex-col items-center gap-1 py-2 px-1"
                      style={{
                        borderRadius: "8px",
                        border: `1px solid ${b.border}`,
                        background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                        backdropFilter: "blur(10px)",
                        boxShadow: `0 0 12px ${b.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
                      }}
                    >
                      {b.icon}
                      <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight" style={{ color: "rgba(255,255,255,0.55)" }}>{b.label}</span>
                    </div>
                  ))}
                </div>
                </div>
              </motion.div>
            )}

            {/* Share Section */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Share &amp; Spread the Word</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                {/* WhatsApp Chat */}
                <button onClick={handleWhatsAppShare} className="flex items-center gap-2 px-3 py-2 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span>WhatsApp Chat</span>
                </button>

                {/* WhatsApp Status */}
                <button onClick={handleWhatsAppStatus} className="flex items-center gap-2 px-3 py-2 bg-[#128C7E] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                  <span>WA Status</span>
                </button>

                {/* Facebook Post */}
                <button onClick={handleFacebookShare} className="flex items-center gap-2 px-3 py-2 bg-[#1877F2] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity">
                  <Facebook className="w-3.5 h-3.5 shrink-0" />
                  <span>FB Post</span>
                </button>

                {/* Facebook Story */}
                <button onClick={handleFacebookStory} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#1877F2] to-[#6a3de8] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity">
                  <Facebook className="w-3.5 h-3.5 shrink-0" />
                  <span>FB Story</span>
                </button>

                {/* Instagram Post */}
                <button onClick={handleInstagramShare} className="flex items-center gap-2 px-3 py-2 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
                  <Instagram className="w-3.5 h-3.5 shrink-0" />
                  <span>IG Post</span>
                </button>

                {/* Instagram Story */}
                <button onClick={handleInstagramStory} className="flex items-center gap-2 px-3 py-2 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)" }}>
                  <Instagram className="w-3.5 h-3.5 shrink-0" />
                  <span>IG Story</span>
                </button>

                {/* Twitter / X */}
                <button onClick={handleTwitterShare} className="flex items-center gap-2 px-3 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-80 transition-opacity">
                  <Twitter className="w-3.5 h-3.5 shrink-0" />
                  <span>Twitter / X</span>
                </button>

                {/* Copy Link */}
                <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 border-2 border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:border-primary hover:text-primary transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>

              </div>
            </div>

            {/* Tabs: Story / Updates / Supporters */}
            <div className="bg-white shadow-sm">
              {/* Tab Nav */}
              <div className="flex border-b border-gray-100">
                {(["story", "updates", "supporters", "documents"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {tab === "story" && "The Story"}
                    {tab === "updates" && `Updates ${updates.length > 0 ? `(${updates.length})` : ""}`}
                    {tab === "supporters" && `Supporters (${supporters.length})`}
                    {tab === "documents" && `Documents${(id === 4 || campaignDocs.length > 0) ? ` (${campaignDocs.length + (id === 4 ? 1 : 0)})` : ""}`}
                  </button>
                ))}
              </div>

              <div className="p-6 sm:p-10">
                {/* Story Tab */}
                {activeTab === "story" && (
                  <div className="space-y-8">
                    {story.story.map((para, i) => (
                      <div key={i} className="space-y-6">
                        <p className="text-gray-600 leading-relaxed text-sm sm:text-base" style={{ whiteSpace: "pre-wrap" }}>{para}</p>

                        {/* Video moved to top hero for campaign 3 — not shown here */}
                        {i === 0 && story.localVideo && id !== 3 && (
                          <div className="my-4 rounded-none overflow-hidden bg-black">
                            <video
                              src={story.localVideo}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full max-h-[560px] object-contain"
                              style={{ WebkitPlaysinline: true } as React.CSSProperties}
                            >
                              <source src={story.localVideo} type="video/mp4" />
                              Your browser does not support video playback.
                            </video>
                          </div>
                        )}

                        {i === 1 && story.youtubeId && !story.localVideo && (
                          <div className="my-8 aspect-video rounded-none overflow-hidden bg-black">
                            <iframe
                              src={`https://www.youtube.com/embed/${story.youtubeId}`}
                              title="Campaign Video"
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}

                        {story.images[i + 1] && i >= 1 && (
                          <div className="overflow-hidden aspect-video rounded-none">
                            <img
                              src={story.images[i + 1]}
                              alt={`Campaign image ${i + 2}`}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="pt-4 border-t border-gray-100">
                      <Link href={`/donate?campaignId=${campaign.id}`}>
                        <span className="text-accent font-black uppercase tracking-widest text-sm hover:underline cursor-pointer">
                          Click Here To Contribute →
                        </span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Updates Tab */}
                {activeTab === "updates" && (
                  <div className="space-y-6">
                    {updates.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <Bell className="w-10 h-10 text-gray-200 mx-auto" />
                        <p className="text-gray-400 text-sm font-medium">No updates yet — check back soon!</p>
                        <p className="text-gray-300 text-xs">The campaign team will post progress reports here.</p>
                      </div>
                    ) : (
                      updates.map((upd, i) => (
                        <div key={upd.id} className="border-l-2 border-accent pl-5 space-y-2 py-2">
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            <Calendar className="w-3 h-3" />
                            {new Date(upd.createdAt ?? "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          <h3 className="text-sm font-black text-primary uppercase tracking-tight">{upd.title}</h3>
                          <p className="text-gray-600 text-sm leading-relaxed">{upd.content}</p>
                          {upd.imageUrl && (
                            <img src={upd.imageUrl} alt={upd.title} className="w-full aspect-video object-cover mt-3" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Supporters Tab */}
                {activeTab === "supporters" && (
                  <div className="space-y-4">
                    {supporters.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400 text-sm font-medium">Be the first to support this cause!</p>
                      </div>
                    ) : (
                      <>
                        {supporters.slice(0, 10).map((s) => (
                          <div key={s.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                              {s.isAnonymous ? "A" : (s.donorName?.[0] || "A").toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-primary text-sm truncate">
                                {s.isAnonymous ? "Anonymous" : (s.donorName || "Anonymous")}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(s.createdAt ?? "").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                            <p className="text-accent font-black text-base shrink-0">₹{Number(s.amount).toLocaleString()}</p>
                          </div>
                        ))}
                        {supporters.length > 10 && (
                          <p className="text-center text-accent font-black text-sm uppercase tracking-widest pt-2">
                            +{supporters.length - 10} more supporters
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Documents Tab */}
                {activeTab === "documents" && (
                  <div className="space-y-6">
                    {/* Hardcoded hospital letter for campaign 4 */}
                    {id === 4 && (
                      <>
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 mb-1">Verified Medical Document</h3>
                          <h2 className="text-xl font-black text-primary uppercase tracking-tight">Official Hospital Estimation Letter</h2>
                          <p className="text-xs text-gray-400 mt-1">Issued by Meera Hospital, Alwar, Rajasthan — 27 November 2025</p>
                        </div>
                        <div className="border border-gray-100 rounded-none overflow-hidden shadow-sm">
                          <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-black text-primary uppercase tracking-wider">Meera Hospital — Estimation Letter</p>
                              <p className="text-[10px] text-gray-400">Patient: Anwar (49 yrs) · Total Estimate: ₹1,05,80,000</p>
                            </div>
                          </div>
                          <a href="/anwar-estimate-letter.jpeg" target="_blank" rel="noopener noreferrer" className="block group">
                            <img src="/anwar-estimate-letter.jpeg" alt="Hospital letter" className="w-full object-contain bg-white group-hover:opacity-95 transition-opacity" />
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-[10px] text-gray-500 font-medium">Tap to view full size</span>
                              <span className="text-[10px] font-black text-accent uppercase tracking-widest">Open Document →</span>
                            </div>
                          </a>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-none p-4 space-y-2">
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Expense Breakdown</p>
                          <div className="space-y-2 text-sm text-amber-900">
                            <div className="flex justify-between"><span>Emergency brain surgery (craniotomy, tracheostomy, ICU)</span><span className="font-black shrink-0 ml-4">₹45,00,000</span></div>
                            <div className="flex justify-between"><span>Medicines, nursing, physio &amp; rehabilitation (24 months)</span><span className="font-black shrink-0 ml-4">₹40,80,000</span></div>
                            <div className="flex justify-between"><span>Neuro-ICU stay (15–30 days), ventilator, CT/MRI scans</span><span className="font-black shrink-0 ml-4">₹15–20,00,000</span></div>
                            <div className="flex justify-between border-t border-amber-300 pt-2 mt-2">
                              <span className="font-black uppercase tracking-wide">Total Estimated Cost</span>
                              <span className="font-black text-red-700 shrink-0 ml-4">₹1,05,80,000</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Dynamic documents uploaded via admin panel */}
                    {campaignDocs.length > 0 && (
                      <div className="space-y-3">
                        {id === 4 && <p className="text-xs font-black uppercase tracking-widest text-primary/40">Additional Documents</p>}
                        {campaignDocs.map((doc: any) => (
                          <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 border border-gray-100 rounded-none hover:bg-gray-50 transition-colors group">
                            <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${doc.fileType === "image" ? "bg-purple-100 text-purple-600" : doc.fileType === "video" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                              {doc.fileType === "image" ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              ) : doc.fileType === "video" ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-primary uppercase tracking-wide line-clamp-1">{doc.name}</p>
                              <p className="text-[10px] text-gray-400 capitalize mt-0.5">{doc.fileType}</p>
                            </div>
                            <span className="text-[10px] font-black text-accent uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Open →</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {id !== 4 && campaignDocs.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-sm">No documents have been uploaded for this campaign yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (STICKY DONATION WIDGET) — hidden since inline panel handles all campaigns ── */}
          <div className="hidden">
            <div className="sticky top-24 space-y-4">

              {/* Verified Badge */}
              <div className="bg-primary text-white px-5 py-3 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest">Verified by AZMI Foundation</span>
                <ChevronRight className="w-4 h-4 ml-auto shrink-0" />
              </div>

              {/* Donation Widget */}
              <div className="bg-white shadow-sm p-6 space-y-5">
                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-black text-primary tracking-tighter">
                        ₹{Number(campaign.currentAmount).toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        of ₹{Number(campaign.targetAmount).toLocaleString()} goal
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-accent tracking-tighter">{percent}%</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Funded</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 overflow-hidden rounded-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="h-full bg-accent shadow-[0_0_8px_rgba(212,175,55,0.5)] rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      {supporters.length} Supporters
                    </div>
                    {daysLeft !== null && (
                      (id === 3 || id === 4) ? (
                        <div className="flex items-center gap-1 font-black text-red-500">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="tabular-nums text-xs">
                            {countdown.expired
                              ? "Ended"
                              : `${String(countdown.days).padStart(2,"0")}d ${String(countdown.hours).padStart(2,"0")}h ${String(countdown.minutes).padStart(2,"0")}m ${String(countdown.seconds).padStart(2,"0")}s`
                            }
                          </span>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-1.5 font-black ${daysLeft <= 3 ? "text-red-500" : "text-gray-400"}`}>
                          <Clock className="w-3 h-3" />
                          {daysLeft === 0 ? "Last day!" : `${daysLeft} days left`}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* IMPACT TABLE — campaigns 3 & 4 */}
                {(id === 3 || id === 4) && (
                  <div className="border border-red-100 bg-red-50 p-4 space-y-2">
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-3">Your Donation Impact</p>
                    {(id === 4 ? [
                      { amount: "₹500",    impact: "1 physiotherapy session" },
                      { amount: "₹3,500",  impact: "1 week of medicines" },
                      { amount: "₹5,000",  impact: "Home nurse visit" },
                      { amount: "₹10,000", impact: "1 full month of physio" },
                    ] : [
                      { amount: "₹680",   impact: "1 grocery kit for 1 family" },
                      { amount: "₹1,360", impact: "Grocery kits for 2 families" },
                      { amount: "₹3,400", impact: "Grocery kits for 5 families" },
                      { amount: "₹6,800", impact: "Grocery kits for 10 families" },
                    ]).map((row) => (
                      <div key={row.amount} className="flex items-center gap-3 py-1.5 border-b border-red-100 last:border-0">
                        <span className="text-sm font-black text-red-600 w-16 shrink-0">{row.amount}</span>
                        <span className="text-xs text-gray-700 font-medium">=&nbsp;{row.impact}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-5 space-y-4">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    Only INR donations accepted
                  </p>

                  {/* Amount Presets */}
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map(a => (
                      <button
                        key={a}
                        onClick={() => setAmount(String(a))}
                        className={`py-2 text-xs font-black uppercase tracking-wider border-2 transition-all duration-200 ${
                          amount === String(a)
                            ? "border-primary bg-primary text-white"
                            : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                        }`}
                      >
                        ₹{a.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
                    <Input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="pl-8 rounded-none border-2 border-gray-200 focus:border-primary font-bold text-primary h-12"
                      placeholder="Enter amount"
                      min="1"
                    />
                  </div>

                  {/* Donor Name */}
                  <Input
                    type="text"
                    value={donorName}
                    onChange={e => setDonorName(e.target.value)}
                    className="rounded-none border-2 border-gray-200 focus:border-primary font-bold text-primary h-12"
                    placeholder={want80G ? "Full Name (as per PAN card)" : "Your Name"}
                    disabled={isAnon}
                  />

                  {/* Email */}
                  <Input
                    type="email"
                    value={donorEmail}
                    onChange={e => setDonorEmail(e.target.value)}
                    className="rounded-none border-2 border-gray-200 focus:border-primary font-bold text-primary h-12"
                    placeholder="Email (optional)"
                    disabled={isAnon}
                  />

                  {/* Phone */}
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel"
                      value={donorPhone}
                      onChange={e => setDonorPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="pl-9 rounded-none border-2 border-gray-200 focus:border-primary font-bold text-primary h-12"
                      placeholder={want80G ? "Mobile Number (mandatory for 80G)" : "Mobile Number (optional)"}
                      disabled={isAnon}
                      maxLength={10}
                    />
                  </div>

                  {/* ── 80G RECEIPT TOGGLE ── */}
                  {!isAnon && (
                    <div
                      onClick={() => setWant80G(!want80G)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-2 transition-all duration-300 ${
                        want80G
                          ? "border-amber-400 bg-amber-50"
                          : "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50/40"
                      }`}
                    >
                      <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        want80G ? "border-amber-500 bg-amber-500" : "border-gray-300"
                      }`}>
                        {want80G && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-primary uppercase tracking-widest">
                          <IndianRupee className="w-3 h-3 inline mr-1 text-amber-600" />
                          I want an 80G Tax Exemption Receipt
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Claim income tax deduction under Section 80G. PAN & address required.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── 80G DETAILS FORM (animated) ── */}
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
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1">
                            <FileText className="w-3 h-3" /> 80G Receipt Details
                            <span className="text-red-500 ml-1">— All fields mandatory</span>
                          </p>

                          {/* PAN */}
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

                          {/* Address */}
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

                          {/* City + State */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600" />
                              <Input
                                type="text"
                                value={donorCity}
                                onChange={e => setDonorCity(e.target.value)}
                                className="pl-8 rounded-none border-2 border-amber-300 focus:border-amber-500 font-bold text-primary h-11 bg-white text-sm"
                                placeholder="City"
                              />
                            </div>
                            <Input
                              type="text"
                              value={donorState}
                              onChange={e => setDonorState(e.target.value)}
                              className="rounded-none border-2 border-amber-300 focus:border-amber-500 font-bold text-primary h-11 bg-white text-sm"
                              placeholder="State"
                            />
                          </div>

                          {/* Pincode */}
                          <Input
                            type="text"
                            value={donorPincode}
                            onChange={e => setDonorPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="rounded-none border-2 border-amber-300 focus:border-amber-500 font-bold text-primary h-11 bg-white text-sm"
                            placeholder="PIN Code (6 digits)"
                            maxLength={6}
                          />

                          <p className="text-[9px] text-amber-700 bg-amber-100 p-2 border border-amber-200">
                            Your 80G receipt (PDF) will be <strong>auto-downloaded</strong> immediately after successful payment. It is also available for re-download below.
                          </p>
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

                  {/* Urgency countdown near button — all campaigns with endDate */}
                  {campaign.endDate && (
                    <p className="text-center text-[10px] font-bold text-red-600 uppercase tracking-widest tabular-nums flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {countdown.expired
                        ? "Campaign ended"
                        : `${String(countdown.days).padStart(2,"0")}d ${String(countdown.hours).padStart(2,"0")}h ${String(countdown.minutes).padStart(2,"0")}m ${String(countdown.seconds).padStart(2,"0")}s left — act now!`
                      }
                    </p>
                  )}

                  {/* Social proof ticker — sidebar */}
                  <div
                    className="flex items-center gap-3 px-3 py-2.5"
                    style={{
                      background: "linear-gradient(135deg, #1a0000 0%, #2d0000 100%)",
                      border: "1px solid rgba(220,38,38,0.4)",
                      boxShadow: "0 0 14px rgba(220,38,38,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                      minHeight: "48px",
                      transition: "opacity 0.35s ease, transform 0.35s ease",
                      opacity: tickerVisible ? 1 : 0,
                      transform: tickerVisible ? "translateY(0)" : "translateY(-6px)",
                    }}
                  >
                    <Heart className="w-5 h-5 shrink-0" style={{ color: "#dc2626", filter: "drop-shadow(0 0 6px rgba(220,38,38,0.8))" }} />
                    <p className="text-[13px] font-black leading-tight" style={{ color: "#fff" }}>
                      <span className="uppercase tracking-wide">{FAKE_DONORS[tickerIdx].name}</span>
                      {" "}<span className="font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>has donated</span>{" "}
                      <span style={{ color: "#d4af37", textShadow: "0 0 8px rgba(212,175,55,0.6)" }}>₹{FAKE_DONORS[tickerIdx].amount.toLocaleString("en-IN")}</span>
                    </p>
                  </div>

                  {/* Secured by Razorpay — sidebar, above donate button */}
                  <div className="flex items-center justify-center gap-1.5 py-1">
                    <span className="text-[11px] font-semibold text-gray-400">Secured by</span>
                    <svg width="14" height="14" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.667 2L6 18.667H16L13.333 30 26 13.333H16L18.667 2Z" fill="#3395FF"/>
                    </svg>
                    <span className="text-[13px] font-black tracking-tight" style={{ color: "#3395FF" }}>Razorpay</span>
                  </div>

                  {/* Donate Button */}
                  <Button
                    onClick={handleDonate}
                    disabled={donating || !amount || Number(amount) < 1}
                    className="w-full text-white font-black uppercase tracking-[0.3em] rounded-none transition-all duration-500 relative overflow-hidden group bg-red-600 hover:bg-red-700 py-7 text-base shadow-lg shadow-red-200"
                  >
                    {donating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Heart className="w-5 h-5" />
                        {want80G && !isAnon ? "Donate & Get 80G Receipt" : "Donate Now"}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Button>

                  {/* WhatsApp Donate button — sidebar */}
                  <button
                    onClick={handleWhatsAppDonate}
                    className="w-full font-black uppercase tracking-wider text-sm rounded-none flex items-center justify-center gap-2.5 py-4 transition-all duration-200 hover:opacity-90 active:scale-95"
                    style={{ background: "#25D366", color: "#fff", boxShadow: "0 4px 14px rgba(37,211,102,0.3)" }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Donate via WhatsApp
                  </button>

                  {/* Razorpay Trusted Business badge — sidebar */}
                  <div className="flex justify-center py-1 px-3">
                    <img
                      src="/razorpay-trusted.png"
                      alt="Razorpay Trusted Business"
                      className="h-12 w-auto object-contain"
                    />
                  </div>

                  {/* Re-download Receipt button */}
                  <AnimatePresence>
                    {lastReceipt && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Button
                          onClick={async () => {
                            setGeneratingPdf(true);
                            await generate80GReceipt(lastReceipt);
                            setGeneratingPdf(false);
                          }}
                          disabled={generatingPdf}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs rounded-none py-4 flex items-center justify-center gap-2"
                        >
                          {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          {generatingPdf ? "Generating PDF…" : "Re-download 80G Receipt"}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* UPI QR Section */}
                <div className="border-t border-gray-100 pt-5 space-y-4">
                  <p className="text-xs text-gray-400 font-black uppercase tracking-widest text-center">Or Donate using</p>
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-40 h-40 bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden p-1">
                      <img
                        src="/azmi-qr.png"
                        alt="UPI QR Code — Azmi Foundation"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center">
                      Scan & donate with any UPI app
                    </p>
                    <div className="text-[9px] font-bold text-gray-500 bg-gray-50 px-3 py-1 border border-gray-100">
                      UPI: <span className="text-primary">{upiId}</span>
                    </div>
                  </div>

                  {/* Payment App Icons */}
                  <div className="flex justify-center gap-2 pt-1">
                    {PAYMENT_ICONS.map(p => (
                      <div
                        key={p.name}
                        title={p.name}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Code of Practice Card */}
              <div className="bg-white shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] text-center border-b border-gray-100 pb-3">
                  Our Code of Practice
                </h3>
                <div className="space-y-4">
                  {[
                    { title: "No guilt-tripping or pressure", desc: "Every appeal respects your choice to give, without emotional coercion." },
                    { title: "Transparent use of funds", desc: "Donations are tracked and used only for verified needs, with clear updates." },
                    { title: "No spam for donations", desc: "We will never call or WhatsApp asking you to donate more." },
                  ].map(p => (
                    <div key={p.title} className="space-y-1 border-l-2 border-accent pl-3">
                      <p className="text-xs font-black text-accent uppercase tracking-wider">{p.title}</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Credentials Card */}
              <div className="bg-white shadow-sm p-5 space-y-3">
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2 border-b border-gray-100 pb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Legal Registrations
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: "📜", label: "80G Tax Exemption", value: "AAGTA9354BF20261", sub: "AY 2026-27 to 2028-29", color: "text-amber-600" },
                    { icon: "🏛️", label: "12A IT Exemption", value: "AAGTA9354BE2025101", sub: "Income Tax Act 1961", color: "text-blue-600" },
                    { icon: "🤝", label: "CSR-1 Registered", value: "CSR00108803", sub: "Ministry of Corporate Affairs", color: "text-green-600" },
                    { icon: "🇮🇳", label: "NGO Darpan ID", value: "GJ/2021/0276308", sub: "NITI Aayog, Govt. of India", color: "text-purple-600" },
                  ].map(c => (
                    <div key={c.label} className="flex items-start gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-base leading-none mt-0.5">{c.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${c.color}`}>{c.label}</p>
                        <p className="text-[11px] font-black text-primary tracking-wider truncate">{c.value}</p>
                        <p className="text-[9px] text-gray-400">{c.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 text-center pt-1">
                  Your 80G receipt is <strong>auto-downloaded</strong> after payment when you tick the 80G box above.
                </p>
              </div>

              {/* Bank Transfer Info */}
              <div className="bg-white shadow-sm p-6 space-y-3">
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Bank Transfer (80G)
                </h3>
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
              <Link href="/campaigns">
                <span className="text-xs text-accent font-black uppercase tracking-widest hover:underline cursor-pointer">
                  View All →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedCampaigns.map((c) => {
                const pct = Math.min(100, Math.round((Number(c.currentAmount) / Number(c.targetAmount)) * 100));
                return (
                  <Link key={c.id} href={`/campaigns/${c.id}`}>
                    <div className="bg-white shadow-sm hover:shadow-lg transition-shadow cursor-pointer group">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={c.imageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80"}
                          alt={c.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5 space-y-3">
                        <h3 className="font-black text-primary text-sm uppercase tracking-tight line-clamp-2 group-hover:text-accent transition-colors">
                          {c.title}
                        </h3>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${pct}%` }}
                          />
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

      {/* ── STICKY MOBILE BOTTOM DONATE BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{ background: "rgba(4,0,15,0.97)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(200,200,220,0.25)", boxShadow: "0 -4px 24px rgba(0,0,0,0.5)" }}>
        {/* Social proof ticker — above donate button */}
        <AnimatePresence mode="wait">
          {tickerVisible && (
            <motion.div
              key={tickerIdx}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-2 px-4 py-2 mx-3 mt-2 rounded-lg"
              style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)" }}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: "#fff" }}>
                <span style={{ color: "#f87171" }}>{FAKE_DONORS[tickerIdx].name}</span>
                {" "}has donated{" "}
                <span style={{ color: "#fcd34d" }}>₹{FAKE_DONORS[tickerIdx].amount.toLocaleString("en-IN")}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Mini progress strip */}
        <div className="h-1 w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full transition-all duration-700" style={{ width: `${percent}%`, background: "linear-gradient(90deg, #888899, #c0c0d0)" }} />
        </div>
        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest tabular-nums">₹{Number(campaign?.currentAmount ?? 0).toLocaleString("en-IN")} raised · {percent}%</span>
          <span className="ml-auto text-[10px] font-black text-red-400 tabular-nums">{!countdown.expired && `${String(countdown.days).padStart(2,"0")}d ${String(countdown.hours).padStart(2,"0")}h left`}</span>
        </div>
        <div className="flex gap-2 px-3 pb-2">
          <button
            onClick={() => { document.getElementById("mobile-donate")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
            className="flex-1 font-black uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", color: "#fff", boxShadow: "0 0 20px rgba(220,38,38,0.5), inset 0 1px 0 rgba(255,255,255,0.15)" }}
          >
            <Heart className="w-4 h-4" />
            Donate ₹{Number(amount || PRESET_AMOUNTS[1]).toLocaleString("en-IN")} Now
          </button>
          <button
            onClick={handleWhatsAppDonate}
            className="px-4 py-4 rounded-xl flex flex-col items-center justify-center gap-0.5 font-black text-[9px] uppercase tracking-wider transition-all active:scale-95"
            style={{ background: "#25D366", color: "#fff", boxShadow: "0 0 12px rgba(37,211,102,0.4)" }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span>WA</span>
          </button>
        </div>
        {/* Razorpay trust strip */}
        <div className="flex items-center justify-center gap-1.5 pb-3 px-3">
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "#4ade80" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>100% Secured by</span>
          <svg viewBox="0 0 120 28" className="h-3.5 flex-shrink-0" style={{ filter: "brightness(0) invert(1) opacity(0.55)" }}>
            <text x="0" y="21" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="22" fill="white">Razorpay</text>
          </svg>
          <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.45)"}}>·</span>
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>256-bit SSL</span>
        </div>
      </div>

      {/* ── Donation Popup — appears 2s after page load ── */}
      <AnimatePresence>
        {showDonationPopup && campaign && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDonationPopup(false)}
            />

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] mx-auto max-w-md"
              style={{ borderRadius: "20px 20px 0 0", overflow: "hidden" }}
            >
              {/* Campaign image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={campaign.imageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80"}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {/* Close button */}
                <button
                  onClick={() => setShowDonationPopup(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all active:scale-90"
                  style={{ background: "rgba(0,0,0,0.6)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* White content area */}
              <div className="bg-white px-6 pt-5 pb-8 space-y-4">
                <p className="text-center text-lg font-black text-gray-900 leading-tight" style={{ fontStyle: "italic" }}>
                  Your donations will make a world of difference
                </p>

                {!popupCustom ? (
                  <>
                    {/* Default amount donate button */}
                    <button
                      onClick={async () => {
                        const defaultAmt = String(PRESET_AMOUNTS_MAP[id]?.[1] ?? amount ?? 1000);
                        setAmount(defaultAmt);
                        setShowDonationPopup(false);
                        await new Promise(r => setTimeout(r, 100));
                        handleDonate();
                      }}
                      disabled={donating}
                      className="w-full py-4 font-black text-base uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                      style={{
                        borderRadius: "50px",
                        background: "linear-gradient(135deg, #dc2626, #991b1b)",
                        color: "#fff",
                        boxShadow: "0 4px 20px rgba(220,38,38,0.4)",
                      }}
                    >
                      {donating ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        <>Donate ₹{Number(PRESET_AMOUNTS_MAP[id]?.[1] ?? amount ?? 1000).toLocaleString("en-IN")}</>
                      )}
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs font-bold text-gray-400 tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Choose different amount */}
                    <button
                      onClick={() => setPopupCustom(true)}
                      className="w-full py-3 font-bold text-sm uppercase tracking-widest border-2 border-gray-300 text-gray-600 transition-all active:scale-95 hover:border-red-400 hover:text-red-600"
                      style={{ borderRadius: "50px", background: "transparent" }}
                    >
                      Choose a Different Amount
                    </button>
                  </>
                ) : (
                  /* Custom amount input */
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-500 text-lg">₹</span>
                      <input
                        type="number"
                        value={popupAmount}
                        onChange={e => setPopupAmount(e.target.value)}
                        placeholder="Enter amount"
                        autoFocus
                        min="1"
                        className="w-full pl-9 pr-4 py-4 text-lg font-black border-2 border-gray-300 focus:border-red-500 outline-none transition-colors"
                        style={{ borderRadius: "12px" }}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!popupAmount || Number(popupAmount) < 1) return;
                        setAmount(popupAmount);
                        setShowDonationPopup(false);
                        setPopupCustom(false);
                        await new Promise(r => setTimeout(r, 100));
                        handleDonate();
                      }}
                      disabled={!popupAmount || Number(popupAmount) < 1 || donating}
                      className="w-full py-4 font-black text-base uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40"
                      style={{
                        borderRadius: "50px",
                        background: "linear-gradient(135deg, #dc2626, #991b1b)",
                        color: "#fff",
                        boxShadow: "0 4px 20px rgba(220,38,38,0.4)",
                      }}
                    >
                      {donating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Donate ₹${Number(popupAmount || 0).toLocaleString("en-IN")}`}
                    </button>
                    <button
                      onClick={() => { setPopupCustom(false); setPopupAmount(""); }}
                      className="w-full text-xs font-bold text-gray-400 py-1 tracking-widest uppercase"
                    >
                      ← Back
                    </button>
                  </div>
                )}

                {/* Trust line */}
                <p className="text-center text-[10px] text-gray-400 font-medium">
                  🔒 100% Secure · Powered by Razorpay
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
