import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-16">
          
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Azmi Foundation" className="h-14 w-auto brightness-0 invert" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed font-light tracking-wide uppercase">
              Promoting interfaith harmony and sustainable development through unity and compassion.
            </p>
            <div className="flex space-x-4 pt-4">
              <SocialIcon Icon={Facebook} />
              <SocialIcon Icon={Twitter} />
              <SocialIcon Icon={Instagram} />
              <SocialIcon Icon={Linkedin} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-8 text-white/50">Navigation</h3>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest text-gray-400">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/programs" className="hover:text-white transition-colors">Our Programs</Link></li>
              <li><Link href="/campaigns" className="hover:text-white transition-colors">Active Campaigns</Link></li>
              <li><Link href="/get-involved" className="hover:text-white transition-colors">Volunteer</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-8 text-white/50">Contact</h3>
            <ul className="space-y-6 text-xs font-bold uppercase tracking-widest text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-white/50 shrink-0" />
                <span>123 NGO Street, Civil Lines,<br />New Delhi, India 110001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-white/50 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-white/50 shrink-0" />
                <span>hello@azmifoundation.org</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-8 text-white/50">Subscribe</h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <Input 
                placeholder="EMAIL ADDRESS" 
                className="bg-white/5 border-white/10 rounded-none text-white placeholder:text-gray-600 focus:border-white/30 font-bold tracking-widest text-[10px]" 
              />
              <Button className="w-full bg-white text-primary hover:bg-gray-200 rounded-none font-black tracking-widest uppercase text-xs py-6">
                JOIN US
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/5 pt-12 text-center text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">
          <p>&copy; {new Date().getFullYear()} Azmi Foundation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ Icon }: { Icon: any }) {
  return (
    <a href="#" className="w-10 h-10 border border-white/10 flex items-center justify-center text-gray-400 hover:border-white hover:text-white transition-all duration-500">
      <Icon className="w-4 h-4" />
    </a>
  );
}
