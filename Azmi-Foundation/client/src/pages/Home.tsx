import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CampaignCard } from "@/components/CampaignCard";
import { useCampaigns } from "@/hooks/use-campaigns";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Globe, Users, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: campaigns, isLoading } = useCampaigns();
  
  // Only show first 3 campaigns on home
  const featuredCampaigns = campaigns?.slice(0, 3) || [];

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 z-0 bg-[#C0C0C0]">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_#FFFFFF_0%,_transparent_70%)] animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20" />
        </div>

        {/* Floating Symbols Overlays */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
           <div className="absolute top-1/4 left-1/4 text-[20rem] animate-bounce duration-[10s]">ॐ</div>
           <div className="absolute top-1/4 right-1/4 text-[20rem] animate-pulse">☪</div>
           <div className="absolute bottom-1/4 left-1/3 text-[20rem] animate-bounce duration-[8s]">✝</div>
           <div className="absolute bottom-1/4 right-1/3 text-[20rem] animate-pulse">☬</div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="space-y-12"
          >
            <div className="inline-block px-4 py-1 border border-primary/20 rounded-full text-primary/60 text-xs font-bold tracking-[0.3em] uppercase mb-4">
              Interfaith Harmony • Unity • Compassion
            </div>
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter metallic-text leading-[0.9]">
              AZMI <br />
              <span className="text-primary/90">FOUNDATION</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary/70 leading-relaxed max-w-3xl mx-auto font-light tracking-wide">
              Empowering communities through the universal language of love and sustainable development.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 pt-8 justify-center">
              <Link href="/donate">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-12 py-8 text-xl rounded-none shadow-2xl transition-all duration-500 uppercase tracking-[0.2em] font-black gold-edge">
                  Donate Now
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-12 py-8 text-xl rounded-none bg-transparent transition-all duration-500 uppercase tracking-[0.2em] font-black">
                  Our Mission
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <StatCard icon={Users} count="15,000+" label="Lives Impacted" />
            <StatCard icon={Globe} count="45+" label="Communities Served" />
            <StatCard icon={Heart} count="2,300+" label="Volunteers" />
            <StatCard icon={Award} count="12" label="Years of Service" />
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="text-secondary font-bold tracking-wider uppercase text-sm">Make a Difference</span>
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-primary">Featured Campaigns</h2>
            <div className="w-24 h-1 bg-secondary mx-auto rounded-full" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <Link href="/campaigns">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white group px-8">
                View All Campaigns <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About / Mission Preview */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="text-secondary font-bold tracking-wider uppercase text-sm">Who We Are</span>
              <h2 className="text-4xl md:text-5xl font-bold font-serif leading-tight">
                Empowering Communities Through Sustainable Change
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                At Azmi Foundation, we believe that every individual deserves access to quality education, healthcare, and opportunities for growth. Our programs are designed to create lasting impact by addressing the root causes of poverty and inequality.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                  <span>Quality Education for All</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                  <span>Accessible Healthcare Services</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                  <span>Women Empowerment Initiatives</span>
                </li>
              </ul>
              <Link href="/about">
                <Button className="bg-white text-primary hover:bg-gray-100 mt-4 rounded-full px-8">
                  Learn More About Us
                </Button>
              </Link>
            </div>
            
            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Unsplash: smiling teacher with student */}
              <img 
                src="https://images.unsplash.com/photo-1577896334538-12056f3d1c9c?w=600&q=80" 
                alt="Education" 
                className="rounded-2xl shadow-xl translate-y-8 w-full h-64 object-cover"
              />
              {/* Unsplash: doctor helping patient in village */}
              <img 
                src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&q=80" 
                alt="Healthcare" 
                className="rounded-2xl shadow-xl w-full h-64 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-secondary/10">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl font-bold font-serif text-primary">Ready to Make an Impact?</h2>
          <p className="text-xl text-gray-600">
            Join our community of changemakers. Whether you donate, volunteer, or intern, your contribution matters.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link href="/get-involved">
               <Button size="lg" className="bg-primary text-white hover:bg-primary/90 px-8 py-6 rounded-full text-lg">
                 Become a Volunteer
               </Button>
             </Link>
             <Link href="/donate">
               <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-white px-8 py-6 rounded-full text-lg">
                 Donate Now
               </Button>
             </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, count, label }: { icon: any, count: string, label: string }) {
  return (
    <div className="metallic-card p-12 text-center hover:-translate-y-4 duration-500 group">
      <div className="w-20 h-20 bg-primary/5 rounded-none flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 gold-edge">
        <Icon className="w-10 h-10 transition-colors" />
      </div>
      <h3 className="text-5xl font-black text-primary mb-2 tracking-tighter">{count}</h3>
      <p className="text-primary/50 font-bold uppercase tracking-[0.2em] text-xs">{label}</p>
    </div>
  );
}
