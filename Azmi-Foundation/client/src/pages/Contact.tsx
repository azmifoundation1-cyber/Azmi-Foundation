import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Instagram, Facebook, Linkedin, Landmark, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background perspective-1000">
      <Navbar />
      
      {/* 4K Hero Header */}
      <div className="bg-primary py-32 sm:py-48 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&q=80')] bg-cover bg-center mix-blend-overlay scale-110 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/80 to-primary/95" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-6xl sm:text-9xl font-black tracking-tighter text-white uppercase leading-[0.8] mb-8 drop-shadow-2xl">
              Connect <br /> <span className="text-white/30 italic">With Us</span>
            </h1>
            <p className="text-lg sm:text-2xl text-white/70 max-w-3xl mx-auto font-medium tracking-tight uppercase">
              Bridging Hearts, Building Hope. Every message counts.
            </p>
          </motion.div>
        </div>
      </div>

      <section className="py-24 sm:py-40 relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            
            {/* Contact Details */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-16"
            >
              <div className="space-y-8">
                <h2 className="text-4xl sm:text-6xl font-black text-primary uppercase leading-none tracking-tighter">
                  Registered <br /> <span className="text-primary/20">Office</span>
                </h2>
                <div className="flex gap-6 items-start group">
                  <div className="w-12 h-12 border-2 border-primary/10 flex items-center justify-center shrink-0 group-hover:border-accent transition-colors duration-500">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-primary/70 text-sm sm:text-lg font-bold uppercase tracking-widest leading-relaxed">
                    Gomtipur Bridge East-End,<br />
                    Opposite Kamdar Maidan,<br />
                    Gomtipur, Ahmedabad – 380021,<br />
                    Gujarat, India
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <h2 className="text-4xl sm:text-6xl font-black text-primary uppercase leading-none tracking-tighter">
                  Stay <br /> <span className="text-primary/20">Connected</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <SocialLink 
                    href="https://instagram.com/azmi_foundation" 
                    icon={Instagram} 
                    label="Instagram"
                    subLabel="@azmi_foundation"
                  />
                  <SocialLink 
                    href="https://facebook.com/azmifoundation" 
                    icon={Facebook} 
                    label="Facebook"
                    subLabel="azmifoundation"
                  />
                  <SocialLink 
                    href="https://linkedin.com/company/azmi-foundation" 
                    icon={Linkedin} 
                    label="LinkedIn"
                    subLabel="azmi-foundation"
                  />
                </div>
              </div>
            </motion.div>

            {/* Donation Details */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="metallic-card p-12 sm:p-20 space-y-12 gold-edge relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Landmark className="w-48 h-48" />
              </div>
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 border border-accent/20 text-accent text-[10px] font-black tracking-[0.4em] uppercase">
                  <ShieldCheck className="w-3 h-3" /> Tax-Exempt 80G
                </div>
                <h3 className="text-4xl font-black text-primary uppercase tracking-tighter">Bank Details</h3>
              </div>

              <div className="space-y-8 text-primary/70 font-bold uppercase tracking-widest text-sm">
                <div className="pb-6 border-b border-primary/5">
                  <p className="text-[10px] text-primary/30 mb-2">Account Name</p>
                  <p className="text-xl text-primary">AZMI FOUNDATION</p>
                </div>
                <div className="pb-6 border-b border-primary/5">
                  <p className="text-[10px] text-primary/30 mb-2">Account Number</p>
                  <p className="text-xl text-primary">921020009805552</p>
                </div>
                <div className="pb-6 border-b border-primary/5">
                  <p className="text-[10px] text-primary/30 mb-2">IFSC Code</p>
                  <p className="text-xl text-primary">UTIB0000453</p>
                </div>
                <div>
                  <p className="text-[10px] text-primary/30 mb-2">Bank & Branch</p>
                  <p className="text-primary">Axis Bank, Relief Road, Ahmedabad</p>
                </div>
              </div>

              <div className="pt-8">
                <p className="text-[10px] text-primary/40 leading-relaxed italic">
                  * All donations are tax-exempt under section 80G. Your contribution sparks the next wave of positive change.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SocialLink({ href, icon: Icon, label, subLabel }: { href: string, icon: any, label: string, subLabel: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group space-y-4 block"
    >
      <div className="w-12 h-12 border-2 border-primary/10 flex items-center justify-center group-hover:border-accent group-hover:bg-accent/5 transition-all duration-500">
        <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div>
        <div className="text-[10px] font-black text-primary uppercase tracking-widest">{label}</div>
        <div className="text-[8px] text-primary/40 font-bold uppercase tracking-widest">{subLabel}</div>
      </div>
    </a>
  );
}
