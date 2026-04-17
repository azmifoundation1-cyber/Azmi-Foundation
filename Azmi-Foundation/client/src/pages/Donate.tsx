import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const donationFormSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least ₹1"),
  donorName: z.string().min(2, "Name is required"),
  donorEmail: z.string().email("Valid email is required"),
  isAnonymous: z.boolean().default(false),
});

export default function Donate() {
  const [donating, setDonating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const campaignId = params.get("campaignId") ? Number(params.get("campaignId")) : null;

  const form = useForm({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      amount: 500,
      donorName: "",
      donorEmail: "",
      isAnonymous: false,
    },
  });

  const presetAmounts = [500, 1000, 2000, 5000];

  const onSubmit = async (data: z.infer<typeof donationFormSchema>) => {
    setDonating(true);
    try {
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.body.appendChild(script);
        });
      }

      const keyRes = await fetch("/api/razorpay/key");
      const { key } = await keyRes.json();

      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: data.amount }),
      });
      if (!orderRes.ok) throw new Error("Order creation failed");
      const { orderId, amount: orderAmount, currency } = await orderRes.json();

      const rzp = new window.Razorpay({
        key,
        amount: orderAmount,
        currency,
        order_id: orderId,
        name: "AZMI Foundation",
        description: "Donation to AZMI Foundation",
        image: "/azmi-logo.png",
        prefill: {
          name: data.isAnonymous ? "" : data.donorName,
          email: data.isAnonymous ? "" : data.donorEmail,
        },
        theme: { color: "#1a1a2e" },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                campaignId: campaignId || 1,
                amount: String(data.amount),
                donorName: data.isAnonymous ? "Anonymous" : data.donorName,
                donorEmail: data.donorEmail || null,
                isAnonymous: data.isAnonymous,
              }),
            });
            if (!verifyRes.ok) throw new Error("Verification failed");

            // Meta Pixel — fire Purchase event on confirmed donation
            try {
              if (typeof (window as any).fbq === "function") {
                (window as any).fbq("track", "Purchase", {
                  value: data.amount,
                  currency: "INR",
                  content_name: "Donation",
                  content_type: "donation",
                });
              }
            } catch (_) {}

            toast({ title: "Donation Successful!", description: "Thank you for your generous support." });
            if (campaignId) {
              queryClient.invalidateQueries({ queryKey: ["/api/donations/campaign", campaignId] });
              queryClient.invalidateQueries({ queryKey: ["/api/campaigns", campaignId] });
            }
            queryClient.invalidateQueries({ queryKey: ["/api/campaigns/featured"] });
            setDonating(false);
            form.reset();
          } catch {
            toast({ title: "Payment recorded", description: "Thank you! Our team will confirm shortly.", variant: "destructive" });
            setDonating(false);
          }
        },
        modal: { ondismiss: () => setDonating(false) },
      });
      rzp.open();
    } catch (err) {
      toast({ title: "Payment Error", description: "Could not initiate payment. Please try again.", variant: "destructive" });
      setDonating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Navbar />

      <div className="flex-grow py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary">Make a Donation</h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Your generous donation supports our mission to provide education, healthcare, and resources to those in need.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Heart className="w-5 h-5 text-accent fill-current" />
                Why Donate?
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                  <span>₹500 provides school supplies for one child for a month.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                  <span>₹1,000 funds meals for 50 people for a day.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                  <span>₹5,000 supports vocational training for 5 women.</span>
                </li>
              </ul>
            </div>
          </div>

          <Card className="shadow-xl border-none">
            <CardHeader className="bg-primary text-white rounded-t-xl py-6">
              <CardTitle className="text-2xl font-serif text-center">Secure Donation via Razorpay</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <div className="space-y-4">
                    <FormLabel>Select Amount (₹)</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {presetAmounts.map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant={form.watch("amount") === amt ? "default" : "outline"}
                          className={form.watch("amount") === amt ? "bg-primary text-white" : "hover:border-primary hover:text-primary"}
                          onClick={() => form.setValue("amount", amt)}
                        >
                          ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                        </Button>
                      ))}
                    </div>
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                              <Input type="number" className="pl-8" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="donorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="donorEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isAnonymous"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Make this donation anonymous</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-black text-white py-6 text-lg"
                    disabled={donating}
                  >
                    {donating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      `Donate ₹${form.watch("amount")}`
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-400 mt-4">
                    Secure payment processing via Razorpay. Supports UPI, Cards, Net Banking & Wallets.
                  </p>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
