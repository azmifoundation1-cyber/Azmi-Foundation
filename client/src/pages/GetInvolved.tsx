import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useCreateRegistration } from "@/hooks/use-registrations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HandHeart, GraduationCap, Users } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

// Schema for registration form details
const detailsSchema = z.object({
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(5, "Address is required"),
  motivation: z.string().min(20, "Please tell us more about why you want to join"),
  skills: z.string().optional(),
});

export default function GetInvolved() {
  useSEO({
    title: "Get Involved — Volunteer, Member, Intern",
    description: "Join Azmi Foundation as a volunteer, member, or intern. Be part of the movement changing lives across Ahmedabad and beyond.",
    url: "/get-involved",
  });
  const { user } = useAuth();
  const mutation = useCreateRegistration();

  const form = useForm({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      phone: "",
      address: "",
      motivation: "",
      skills: "",
    },
  });

  const onSubmit = (type: "volunteer" | "member" | "intern") => (data: z.infer<typeof detailsSchema>) => {
    mutation.mutate({
      userId: user?.id!,
      type,
      details: data,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-md w-full text-center p-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-primary mb-4">Join Our Community</h2>
            <p className="text-gray-600 mb-8">
              To apply as a volunteer, member, or intern, please sign in to your account first.
            </p>
            <a href="/api/login">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white">Sign In to Continue</Button>
            </a>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <div className="bg-secondary/10 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-6">Get Involved</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your time and skills can transform lives. Choose how you'd like to contribute.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 w-full">
        <Tabs defaultValue="volunteer" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-12 h-auto p-1 bg-gray-100 rounded-full">
            <TabsTrigger value="volunteer" className="py-3 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
              <div className="flex items-center gap-2">
                <HandHeart className="w-4 h-4" /> Volunteer
              </div>
            </TabsTrigger>
            <TabsTrigger value="member" className="py-3 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Member
              </div>
            </TabsTrigger>
            <TabsTrigger value="intern" className="py-3 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">
               <div className="flex items-center gap-2">
                 <GraduationCap className="w-4 h-4" /> Intern
               </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="volunteer">
            <RegistrationForm 
              title="Become a Volunteer" 
              description="Join our on-ground team and directly impact communities."
              onSubmit={form.handleSubmit(onSubmit("volunteer"))}
              form={form}
              mutation={mutation}
            />
          </TabsContent>
          
          <TabsContent value="member">
            <RegistrationForm 
              title="Become a Member" 
              description="Be part of our core network and decision making process."
              onSubmit={form.handleSubmit(onSubmit("member"))}
              form={form}
              mutation={mutation}
            />
          </TabsContent>

          <TabsContent value="intern">
            <RegistrationForm 
              title="Apply for Internship" 
              description="Gain valuable experience while working for social good."
              onSubmit={form.handleSubmit(onSubmit("intern"))}
              form={form}
              mutation={mutation}
            />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

function RegistrationForm({ title, description, onSubmit, form, mutation }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-primary">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills / Profession</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Teaching, Medical, Management..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why do you want to join?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us a bit about yourself and your motivation..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-secondary hover:bg-secondary/90 text-white"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
