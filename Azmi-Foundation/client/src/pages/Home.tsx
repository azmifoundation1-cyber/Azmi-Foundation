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
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Unsplash image: diverse group of children smiling hope education */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl text-white space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <h1 className="text-5xl md:text-7xl font-bold font-serif leading-tight">
              Giving Hope <br />
              <span className="text-secondary">Building Futures</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-xl">
              Azmi Foundation is dedicated to empowering underserved communities through education, healthcare, and sustainable development initiatives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/donate">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-secondary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  Donate Now
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="border-2 border-white text-primary hover:bg-white hover:text-primary px-8 py-6 text-lg rounded-full bg-white/10 backdrop-blur-sm transition-all duration-300">
                  Our Mission
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white relative -mt-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center hover:-translate-y-2 transition-transform duration-300">
      <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-secondary" />
      </div>
      <h3 className="text-4xl font-bold text-primary mb-2 font-serif">{count}</h3>
      <p className="text-gray-500 font-medium uppercase tracking-wide text-sm">{label}</p>
    </div>
  );
}
