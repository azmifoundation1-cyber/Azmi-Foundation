import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CampaignCard } from "@/components/CampaignCard";
import { useCampaigns } from "@/hooks/use-campaigns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, SlidersHorizontal, X, Filter, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";

const CATEGORIES = [
  { value: "all",         label: "All Causes" },
  { value: "health",      label: "Medical" },
  { value: "education",   label: "Education" },
  { value: "emergency",   label: "Emergency" },
  { value: "community",   label: "Community" },
  { value: "environment", label: "Environment" },
  { value: "other",       label: "Other" },
];

const SORT_OPTIONS = [
  { value: "newest",      label: "Newest First" },
  { value: "funded_high", label: "Most Funded %" },
  { value: "amount_low",  label: "Needs Most Help" },
  { value: "goal_low",    label: "Smallest Goal" },
];

export default function Campaigns() {
  useSEO({
    title: "All Campaigns",
    description: "Browse all active fundraising campaigns by Azmi Foundation. Help with medical emergencies, education, food drives, and community relief efforts across India.",
    url: "/campaigns",
  });
  const { data: campaigns = [], isLoading } = useCampaigns();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...campaigns];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    if (category !== "all") {
      list = list.filter((c) => c.category === category);
    }

    list.sort((a, b) => {
      const pctA = Number(a.currentAmount) / Number(a.targetAmount);
      const pctB = Number(b.currentAmount) / Number(b.targetAmount);
      if (sort === "funded_high") return pctB - pctA;
      if (sort === "amount_low") return Number(b.targetAmount) - Number(b.currentAmount) - (Number(a.targetAmount) - Number(a.currentAmount));
      if (sort === "goal_low") return Number(a.targetAmount) - Number(b.targetAmount);
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });

    return list;
  }, [campaigns, query, category, sort]);

  const hasFilters = query || category !== "all" || sort !== "newest";
  const clearAll = () => { setQuery(""); setCategory("all"); setSort("newest"); };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-primary text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-[10px] font-black uppercase tracking-[0.5em] text-accent mb-4"
          >
            Make A Difference Today
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tighter leading-[0.9] mb-6"
          >
            Active Campaigns
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto mb-10"
          >
            Every contribution matters. Browse verified causes and support one that speaks to your heart.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campaigns by title or cause..."
              className="pl-12 pr-12 h-14 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-accent focus:ring-accent rounded-none backdrop-blur-sm"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-3 mt-6"
          >
            {[
              { icon: "📜", label: "80G Approved" },
              { icon: "🏛️", label: "12A Registered" },
              { icon: "🤝", label: "CSR-1 Certified" },
              { icon: "🇮🇳", label: "NGO Darpan Verified" },
              { icon: "🔒", label: "Razorpay Secured" },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1.5 text-white/80 text-[10px] font-black uppercase tracking-widest">
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="bg-accent/10 border-b border-accent/20 py-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-6 text-[11px] font-bold uppercase tracking-widest text-primary/70">
          <span className="flex items-center gap-1.5">✓ 100% Transparent</span>
          <span className="flex items-center gap-1.5">✓ Verified NGO</span>
          <span className="flex items-center gap-1.5">✓ Secure Payments (Razorpay)</span>
          <span className="flex items-center gap-1.5">✓ 80G Tax Benefit Eligible</span>
          <span className="flex items-center gap-1.5">✓ Real-time Fund Tracking</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 sticky top-[80px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3 justify-between">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  category === cat.value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort + Count */}
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button
                onClick={clearAll}
                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-[11px] font-bold uppercase tracking-wider border border-gray-200 bg-white px-3 py-1.5 focus:outline-none focus:border-primary"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="text-[11px] text-gray-400 font-medium hidden sm:block">
              {filtered.length} Campaign{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Loading campaigns...</p>
            </div>
          ) : filtered.length > 0 ? (
            <AnimatePresence mode="popLayout">
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((campaign, i) => (
                  <motion.div
                    key={campaign.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  >
                    <CampaignCard campaign={campaign} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-32 space-y-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-2">No campaigns found</h3>
                <p className="text-gray-400 text-sm">Try a different search term or category</p>
              </div>
              <Button onClick={clearAll} variant="outline" className="rounded-none font-bold uppercase tracking-widest text-xs">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Start your own campaign CTA */}
      <section className="bg-primary py-16 text-center text-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-black uppercase tracking-tight mb-3">Have a Cause to Share?</h2>
          <p className="text-white/60 text-sm mb-8">Submit your campaign for admin review and start raising funds with full transparency.</p>
          <Link href="/campaigns/create">
            <Button className="bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest px-10 py-6 rounded-none shadow-xl">
              Start a Campaign
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
