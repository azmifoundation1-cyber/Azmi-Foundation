import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Heart, Share2, Users, CheckCircle, ShieldCheck,
  ChevronRight, Loader2, ArrowLeft, Copy, Check
} from "lucide-react";
import type { Campaign, Donation } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

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
      "For over 18 years, Dr. Shahbaaz Azmi's father dedicated his life to serving the poor and the forgotten. Through the Azmi Foundation, he fed more than 2 lakh people for free, often using his own clinic income and personal savings. Long before charity became organized, helping the hungry was already his daily habit. If he saw someone sitting hungry or sleeping on the road, he would stop, sit with them, and ensure they were fed. Serving people was not an activity for him — it was his way of life.",
      "Today, the man who spent his life saving others is fighting for his own. He is battling heart failure, kidney failure, and a brain haemorrhage and is currently admitted in critical condition. He cannot stand, sit, eat, or drink without assistance. Once a pillar of strength for thousands, he is now completely dependent on medical support. Watching this decline has been devastating for his family, especially his son.",
      "Everything now rests on Dr. Shahbaaz. While struggling to manage his father's life-saving treatment, he continues running the foundation on his own. His clinic has been shut down for months due to his father's illness, and his personal savings have been fully exhausted. Medical expenses keep rising, while the foundation itself struggles to survive. Yet, despite the pressure, he refuses to step away from the people who depend on him.",
      "Even in this crisis, Dr. Shahbaaz ensures that 2,000 people are fed every single day. He continues distributing food, ration kits, clothes, and essential support to families living in slums and on footpaths. Many of them survive only because this daily food reaches them. If the foundation stops, thousands will be left helpless, with no food and no support. For these families, the foundation is not charity — it is survival.",
      "Dr. Shahbaaz cannot let his father's dream die. He cannot turn away from the people who wait every day, hoping someone will come with food. But today, he cannot do this alone. He needs support to save his father and keep this mission alive. By helping him now, you are helping feed hungry souls and protect a legacy built on humanity."
    ],
    images: [
      "/shahbaaz-thumb.jpg",   // [0] — video poster
      "/azmi-img3.jpg",        // [1] — (index offset placeholder)
      "/azmi-img3.jpg",        // [2] — shown after paragraph 2 (elderly woman being fed)
      "/azmi-img4.jpg",        // [3] — shown after paragraph 3 (large crowd distribution)
      "/azmi-img1.jpg",        // [4] — shown after paragraph 4 (food tray handout)
      "/azmi-img2.jpg",        // [5] — shown after paragraph 5 (women sharing a meal)
    ],
  },
};

