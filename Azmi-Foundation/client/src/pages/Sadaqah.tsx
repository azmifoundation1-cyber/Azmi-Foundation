import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, Star, Droplets, BookOpen, Users, Home, Utensils } from "lucide-react";

const SADAQAH_TYPES = [
  { icon: <Utensils className="w-6 h-6 text-accent" />, title: "Food for Families", desc: "₹680 provides a weekly grocery kit for one family — the most direct Sadaqah Jariyah.", amount: 680 },
  { icon: <BookOpen className="w-6 h-6 text-accent" />, title: "Education Fund", desc: "Support a child's education — books, fees, and materials. Knowledge benefits for a lifetime.", amount: 1000 },
  { icon: <Droplets className="w-6 h-6 text-accent" />, title: "Clean Water", desc: "Fund clean water access for communities. Water is among the best Sadaqah Jariyah causes.", amount: 2000 },
  { icon: <Users className="w-6 h-6 text-accent" />, title: "Feed 10 Families", desc: "₹6,800 provides grocery kits to 10 families for a full week.", amount: 6800 },
  { icon: <Home className="w-6 h-6 text-accent" />, title: "Healthcare Support", desc: "Fund medical aid and healthcare outreach for families who cannot afford treatment.", amount: 5000 },
  { icon: <Star className="w-6 h-6 text-accent" />, title: "General Fund", desc: "Donate any amount to the general welfare fund. Every rupee reaches those in need.", amount: 500 },
];

export default function Sadaqah() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      {/* Hero */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-accent text-xs font-black uppercase tracking-[0.4em]">Continuous Charity</span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight">
            Sadaqah Jariyah
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Give charity that keeps giving long after you. Fund food, education, and welfare for 846 families in Ahmedabad — a cause that earns reward until the Day of Judgement.
          </p>
          <Link href="/donate">
            <Button className="bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest rounded-none px-8 py-6 mt-4">
              <Heart className="w-4 h-4 mr-2" /> Give Sadaqah Now
            </Button>
          </Link>
        </div>
      </section>

      {/* What is Sadaqah */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight">What is Sadaqah Jariyah?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 text-gray-700 text-sm sm:text-base leading-relaxed">
              <p>
                Sadaqah (صدقة) means voluntary charity in Islam — any act of generosity done for the sake of Allah. Unlike Zakat, which is obligatory, Sadaqah can be given at any time, in any amount.
              </p>
              <p>
                Sadaqah Jariyah (صدقة جارية) is <strong>"continuous charity"</strong> — an act whose reward continues flowing even after you pass away. The Prophet ﷺ said:
              </p>
              <blockquote className="border-l-4 border-accent pl-4 bg-amber-50 py-3 pr-3 italic text-gray-600">
                "When a person dies, their deeds come to an end except for three: Sadaqah Jariyah, beneficial knowledge, or a righteous child who prays for them."
                <span className="block text-xs font-bold mt-1 not-italic text-gray-500">— Sahih Muslim 1631</span>
              </blockquote>
            </div>
            <div className="space-y-4 text-gray-700 text-sm sm:text-base leading-relaxed">
              <p>
                At Azmi Foundation, your Sadaqah directly funds food for 2,000+ people every single day. Every family fed, every child educated, every life improved — the reward continues to flow back to you.
              </p>
              <p>
                Feeding the hungry is among the highest forms of Sadaqah Jariyah. Allah says in the Quran:
              </p>
              <blockquote className="border-l-4 border-accent pl-4 bg-amber-50 py-3 pr-3 italic text-gray-600">
                "Or feeding on a day of severe hunger — an orphan of near relationship, or a needy person in misery."
                <span className="block text-xs font-bold mt-1 not-italic text-gray-500">— Surah Al-Balad (90:14-16)</span>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Sadaqah Causes */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight">Best Sadaqah Causes at Azmi Foundation</h2>
            <p className="text-gray-500 text-sm">Choose a cause — every rupee reaches those in need directly</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SADAQAH_TYPES.map(({ icon, title, desc, amount }) => (
              <motion.div
                key={title}
                whileHover={{ y: -4 }}
                className="bg-white border border-gray-100 p-6 space-y-3 shadow-sm"
              >
                <div className="w-12 h-12 bg-primary/5 flex items-center justify-center">{icon}</div>
                <h3 className="font-black text-primary text-sm uppercase tracking-tight">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                <Link href={`/donate?amount=${amount}`}>
                  <Button className="w-full bg-primary hover:bg-black text-white font-black uppercase tracking-widest rounded-none py-3 text-xs mt-2">
                    Give ₹{amount.toLocaleString("en-IN")}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Types of Sadaqah */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight text-center">7 Types of Sadaqah Jariyah in Islam</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { n: "1", title: "Feeding the Hungry", desc: "Providing food to the poor — mentioned directly in the Quran as among the highest good deeds." },
              { n: "2", title: "Building a Mosque", desc: "Financing a place of worship that benefits the community for generations." },
              { n: "3", title: "Planting a Tree", desc: "Any creation — human, animal, or bird — that benefits from it earns you reward." },
              { n: "4", title: "Building a Well / Water Source", desc: "Clean water given as Sadaqah is among the most rewarded causes in hadith." },
              { n: "5", title: "Funding Education", desc: "Beneficial knowledge that outlives you — teaching Quran, funding schools, sponsoring students." },
              { n: "6", title: "Caring for Orphans", desc: "The Prophet ﷺ said he and the caretaker of orphans will be like these two fingers in Paradise." },
              { n: "7", title: "Leaving a Righteous Child", desc: "Raising a child who prays for you after your death — the greatest ongoing Sadaqah." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex gap-4 bg-gray-50 p-5 border border-gray-100">
                <span className="text-accent text-2xl font-black shrink-0">{n}.</span>
                <div>
                  <h3 className="font-black text-primary text-sm uppercase tracking-tight mb-1">{title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto space-y-5">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Give Sadaqah That Never Stops</h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Every ₹680 you give feeds one family for a week. 846 families. 2,000+ people fed every day. Your Sadaqah Jariyah with Azmi Foundation is a chain of reward that continues long after you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/donate">
              <Button className="bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest rounded-none px-8 py-6">
                <Heart className="w-4 h-4 mr-2" /> Give Sadaqah Now
              </Button>
            </Link>
            <Link href="/campaigns/3">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary font-black uppercase tracking-widest rounded-none px-8 py-6">
                View Emergency Campaign
              </Button>
            </Link>
          </div>
          <p className="text-white/60 text-xs">80G tax exemption · Reg: AAGTA9354BF20261 · 100% transparent</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
