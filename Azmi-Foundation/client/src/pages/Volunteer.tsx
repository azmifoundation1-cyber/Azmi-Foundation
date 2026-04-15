import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Heart, Users, Clock, MapPin, Laptop, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROLES = [
  { icon: <Utensils />, title: "Food Distribution", type: "On-Site", desc: "Join our daily food drives in Ahmedabad — help pack and distribute meals to 2,000+ people." },
  { icon: <Laptop />, title: "Digital Marketing", type: "Remote", desc: "Help grow our social media, create content, run campaigns, and spread our mission online." },
  { icon: <Heart />, title: "Fundraising", type: "Remote / On-Site", desc: "Organize local fundraising events, approach donors, and help us reach our campaign goals." },
  { icon: <Users />, title: "Community Outreach", type: "On-Site", desc: "Visit slums and footpath communities in Ahmedabad to identify and register families in need." },
  { icon: <Clock />, title: "Admin & Documentation", type: "Remote", desc: "Help maintain records, prepare impact reports, and assist with 80G receipt processing." },
  { icon: <MapPin />, title: "Event Coordination", type: "On-Site", desc: "Coordinate food distribution events, Eid drives, and community welfare programs." },
];

function Utensils() {
  return (
    <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export default function Volunteer() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject: `Volunteer Application — ${role || "General"}`, message: `City: ${city}\nRole: ${role}\n\n${message}` }),
      });
      setSubmitted(true);
    } catch {
      toast({ title: "Submission failed. Please email us directly.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      {/* Hero */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-accent text-xs font-black uppercase tracking-[0.4em]">Join the Mission</span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight">
            Volunteer With Us
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Be the hands of the Ummah. Join Azmi Foundation volunteers who help feed 2,000+ people daily in Ahmedabad. Remote and on-site roles available.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 px-4 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { n: "2,000+", label: "People Fed Daily" },
            { n: "846", label: "Families Supported" },
            { n: "18", label: "Years of Service" },
            { n: "100%", label: "Volunteer Driven" },
          ].map(({ n, label }) => (
            <div key={label} className="space-y-1">
              <p className="text-3xl font-black text-primary">{n}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Volunteer Roles */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight">Volunteer Roles</h2>
            <p className="text-gray-500 text-sm">Choose a role that fits your time and skills</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ROLES.map(({ title, type, desc }) => (
              <motion.div
                key={title}
                whileHover={{ y: -3 }}
                className="bg-white border border-gray-100 p-6 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-primary text-sm uppercase tracking-tight">{title}</h3>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${type === "Remote" ? "bg-green-100 text-green-700" : type === "On-Site" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {type}
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight">Apply to Volunteer</h2>
            <p className="text-gray-500 text-sm">We will contact you within 48 hours</p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border-2 border-green-200 p-10 text-center space-y-4"
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="text-xl font-black text-primary uppercase">JazakAllahu Khayran!</h3>
              <p className="text-gray-600 text-sm">We have received your application. Our team will contact you within 48 hours to discuss your role.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-100 p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Full Name *</label>
                  <Input value={name} onChange={e => setName(e.target.value)} className="rounded-none border-2 border-gray-200 focus:border-primary h-11 font-bold" placeholder="Your name" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Email *</label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-none border-2 border-gray-200 focus:border-primary h-11 font-bold" placeholder="your@email.com" required />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Phone *</label>
                  <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-none border-2 border-gray-200 focus:border-primary h-11 font-bold" placeholder="10-digit number" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Your City</label>
                  <Input value={city} onChange={e => setCity(e.target.value)} className="rounded-none border-2 border-gray-200 focus:border-primary h-11 font-bold" placeholder="City, State" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Preferred Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full border-2 border-gray-200 focus:border-primary h-11 font-bold text-primary px-3 bg-white text-sm">
                  <option value="">Select a role</option>
                  {ROLES.map(r => <option key={r.title} value={r.title}>{r.title} ({r.type})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Tell Us About Yourself</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full border-2 border-gray-200 focus:border-primary font-bold text-primary px-3 py-2 bg-white text-sm resize-none outline-none" placeholder="Skills, availability, why you want to volunteer..." />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-black text-white font-black uppercase tracking-widest rounded-none py-6">
                <Heart className="w-4 h-4 mr-2" /> Submit Application
              </Button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
