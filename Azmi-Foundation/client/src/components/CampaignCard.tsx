import { Link } from "wouter";
import { type Campaign } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Target } from "lucide-react";
import { motion } from "framer-motion";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const percent = Math.min(100, Math.round((Number(campaign.currentAmount) / Number(campaign.targetAmount)) * 100));

  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="group overflow-hidden border-none metallic-card flex flex-col h-full bg-white rounded-none shadow-2xl">
        <div className="relative h-72 overflow-hidden">
          <motion.img 
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.8 }}
            src={campaign.imageUrl || `https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80`} 
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent opacity-80" />
          <div className="absolute top-6 right-6 px-4 py-1 bg-accent text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl gold-edge">
            Mission Active
          </div>
        </div>

        <CardHeader className="pt-8 pb-2 px-8">
          <h3 className="text-3xl font-black text-primary uppercase tracking-tighter leading-[0.9] group-hover:metallic-text transition-all duration-500">
            {campaign.title}
          </h3>
        </CardHeader>

        <CardContent className="px-8 py-4 flex-grow space-y-8">
          <p className="text-primary/60 text-sm font-medium leading-relaxed tracking-tight line-clamp-3">
            {campaign.description}
          </p>
          
          <div className="space-y-4 pt-4 border-t border-primary/5">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/30">Impact Progress</span>
                <div className="text-3xl font-black text-primary tracking-tighter">{percent}%</div>
              </div>
              <Target className="w-5 h-5 text-accent opacity-20" />
            </div>
            <Progress value={percent} className="h-1 bg-primary/5" />
            <div className="flex justify-between items-center">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary/30">Raised</span>
                  <span className="text-xl font-black text-primary tracking-tighter">₹{Number(campaign.currentAmount).toLocaleString()}</span>
               </div>
               <div className="flex flex-col text-right">
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary/30">Goal</span>
                  <span className="text-xl font-black text-primary/20 tracking-tighter">₹{Number(campaign.targetAmount).toLocaleString()}</span>
               </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-8 pb-8 pt-4">
          <Link href={`/donate?campaignId=${campaign.id}`} className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-none py-8 shadow-xl gold-edge transition-all duration-500 overflow-hidden group/btn relative">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Initiate Support <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
