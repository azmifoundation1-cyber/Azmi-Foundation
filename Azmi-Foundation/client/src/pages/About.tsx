import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Users, Target, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      
      {/* Page Header */}
      <div className="bg-primary text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://pixabay.com/get/g0dd799f3446ffde635d941f5cd714896bd70993c86860ec63a8d9a940ee9b1c353596da7460d0f26579991cad03208acadf6cdf5098e1857a463c6458ac2a105_1280.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-bold font-serif mb-6">About Us</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Driven by compassion, guided by integrity. We are dedicated to creating a world where everyone has the opportunity to thrive.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="bg-secondary/5 p-10 rounded-3xl border border-secondary/10">
              <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold font-serif text-primary mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                To empower marginalized communities through sustainable development programs in education, healthcare, and livelihood, ensuring dignity and equal opportunities for all.
              </p>
            </div>
            <div className="bg-blue-50 p-10 rounded-3xl border border-blue-100">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold font-serif text-primary mb-4">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                A just, equitable, and compassionate society where every individual has access to the resources they need to lead a healthy, productive, and dignified life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <span className="text-secondary font-bold tracking-wider uppercase text-sm">Leadership</span>
             <h2 className="text-4xl font-bold font-serif text-primary mt-2">Meet Our Team</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TeamMember 
              name="Dr. Sarah Azmi" 
              role="Founder & Chairperson" 
              image="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80" 
            />
            <TeamMember 
              name="Rajesh Kumar" 
              role="Program Director" 
              image="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&q=80" 
            />
            <TeamMember 
              name="Priya Singh" 
              role="Head of Operations" 
              image="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80" 
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function TeamMember({ name, role, image }: { name: string, role: string, image: string }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
      <div className="h-80 overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold text-primary font-serif">{name}</h3>
        <p className="text-secondary font-medium">{role}</p>
      </div>
    </div>
  );
}
