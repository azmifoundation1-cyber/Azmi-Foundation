import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CampaignCard } from "@/components/CampaignCard";
import { LegalCredentials } from "@/components/LegalCredentials";
import { useCampaigns } from "@/hooks/use-campaigns";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Globe, Users, Award, Shield, Zap, Target, Search, CreditCard, TrendingUp, CheckCircle, Star, Quote, ShieldCheck, Lock, ClipboardList, BarChart3, Handshake, Receipt } from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
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
    <div ref={containerRef} className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-background relative perspective-1000">
      <Navbar />

      {/* Advanced Hero Section with 3D Depth */}
      <section className="relative h-[100svh] flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ scale, rotate, z: 100 }}
          className="absolute inset-0 z-0 bg-[#C0C0C0]"
        >
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,_#FFFFFF_0%,_transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-20" />
          <motion.div 
            animate={{ 
              x: [0, 50, 0],
              y: [0, 30, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-white/30 blur-[150px] rounded-full" 
          />
        </motion.div>

        {/* Dynamic 3D Floating Symbols */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           {[
             { char: "ॐ", top: "10%", left: "5%", delay: 0, rotateZ: 15 },
             { char: "☪", top: "15%", right: "8%", delay: 2, rotateZ: -10 },
             { char: "✝", bottom: "20%", left: "12%", delay: 4, rotateZ: 5 },
             { char: "☬", bottom: "10%", right: "5%", delay: 6, rotateZ: -15 }
           ].map((s, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, scale: 0.5, z: -500 }}
               animate={{ 
                 opacity: [0, 0.08, 0.05], 
                 scale: [0.8, 1.2, 1],
                 z: [0, 200, 0],
                 y: [0, -60, 0],
                 rotateX: [0, 20, 0],
                 rotateY: [0, 20, 0],
                 rotateZ: [s.rotateZ, s.rotateZ + 20, s.rotateZ]
               }}
               transition={{ 
                 duration: 12, 
                 repeat: Infinity, 
                 delay: s.delay,
                 ease: "easeInOut"
               }}
               className="absolute text-[12rem] sm:text-[18rem] md:text-[28rem] font-serif select-none mix-blend-multiply"
               style={{ top: s.top, left: s.left, right: s.right, bottom: s.bottom, transformStyle: 'preserve-3d' }}
             >
               {s.char}
             </motion.div>
           ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <motion.div 
            initial={{ opacity: 0, filter: "blur(30px)", rotateX: 45 }}
            animate={{ opacity: 1, filter: "blur(0px)", rotateX: 0 }}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 sm:space-y-12"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="inline-flex items-center gap-2 sm:gap-4 px-4 sm:px-8 py-2 sm:py-3 border border-primary/20 rounded-none bg-white/10 backdrop-blur-xl text-primary text-[8px] sm:text-[10px] font-black tracking-[0.6em] uppercase shadow-2xl"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}><Shield className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /></motion.div>
              Interfaith Excellence 2026
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }}><Zap className="w-3 h-3 sm:w-4 sm:h-4 text-accent" /></motion.div>
            </motion.div>
            
            <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-[10rem] xl:text-[12rem] font-black tracking-tighter metallic-text leading-[0.8] drop-shadow-[0_35px_35px_rgba(0,0,0,0.25)] perspective-1000">
              <motion.span 
                initial={{ x: -150, opacity: 0, rotateY: -45 }}
                animate={{ x: 0, opacity: 1, rotateY: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: "circOut" }}
                className="block mb-2 sm:mb-4"
              >
                AZMI
              </motion.span>
              <motion.span 
                initial={{ x: 150, opacity: 0, rotateY: 45 }}
                animate={{ x: 0, opacity: 1, rotateY: 0 }}
                transition={{ duration: 1.2, delay: 0.5, ease: "circOut" }}
                className="block text-primary/80"
              >
                FOUNDATION
              </motion.span>
            </h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="text-sm sm:text-xl md:text-3xl text-primary/70 leading-relaxed max-w-4xl mx-auto font-medium tracking-tight px-4 sm:px-0"
            >
              Nestled in the vibrant heart of Ahmedabad, pioneering the global evolution of interfaith harmony through <span className="text-primary font-black italic">revolutionary compassion</span>.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, z: -100 }}
              animate={{ opacity: 1, z: 0 }}
              transition={{ delay: 1.8 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-8 pt-10 sm:pt-16 justify-center items-center px-6"
            >
              <Link href="/donate" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto group relative bg-primary hover:bg-black text-white px-10 sm:px-20 py-8 sm:py-12 text-lg sm:text-2xl rounded-none transition-all duration-700 uppercase tracking-[0.4em] font-black gold-edge overflow-hidden transform-gpu hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                  <span className="relative z-10 flex items-center justify-center gap-4">
                    Donate Now <motion.div animate={{ x: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" /></motion.div>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Button>
              </Link>
              <Link href="/about" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-[3px] border-primary/10 text-primary hover:border-primary px-10 sm:px-20 py-8 sm:py-12 text-lg sm:text-2xl rounded-none bg-transparent transition-all duration-700 uppercase tracking-[0.4em] font-black hover:bg-primary/5 shadow-xl">
                  Our Legacy
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Enhanced 3D Scroll Indicator */}
        <motion.div 
          animate={{ 
            y: [0, 15, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <div className="w-0.5 h-16 sm:h-24 bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0" />
          <span className="text-[6px] sm:text-[8px] font-black tracking-[0.6em] uppercase text-primary/60">Explore the Horizon</span>
        </motion.div>
      </section>

      {/* Stats Section with Ultra-Responsive Grid and 3D Cards */}
      <section className="py-8 sm:py-24 relative z-20 overflow-hidden bg-white/50 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-px bg-transparent sm:bg-primary/10 border-none sm:border border-primary/10 shadow-none sm:shadow-[0_50px_100px_rgba(0,0,0,0.1)] overflow-hidden">
            <StatCard icon={Users} count="4,300+" label="Individuals Fed" index={0} />
            <StatCard icon={Globe} count="Ahmedabad" label="Heart of Impact" index={1} />
            <StatCard icon={Heart} count="Unity" label="Interfaith Harmony" index={2} />
            <StatCard icon={Award} count="Est. 2018" label="Foundation Legacy" index={3} />
          </div>
        </div>
      </section>

      {/* Missions Section with 4K Depth */}
      <section className="py-24 sm:py-48 relative bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end mb-20 sm:mb-32 gap-12 text-center lg:text-left">
            <div className="space-y-6">
              <motion.div 
                whileInView={{ x: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-accent font-black tracking-[0.6em] uppercase text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-3"
              >
                <Target className="w-4 h-4" /> Strategic Objectives
              </motion.div>
              <h2 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter text-primary uppercase leading-[0.85]">
                GLOBAL <br /> <span className="text-primary/20 italic">MISSIONS</span>
              </h2>
            </div>
            <Link href="/campaigns">
              <Button variant="link" className="text-primary font-black tracking-[0.4em] uppercase text-xs sm:text-sm group hover:no-underline">
                <span className="relative">
                  Command Center
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-500" />
                </span>
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-4 transition-transform duration-500" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[600px] bg-primary/5 rounded-none animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-16">
              {featuredCampaigns.map((campaign, idx) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, scale: 0.9, y: 100 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 1, 
                    delay: idx * 0.2,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  <CampaignCard campaign={campaign} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 sm:py-40 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.span
              whileInView={{ opacity: [0, 1] }}
              viewport={{ once: true }}
              className="text-accent font-black tracking-[0.6em] uppercase text-[10px] flex items-center justify-center gap-3 mb-4"
            >
              <TrendingUp className="w-4 h-4" /> Simple & Transparent
            </motion.span>
            <h2 className="text-5xl sm:text-7xl font-black tracking-tighter text-primary uppercase leading-[0.9]">
              How It <span className="text-primary/20 italic">Works</span>
            </h2>
            <p className="text-gray-500 mt-6 max-w-xl mx-auto text-sm sm:text-base">
              From browsing to impact — your donation journey with Azmi Foundation is fully transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 relative">
            {/* connecting line */}
            <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-primary/10 z-0" />
            {[
              { step: "01", icon: Search, title: "Browse Campaigns", desc: "Explore verified causes across health, education, emergency, and community categories." },
              { step: "02", icon: CreditCard, title: "Choose & Donate", desc: "Give any amount securely via UPI, Razorpay, or bank transfer. Every rupee counts." },
              { step: "03", icon: CheckCircle, title: "100% Transparency", desc: "Track how your donation is utilized with real-time updates from our field team." },
              { step: "04", icon: Heart, title: "See Your Impact", desc: "Receive reports and photos showing the direct change your contribution created." },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.8 }}
                className="relative z-10 flex flex-col items-center text-center p-8"
              >
                <div className="w-16 h-16 bg-primary flex items-center justify-center mb-6 relative shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
                  <Icon className="w-7 h-7 text-white" />
                  <span className="absolute -top-3 -right-3 bg-accent text-primary text-[10px] font-black w-7 h-7 flex items-center justify-center">{step}</span>
                </div>
                <h3 className="text-base font-black text-primary uppercase tracking-tight mb-3">{title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST & SAFETY ── */}
      <section className="py-16 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight">Why Donors Trust Azmi Foundation</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { Icon: ShieldCheck,   label: "NGO Verified", sub: "Govt. Registered" },
              { Icon: Lock,          label: "Secure Payments", sub: "Razorpay PCI-DSS" },
              { Icon: ClipboardList, label: "80G Tax Benefit", sub: "Income Tax Exemption" },
              { Icon: BarChart3,     label: "Full Transparency", sub: "Fund Reports Shared" },
              { Icon: Handshake,     label: "Direct Impact", sub: "No Middlemen" },
              { Icon: Star,          label: "5-Star Trust", sub: "Community Endorsed" },
            ].map(({ Icon, label, sub }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-4 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <Icon className="w-8 h-8 mb-3 text-primary/70" />
                <p className="text-[11px] font-black text-primary uppercase tracking-wide">{label}</p>
                <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 sm:py-40 bg-primary text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.span
              whileInView={{ opacity: [0, 1] }}
              viewport={{ once: true }}
              className="text-accent font-black tracking-[0.6em] uppercase text-[10px] block mb-4"
            >
              Stories of Impact
            </motion.span>
            <h2 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.9] uppercase">
              Real <span className="text-white/20 italic">Voices</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Siddiqui Family",
                location: "Gomtipur, Ahmedabad",
                quote: "When my husband was hospitalized, we had nothing. Azmi Foundation stepped in immediately — food for our children every day, medical guidance, and hope. We are forever grateful.",
                stars: 5,
              },
              {
                name: "Ravi Kumar",
                location: "Donor, Mumbai",
                quote: "I've donated to many NGOs, but none give me the transparency that Azmi Foundation does. I receive photos and updates from the field every month. My money truly reaches the people.",
                stars: 5,
              },
              {
                name: "Zainab Sheikh",
                location: "Volunteer, Ahmedabad",
                quote: "Volunteering with Azmi Foundation changed my perspective on life. Seeing Dr. Shahbaaz work tirelessly for thousands of families with zero personal motive — it is inspiring.",
                stars: 5,
              },
            ].map(({ name, location, quote, stars }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white/5 border border-white/10 p-8 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <Quote className="w-8 h-8 text-accent/40 mb-4" />
                <p className="text-white/80 text-sm leading-relaxed mb-6 italic">"{quote}"</p>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-white font-black text-sm uppercase tracking-wide">{name}</p>
                <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">{location}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TAX BENEFIT BANNER ── */}
      <section className="py-12 bg-accent/10 border-y border-accent/20">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Receipt className="w-10 h-10 text-primary/60 shrink-0" />
            <div>
              <p className="font-black text-primary text-base uppercase tracking-tight">Get 80G Tax Exemption on Your Donation</p>
              <p className="text-sm text-gray-500 mt-1">All donations to Azmi Foundation are eligible for income tax deductions under Section 80G of the Income Tax Act.</p>
            </div>
          </div>
          <Link href="/donate">
            <Button className="bg-primary text-white hover:bg-black font-black uppercase tracking-widest text-xs rounded-none px-8 py-5 whitespace-nowrap">
              Donate & Save Tax
            </Button>
          </Link>
        </div>
      </section>

      <LegalCredentials />

      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, count, label, index }: { icon: any, count: string, label: string, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05, z: 50, rotateY: index % 2 === 0 ? 5 : -5 }}
      className="bg-white p-6 sm:p-12 lg:p-16 text-center hover:bg-black group transition-all duration-700 cursor-pointer border-none perspective-1000 transform-gpu shadow-xl sm:shadow-none min-h-[280px] sm:min-h-[400px] flex flex-col justify-center"
    >
      <div className="w-12 h-12 sm:w-16 sm:h-16 border-[2px] border-primary/5 flex items-center justify-center mx-auto mb-6 sm:mb-10 group-hover:border-accent/30 group-hover:bg-accent/5 group-hover:rotate-[360deg] transition-all duration-1000 transform-gpu shrink-0">
        <Icon className="w-5 h-5 sm:w-8 sm:h-8 text-primary group-hover:text-accent transition-colors duration-700" />
      </div>
      <div className="space-y-2 sm:space-y-4">
        <h3 className="text-3xl sm:text-5xl lg:text-6xl font-black text-primary group-hover:text-white tracking-tighter transition-all duration-500 transform-gpu group-hover:scale-105 break-words px-2">
          {count}
        </h3>
        <p className="text-primary/40 group-hover:text-accent/60 font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[7px] sm:text-[9px] transition-colors duration-500 leading-tight px-2">
          {label}
        </p>
      </div>
    </motion.div>
  );
}
