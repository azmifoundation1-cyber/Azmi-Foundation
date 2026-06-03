import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePrograms } from "@/hooks/use-programs";
import { Loader2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";

export default function Programs() {
  const { data: programs, isLoading } = usePrograms();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <div className="bg-primary text-white py-20">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold font-serif mb-6">Our Programs</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
               Sustainable initiatives designed to create lasting impact in the communities we serve.
            </p>
         </div>
      </div>

      <div className="flex-grow py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-12 h-12 text-secondary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {programs?.map((program) => (
                <Card key={program.id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="h-64 overflow-hidden relative">
                    <img 
                      src={program.imageUrl || "https://images.unsplash.com/photo-1542601906990-b4d3fb7d5763?w=800&q=80"} 
                      alt={program.title}
                      className="w-full h-full object-cover"
                    />
                    {program.date && (
                       <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
                          <div className="flex items-center gap-2 text-primary font-bold">
                             <Calendar className="w-4 h-4 text-secondary" />
                             {format(new Date(program.date), "MMM d, yyyy")}
                          </div>
                       </div>
                    )}
                  </div>
                  <CardHeader>
                    <h3 className="text-2xl font-bold font-serif text-primary">{program.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{program.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
