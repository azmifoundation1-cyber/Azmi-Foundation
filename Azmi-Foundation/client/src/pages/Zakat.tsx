import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Calculator, Heart, ChevronRight, CheckCircle, ShieldCheck } from "lucide-react";

const NISAB_GOLD_GRAMS = 87.48;
const GOLD_PRICE_PER_GRAM_INR = 7200;
const NISAB_INR = NISAB_GOLD_GRAMS * GOLD_PRICE_PER_GRAM_INR;

export default function Zakat() {
  const [cash, setCash] = useState("");
  const [savings, setSavings] = useState("");
  const [gold, setGold] = useState("");
  const [silver, setSilver] = useState("");
  const [investments, setInvestments] = useState("");
  const [businessAssets, setBusinessAssets] = useState("");
  const [liabilities, setLiabilities] = useState("");
  const [result, setResult] = useState<{ total: number; zakat: number; aboveNisab: boolean } | null>(null);

  const calculate = () => {
    const total =
      (Number(cash) || 0) +
      (Number(savings) || 0) +
      (Number(gold) || 0) * GOLD_PRICE_PER_GRAM_INR +
      (Number(silver) || 0) * 85 +
      (Number(investments) || 0) +
      (Number(businessAssets) || 0) -
      (Number(liabilities) || 0);
    const aboveNisab = total >= NISAB_INR;
    setResult({ total: Math.max(0, total), zakat: aboveNisab ? total * 0.025 : 0, aboveNisab });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      {/* Hero */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-accent text-xs font-black uppercase tracking-[0.4em]">Third Pillar of Islam</span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-tight">
            Pay Your Zakat
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Calculate your Zakat and donate directly to 846 families in need in Ahmedabad. Fully transparent. 80G tax receipt provided.
          </p>
          <Link href="/donate">
            <Button className="bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest rounded-none px-8 py-6 mt-4">
              <Heart className="w-4 h-4 mr-2" /> Pay Zakat Now
            </Button>
          </Link>
        </div>
      </section>

      {/* What is Zakat */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight">What is Zakat?</h2>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">The Obligatory Annual Charity in Islam</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 text-gray-700 leading-relaxed text-sm sm:text-base">
            <div className="space-y-4">
              <p>
                Zakat (زكاة) is one of the Five Pillars of Islam — an obligatory annual charity paid by every Muslim who possesses wealth above a minimum threshold (Nisab) for a full lunar year.
              </p>
              <p>
                The word Zakat means "purification" and "growth." By paying Zakat, Muslims purify their wealth and fulfil their duty to support those in need.
              </p>
            </div>
            <div className="space-y-4">
              <p>
                Zakat is calculated at <strong>2.5%</strong> of your total zakatable assets — cash, savings, gold, silver, business goods, and investments — after deducting debts, if your net wealth exceeds the Nisab threshold.
              </p>
              <p>
                For 2026, the Nisab based on gold (87.48g × ₹7,200/g) is approximately <strong>₹{NISAB_INR.toLocaleString()}</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Zakat Calculator */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight">
              <Calculator className="w-6 h-6 inline mr-2 text-accent" />
              Zakat Calculator 2026
            </h2>
            <p className="text-gray-500 text-sm">Enter your assets and liabilities to calculate your Zakat</p>
          </div>
          <div className="bg-white shadow-sm p-8 space-y-5">
            {[
              { label: "Cash in Hand (₹)", key: "cash", setter: setCash, val: cash },
              { label: "Bank Savings & Deposits (₹)", key: "savings", setter: setSavings, val: savings },
              { label: "Gold you own (grams)", key: "gold", setter: setGold, val: gold, note: `₹7,200/g × grams` },
              { label: "Silver you own (grams)", key: "silver", setter: setSilver, val: silver, note: `₹85/g × grams` },
              { label: "Investments & Stocks (₹)", key: "investments", setter: setInvestments, val: investments },
              { label: "Business Assets / Stock-in-trade (₹)", key: "business", setter: setBusinessAssets, val: businessAssets },
              { label: "Debts / Liabilities owed by you (₹)", key: "liabilities", setter: setLiabilities, val: liabilities },
            ].map(({ label, key, setter, val, note }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{label}</label>
                {note && <p className="text-[10px] text-gray-400">{note}</p>}
                <Input
                  type="number"
                  value={val}
                  onChange={e => setter(e.target.value)}
                  className="rounded-none border-2 border-gray-200 focus:border-primary font-bold text-primary h-11"
                  placeholder="0"
                  min="0"
                />
              </div>
            ))}
            <Button
              onClick={calculate}
              className="w-full bg-primary hover:bg-black text-white font-black uppercase tracking-widest rounded-none py-6"
            >
              <Calculator className="w-4 h-4 mr-2" /> Calculate My Zakat
            </Button>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 border-2 space-y-3 ${result.aboveNisab ? "border-accent bg-amber-50" : "border-gray-200 bg-gray-50"}`}
              >
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Your Results</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-600">Net Zakatable Wealth</span>
                  <span className="text-lg font-black text-primary">₹{result.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center border-t border-amber-200 pt-3">
                  <span className="text-sm font-bold text-gray-600">Nisab Threshold (2026)</span>
                  <span className="text-sm font-bold text-gray-500">₹{NISAB_INR.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                {result.aboveNisab ? (
                  <>
                    <div className="flex justify-between items-center bg-accent/10 px-4 py-3 border-l-4 border-accent">
                      <span className="text-base font-black text-primary">Your Zakat Due (2.5%)</span>
                      <span className="text-2xl font-black text-accent">₹{result.zakat.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                    </div>
                    <Link href="/donate">
                      <Button className="w-full bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest rounded-none py-5 mt-2">
                        <Heart className="w-4 h-4 mr-2" /> Pay ₹{result.zakat.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Zakat Now
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-100 p-3">
                    Your wealth is below the Nisab threshold. Zakat is not obligatory, but Sadaqah (voluntary charity) is always encouraged.{" "}
                    <Link href="/sadaqah"><span className="text-accent font-bold cursor-pointer">Give Sadaqah →</span></Link>
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Who Receives Zakat */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight text-center">
            The 8 Categories Eligible for Zakat
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: "1", title: "Al-Fuqara", desc: "The poor who have less than the Nisab" },
              { n: "2", title: "Al-Masakin", desc: "The needy who are in extreme hardship" },
              { n: "3", title: "Zakat Collectors", desc: "Those appointed to administer Zakat" },
              { n: "4", title: "New Muslims", desc: "Those whose hearts are to be reconciled" },
              { n: "5", title: "Freeing Captives", desc: "Those in bondage or enslaved" },
              { n: "6", title: "Debtors", desc: "Those overwhelmed by debt" },
              { n: "7", title: "Fi Sabilillah", desc: "In the cause of Allah" },
              { n: "8", title: "Wayfarers", desc: "Travellers stranded without resources" },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-gray-50 border border-gray-100 p-4 space-y-2">
                <span className="text-accent text-xl font-black">{n}.</span>
                <h3 className="font-black text-primary text-sm uppercase tracking-tight">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm">
            Reference: Surah At-Tawbah (9:60) — <em>"Zakah expenditures are only for the poor and for the needy..."</em>
          </p>
        </div>
      </section>

      {/* Why Azmi Foundation */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Why Pay Zakat Through Azmi Foundation?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <ShieldCheck className="w-8 h-8 text-accent mx-auto mb-3" />, title: "80G Tax Exempt", desc: "Reg: AAGTA9354BF20261. Auto-generated PDF receipt on every donation." },
              { icon: <CheckCircle className="w-8 h-8 text-accent mx-auto mb-3" />, title: "Direct Impact", desc: "₹680 = 1 grocery kit for 1 family. 100% reaches the recipient." },
              { icon: <Heart className="w-8 h-8 text-accent mx-auto mb-3" />, title: "18 Years of Trust", desc: "Dr. Shahbaaz Azmi has fed 2 lakh+ people. Your Zakat is in safe hands." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white/10 p-6 space-y-2 text-center">
                {icon}
                <h3 className="font-black uppercase tracking-tight text-sm">{title}</h3>
                <p className="text-white/70 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <Link href="/donate">
            <Button className="bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest rounded-none px-10 py-6">
              <Heart className="w-4 h-4 mr-2" /> Pay Zakat to Azmi Foundation
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