export default function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:id");
  const id = Number(params?.id);
  const [amount, setAmount] = useState("1000");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [copied, setCopied] = useState(false);
  const [donating, setDonating] = useState(false);
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

  const donateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          donorName: isAnon ? "Anonymous" : (donorName || "Anonymous"),
          donorEmail: donorEmail || null,
          campaignId: id,
          isAnonymous: isAnon,
        }),
      });
      if (!res.ok) throw new Error("Donation failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Donation recorded!", description: "Thank you for your support." });
      queryClient.invalidateQueries({ queryKey: ["/api/donations/campaign", id] });
      setDonorName(""); setDonorEmail(""); setAmount("1000");
    },
    onError: () => {
      toast({ title: "Error", description: "Could not record donation.", variant: "destructive" });
    }
  });

  const handleDonate = () => {
    const upiLink = `upi://pay?pa=8320218861@okbizaxis&pn=AZMI%20FOUNDATION&mc=8398&aid=uGICAgKDh34mqRg&ver=01&mode=01&tr=BCR2DN7T3H22XBD5&am=${amount}&cu=INR`;
    const anchor = document.createElement("a");
    anchor.href = upiLink;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    donateMutation.mutate();
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
  const story = CAMPAIGN_STORIES[id] || CAMPAIGN_STORIES[1];

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

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Campaign Title */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Link href="/campaigns" className="inline-flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest mb-4 hover:text-primary transition-colors">
                <ArrowLeft className="w-3 h-3" /> All Campaigns
              </Link>
              <h1 className="text-2xl sm:text-4xl font-black text-primary leading-tight tracking-tight">
                {campaign.title}
              </h1>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-none overflow-hidden aspect-video bg-gray-200"
            >
              <img
                src={campaign.imageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80"}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/80 to-transparent p-6">
                <div className="flex items-center gap-2">
                  <span className="bg-accent text-white text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1">
                    Active Campaign
                  </span>
                  <span className="bg-white/20 text-white text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 backdrop-blur-sm">
                    Ahmedabad, Gujarat
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Share Row */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-green-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp Share
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest rounded-full hover:border-primary hover:text-primary transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            {/* Story Section */}
            <div className="bg-white p-6 sm:p-10 space-y-8 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight border-b border-gray-100 pb-4">
                The Full Story
              </h2>

              {story.story.map((para, i) => (
                <div key={i} className="space-y-6">
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{para}</p>

                  {/* Show local video after 1st paragraph */}
                  {i === 0 && story.localVideo && (
                    <div className="my-4 rounded-none overflow-hidden bg-black">
                      <video
                        src={story.localVideo}
                        controls
                        poster={story.images[0]}
                        className="w-full max-h-[480px] object-contain"
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}

                  {/* Show YouTube embed after 1st paragraph (if no local video) */}
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

                  {/* Images between paragraphs (skip first image — used as hero/poster) */}
                  {story.images[i + 1] && i >= 1 && (
                    <div className="overflow-hidden aspect-video rounded-none">
                      <img
                        src={story.images[i + 1]}
                        alt={`Campaign image ${i + 2}`}
                        className="w-full h-full object-cover"
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

            {/* Supporters */}
            <div className="bg-white p-6 sm:p-10 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-primary uppercase tracking-tight text-center">
                Supporters
              </h2>
              <div className="flex items-center gap-3 justify-center">
                <div className="h-px flex-1 bg-gray-100" />
                <div className="flex gap-1">
                  {[1,2,3].map(i => (
                    <div key={i} className={`w-2 h-2 rotate-45 ${i === 2 ? 'bg-primary' : 'bg-gray-200'}`} />
                  ))}
                </div>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              {supporters.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm font-medium">Be the first to support this cause!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {supporters.slice(0, 8).map((s, i) => (
                    <div key={s.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                        {s.isAnonymous ? "A" : (s.donorName?.[0] || "A").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-primary text-sm truncate">
                          {s.isAnonymous ? "Anonymous" : (s.donorName || "Anonymous")}
                        </p>
                        <p className="text-accent font-black text-sm">₹{Number(s.amount).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {supporters.length > 8 && (
                    <div className="text-center pt-2">
                      <span className="text-accent font-black text-sm uppercase tracking-widest cursor-pointer hover:underline">
                        View all {supporters.length} supporters
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN (STICKY DONATION WIDGET) ── */}
          <div className="lg:col-span-1">
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
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Users className="w-3 h-3" />
                    {supporters.length} Supporters
                  </div>
                </div>

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
                        ₹{a >= 1000 ? `${a/1000}K` : a}
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
                    placeholder="Your Name"
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

                  {/* Anonymous toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setIsAnon(!isAnon)}
                      className={`w-4 h-4 border-2 flex items-center justify-center transition-all ${isAnon ? "border-primary bg-primary" : "border-gray-300 group-hover:border-primary"}`}
                    >
                      {isAnon && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Donate Anonymously</span>
                  </label>

                  {/* Donate Button */}
                  <Button
                    onClick={handleDonate}
                    disabled={donateMutation.isPending || !amount || Number(amount) < 1}
                    className="w-full bg-primary hover:bg-black text-white font-black uppercase tracking-[0.3em] text-sm rounded-none py-6 gold-edge transition-all duration-500 relative overflow-hidden group"
                  >
                    {donateMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Heart className="w-4 h-4" /> Donate Now
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Button>
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

      <Footer />
    </div>
  );
}
