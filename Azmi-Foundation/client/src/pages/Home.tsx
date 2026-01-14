import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CampaignCard } from "@/components/CampaignCard";
import { useCampaigns } from "@/hooks/use-campaigns";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Globe, Users, Award, Shield, Zap, Target } from "lucide-react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useRef } from "react";

export default function Home() {
  const { data: campaigns, isLoading } = useCampaigns();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -5]);
  const smoothY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 100]), {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const featuredCampaigns = campaigns?.slice(0, 3) || [];

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-background relative">
      <Navbar />

      {/* Advanced Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ scale, rotate }}
          className="absolute inset-0 z-0 bg-[#C0C0C0]"
        >
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,_#FFFFFF_0%,_transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-20" />
          <motion.div 
            animate={{ 
              x: [0, 50, 0],
              y: [0, 30, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -left-1/4 w-full h-full bg-white/20 blur-[120px] rounded-full" 
          />
        </motion.div>

        {/* Dynamic Floating Symbols */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           {[
             { char: "ॐ", top: "15%", left: "10%", delay: 0 },
             { char: "☪", top: "20%", right: "15%", delay: 2 },
             { char: "✝", bottom: "25%", left: "20%", delay: 4 },
             { char: "☬", bottom: "15%", right: "10%", delay: 6 }
           ].map((s, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ 
                 opacity: 0.05, 
                 scale: 1,
                 y: [0, -40, 0],
                 rotate: [0, 10, -10, 0]
               }}
               transition={{ 
                 duration: 8, 
                 repeat: Infinity, 
                 delay: s.delay,
                 ease: "easeInOut"
               }}
               className="absolute text-[15rem] md:text-[25rem] font-serif select-none"
               style={{ top: s.top, left: s.left, right: s.right, bottom: s.bottom }}
             >
               {s.char}
             </motion.div>
           ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <motion.div 
            initial={{ opacity: 0, filter: "blur(20px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="space-y-8"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-3 px-6 py-2 border border-primary/10 rounded-full bg-white/10 backdrop-blur-md text-primary/60 text-[10px] font-black tracking-[0.5em] uppercase"
            >
              <Shield className="w-3 h-3 text-accent" />
              Global Standard Excellence
              <Zap className="w-3 h-3 text-accent" />
            </motion.div>
            
            <h1 className="text-7xl md:text-[12rem] font-black tracking-tighter metallic-text leading-[0.8] drop-shadow-2xl">
              <motion.span 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="block"
              >
                AZMI
              </motion.span>
              <motion.span 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="block text-primary/80"
              >
                FOUNDATION
              </motion.span>
            </h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-lg md:text-2xl text-primary/60 leading-relaxed max-w-3xl mx-auto font-medium tracking-tight"
            >
              Setting the global benchmark for interfaith harmony and sustainable community evolution through revolutionary compassion.
            </motion.p>

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
              className="flex flex-col sm:flex-row gap-6 pt-12 justify-center items-center"
            >
              <Link href="/donate">
                <Button size="lg" className="group relative bg-primary hover:bg-primary/95 text-white px-16 py-10 text-xl rounded-none transition-all duration-500 uppercase tracking-[0.3em] font-black gold-edge overflow-hidden">
                  <span className="relative z-10 flex items-center gap-3">
                    Donate Now <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-accent/20"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="border-2 border-primary/20 text-primary hover:border-primary px-16 py-10 text-xl rounded-none bg-transparent transition-all duration-500 uppercase tracking-[0.3em] font-black hover:bg-primary/5">
                  Explore Impact
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30"
        >
          <div className="w-px h-12 bg-primary/20" />
          <span className="text-[8px] font-black tracking-[0.4em] uppercase text-primary">Scroll to Discover</span>
        </motion.div>
      </section>

      {/* Advanced Stats Section with Magnetic Effect */}
      <section className="py-32 relative z-20 overflow-hidden bg-white">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-px bg-primary/5 border border-primary/5">
            <StatCard icon={Users} count="15,000+" label="Lives Impacted" index={0} />
            <StatCard icon={Globe} count="45+" label="Communities Served" index={1} />
            <StatCard icon={Heart} count="2,300+" label="Volunteers" index={2} />
            <StatCard icon={Award} count="12" label="Years of Service" index={3} />
          </div>
        </div>
      </section>

      {/* Featured Campaigns with Glassmorphism */}
      <section className="py-32 relative bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="space-y-4 text-left">
              <motion.span 
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                className="text-accent font-black tracking-[0.5em] uppercase text-[10px] flex items-center gap-2"
              >
                <Target className="w-3 h-3" /> Active Missions
              </motion.span>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-primary uppercase leading-none">
                Featured <br /> <span className="text-primary/30">Missions</span>
              </h2>
            </div>
            <Link href="/campaigns">
              <Button variant="link" className="text-primary font-black tracking-widest uppercase text-xs group">
                View All <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[500px] bg-primary/5 rounded-none animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {featuredCampaigns.map((campaign, idx) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <CampaignCard campaign={campaign} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, count, label, index }: { icon: any, count: string, label: string, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white p-16 text-center hover:bg-primary group transition-all duration-700 cursor-default"
    >
      <div className="w-12 h-12 border border-primary/10 flex items-center justify-center mx-auto mb-8 group-hover:border-white/20 group-hover:bg-white/10 transition-all duration-500">
        <Icon className="w-5 h-5 group-hover:text-white group-hover:rotate-[360deg] transition-all duration-700" />
      </div>
      <h3 className="text-6xl font-black text-primary group-hover:text-white mb-2 tracking-tighter transition-colors duration-500">{count}</h3>
      <p className="text-primary/40 group-hover:text-white/40 font-black uppercase tracking-[0.3em] text-[10px] transition-colors duration-500">{label}</p>
    </motion.div>
  );
}
