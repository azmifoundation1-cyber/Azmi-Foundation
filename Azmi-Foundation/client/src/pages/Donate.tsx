import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCreateDonation } from "@/hooks/use-campaigns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart } from "lucide-react";

// Donation schema for frontend validation
const donationFormSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  donorName: z.string().min(2, "Name is required"),
  donorEmail: z.string().email("Valid email is required"),
  isAnonymous: z.boolean().default(false),
});

export default function Donate() {
  const mutation = useCreateDonation();
  const form = useForm({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      amount: 50,
      donorName: "",
      donorEmail: "",
      isAnonymous: false,
    },
  });

  const onSubmit = (data: z.infer<typeof donationFormSchema>) => {
    mutation.mutate({
      ...data,
      amount: data.amount.toString(), // Convert to string/decimal for backend
      status: "completed", // Auto-complete for mock
      paymentId: `mock_${Date.now()}`
    });
  };

  const presetAmounts = [10, 50, 100, 500];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Navbar />

      <div className="flex-grow py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Info */}
          <div className="space-y-8">
             <div className="space-y-4">
               <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary">Make a Donation</h1>
               <p className="text-xl text-gray-600 leading-relaxed">
                 Your generous donation supports our mission to provide education, healthcare, and resources to those in need. Every dollar counts.
               </p>
             </div>
             
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                   <Heart className="w-5 h-5 text-secondary fill-current" />
                   Why Donate?
                </h3>
                <ul className="space-y-3 text-gray-600">
                   <li className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2" />
                      <span>$50 provides school supplies for one child for a year.</span>
                   </li>
                   <li className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2" />
                      <span>$100 funds a health checkup camp for 20 people.</span>
                   </li>
                   <li className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary mt-2" />
                      <span>$500 supports vocational training for 5 women.</span>
                   </li>
                </ul>
             </div>
          </div>

          {/* Right Column: Form */}
          <Card className="shadow-xl border-none">
            <CardHeader className="bg-primary text-white rounded-t-xl py-6">
              <CardTitle className="text-2xl font-serif text-center">Secure Donation</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Amount Selection */}
                  <div className="space-y-4">
                    <FormLabel>Select Amount</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {presetAmounts.map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant={form.watch("amount") === amt ? "default" : "outline"}
                          className={`
                            ${form.watch("amount") === amt ? 'bg-secondary hover:bg-secondary/90 text-white' : 'hover:border-secondary hover:text-secondary'}
                          `}
                          onClick={() => form.setValue("amount", amt)}
                        >
                          ${amt}
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
                              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                              <Input type="number" className="pl-8" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Personal Details */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="donorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
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
                            <Input type="email" placeholder="john@example.com" {...field} />
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
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Make this donation anonymous</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-secondary hover:bg-secondary/90 text-white py-6 text-lg shadow-lg shadow-secondary/20"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Processing..." : `Donate $${form.watch("amount")}`}
                  </Button>
                  
                  <p className="text-xs text-center text-gray-400 mt-4">
                    Secure payment processing via Stripe. All donations are tax-deductible.
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
