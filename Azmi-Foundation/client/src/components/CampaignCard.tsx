import { Link } from "wouter";
import { type Campaign } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, HeartPulse, GraduationCap, Leaf, Users, Building2, Flame } from "lucide-react";
import { motion } from "framer-motion";

const CAMPAIGN_YOUTUBE_IDS: Record<number, string> = {
  3: "Z_exh7zMqDs",
  4: "NfYQeSsNQrg",
};

const CAMPAIGN_HARDCODED_IMAGES: Record<number, string> = {
  5: "/harsh-hospital.jpeg",
};

const CATEGORY_CONFIG: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  health:      { label: "Medical Emergency",   Icon: HeartPulse,    color: "bg-red-600" },
  education:   { label: "Education",           Icon: GraduationCap, color: "bg-blue-700" },
  environment: { label: "Environment",         Icon: Leaf,          color: "bg-green-700" },
  community:   { label: "NGO Initiative",      Icon: Users,         color: "bg-[#b8922a]" },
  emergency:   { label: "Very Serious Case",   Icon: Flame,         color: "bg-orange-700" },
  other:       { label: "NGO Initiative",      Icon: Building2,     color: "bg-[#b8922a]" },
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const percent = Math.min(100, Math.round((Number(campaign.currentAmount) / Number(campaign.targetAmount)) * 100));
  const cat = CATEGORY_CONFIG[campaign.category] ?? CATEGORY_CONFIG.other;
  const { label, Icon, color } = cat;
  const youtubeId = CAMPAIGN_YOUTUBE_IDS[campaign.id];
  const hardcodedImage = CAMPAIGN_HARDCODED_IMAGES[campaign.id];

  return (
    <Link href={`/campaigns/${campaign.id}`} className="block h-full cursor-pointer">
      <motion.div
        whileHover={{ y: -20, rotateY: 5, rotateX: 5 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="h-full perspective-1000"
      >
        <Card className="group overflow-hidden border-none metallic-card flex flex-col h-full bg-white rounded-none shadow-[0_30px_60px_rgba(0,0,0,0.1)] hover:shadow-[0_50px_100px_rgba(0,0,0,0.2)] transform-gpu transition-all duration-700">
          <div className="relative h-64 sm:h-80 overflow-hidden bg-black">
            {youtubeId ? (
              <>
                <img
                  src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20">
                    <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <motion.img
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 1.2 }}
                src={hardcodedImage || campaign.imageUrl || `https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80`}
                alt={campaign.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80"; }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent opacity-90" />
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className={`absolute top-6 right-6 flex items-center gap-2 px-4 py-2 ${color} text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl`}
            >
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              {label}
            </motion.div>
          </div>

          <CardHeader className="pt-10 pb-4 px-8 sm:px-12">
            <h3 className="text-3xl sm:text-4xl font-black text-primary uppercase tracking-tighter leading-[0.85] group-hover:metallic-text transition-all duration-700">
              {campaign.title}
            </h3>
          </CardHeader>

          <CardContent className="px-8 sm:px-12 py-6 flex-grow space-y-10">
            <p className="text-primary/70 text-xs sm:text-sm font-medium leading-relaxed tracking-tight line-clamp-3 uppercase opacity-80">
              {campaign.description}
            </p>

            <div className="space-y-6 pt-6 border-t border-primary/10">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.5em] text-primary/40">Evolution Index</span>
                  <div className="text-4xl sm:text-5xl font-black text-primary tracking-tighter italic">{percent}%</div>
                </div>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                  <Target className="w-6 h-6 sm:w-8 sm:h-8 text-accent opacity-30" />
                </motion.div>
              </div>
              <div className="h-1.5 w-full bg-primary/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percent}%` }}
                  transition={{ duration: 2, ease: "circOut" }}
                  className="h-full bg-accent shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-8 items-center">
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.5em] text-primary/40">Acquisition</span>
                  <span className="text-xl sm:text-2xl font-black text-primary tracking-tighter leading-none">₹{Number(campaign.currentAmount).toLocaleString()}</span>
                </div>
                <div className="flex flex-col text-right gap-1">
                  <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.5em] text-primary/40">Requirement</span>
                  <span className="text-xl sm:text-2xl font-black text-primary/20 tracking-tighter leading-none">₹{Number(campaign.targetAmount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="px-8 sm:px-12 pb-10 sm:pb-14 pt-6 flex flex-col gap-3">
            <Button variant="outline" className="w-full border-2 border-primary/20 text-primary hover:border-primary font-black uppercase tracking-[0.4em] text-[8px] sm:text-[10px] rounded-none py-8 sm:py-10 transition-all duration-500">
              View Full Story
            </Button>
            <Button className="w-full bg-primary hover:bg-black text-white font-black uppercase tracking-[0.5em] text-[8px] sm:text-[10px] rounded-none py-10 sm:py-12 shadow-2xl gold-edge transition-all duration-700 overflow-hidden group/btn relative transform-gpu hover:scale-[1.02]">
              <span className="relative z-10 flex items-center justify-center gap-4">
                Donate Now <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover/btn:translate-x-4 transition-transform duration-500" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </Link>
  );
}
