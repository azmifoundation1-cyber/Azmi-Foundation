import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Users, Target, Heart, Shield, Award, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background perspective-1000">
      <Navbar />
      
      {/* 4K Hero Header */}
      <div className="bg-primary py-32 sm:py-48 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&q=80')] bg-cover bg-center mix-blend-overlay scale-110 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/80 to-primary/95" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-4xl sm:text-7xl lg:text-9xl font-black tracking-tighter text-white uppercase leading-[0.85] mb-8 drop-shadow-2xl">
              About <br /> <span className="text-white/30 italic">AZMI Foundation</span>
            </h1>
            <p className="text-lg sm:text-2xl text-white/70 max-w-3xl mx-auto font-medium tracking-tight">
              Feeding families, funding education, and building community in Ahmedabad since 2018.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Origin Story Section */}
      <section className="py-24 sm:py-40 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
              <div className="inline-block px-4 py-1 border border-primary/20 rounded-none text-primary/60 text-[10px] font-black tracking-[0.4em] uppercase">
                Established July 23, 2018
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-primary uppercase leading-none tracking-tighter">
                Our Legacy <br /> of <span className="text-primary/30">Unity</span>
              </h2>
              <div className="space-y-6 text-primary/70 text-sm sm:text-lg leading-relaxed font-medium">
                <p>
                  Azmi Foundation is a registered charitable trust (Reg. No. E/22280/AHMEDABAD) based in Gomtipur, Ahmedabad. We started in 2018 with a single purpose: make sure no family in our city goes to bed hungry.
                </p>
                <p>
                  We serve everyone — Hindu, Muslim, Christian, Sikh, and every other community. Hunger doesn't ask your religion, and neither do we. Over 18 years, we have directly fed more than 2 lakh individuals across Ahmedabad.
                </p>
                <p>
                  Dr. Shahbaaz Azmi took over the foundation at just 18 years old and has been running daily food distributions ever since — funded entirely through donations, with zero administrative fees taken from the public.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="relative aspect-square metallic-card p-4 gold-edge"
            >
              <img 
                src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80" 
                alt="Azmi Foundation Impact" 
                className="w-full h-full object-cover"
              />
              <div className="absolute -bottom-10 -right-10 bg-primary p-12 hidden lg:block gold-edge">
                <div className="text-white text-5xl font-black tracking-tighter">4,300+</div>
                <div className="text-white/40 text-[8px] font-black uppercase tracking-[0.3em]">Individuals Fed</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision - 3D Cards */}
      <section className="py-24 sm:py-40 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div 
              whileHover={{ y: -10, rotateX: 5 }}
              className="metallic-card p-12 sm:p-20 space-y-8 gold-edge"
            >
              <Target className="w-12 h-12 text-accent" />
              <h2 className="text-4xl sm:text-5xl font-black text-primary uppercase tracking-tighter">Our Mission</h2>
              <p className="text-primary/60 leading-relaxed font-medium text-sm sm:text-base">
                To feed, educate, and care for families in Ahmedabad who need it most — openly, without discrimination, and with full transparency on how every rupee is used.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10, rotateX: -5 }}
              className="metallic-card p-12 sm:p-20 space-y-8 gold-edge"
            >
              <Heart className="w-12 h-12 text-accent" />
              <h2 className="text-4xl sm:text-5xl font-black text-primary uppercase tracking-tighter">Our Vision</h2>
              <p className="text-primary/60 leading-relaxed font-medium text-sm sm:text-base">
                An Ahmedabad where no child skips a meal, no family is turned away because of their faith, and every person — regardless of where they were born — has access to basic dignity.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Leadership Profile */}
      <section className="py-24 sm:py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <span className="text-accent font-black tracking-[0.5em] uppercase text-[10px]">The People Behind the Work</span>
            <h2 className="text-5xl sm:text-8xl font-black text-primary uppercase tracking-tighter mt-4 leading-none">
              Our <br /> <span className="text-primary/20 italic">Leadership</span>
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="metallic-card overflow-hidden grid grid-cols-1 md:grid-cols-2 gold-edge"
            >
              <div className="h-[400px] md:h-auto overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&q=80" 
                  alt="Shahbaaz Azmi" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-12 sm:p-16 flex flex-col justify-center space-y-6">
                <div>
                  <h3 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">Leadership</h3>
                  <p className="text-accent font-black uppercase tracking-[0.3em] text-[10px] mt-2">Managing Trustees & Directors</p>
                </div>
                <div className="space-y-4">
                  <p className="text-primary/70 text-sm font-bold uppercase tracking-widest leading-relaxed">
                    DR AZHAR AZMI • ZEBA AZMI • ZAKIYA AZMI • DR SHAHBAAZ AZMI
                  </p>
                  <p className="text-primary/50 text-[10px] font-bold uppercase tracking-widest leading-relaxed italic">
                    Serving Ahmedabad since 2018 — running daily distributions, managing field operations, and ensuring every donation reaches the right family.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-primary/40 text-[10px] font-black uppercase tracking-widest pt-4">
                  <MapPin className="w-4 h-4" /> Gomtipur, Ahmedabad
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
