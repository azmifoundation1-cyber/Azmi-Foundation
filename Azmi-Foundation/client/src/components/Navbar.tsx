import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart, User, Shield } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/programs", label: "Programs" },
    { href: "/campaigns", label: "Campaigns" },
    { href: "/contact", label: "Contact" },
    { href: "/get-involved", label: "Get Involved" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 w-full glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer group">
              <img src="/logo.png" alt="Azmi Foundation" className="h-14 w-auto drop-shadow-md" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={`
                text-sm font-bold tracking-widest uppercase transition-colors duration-200 cursor-pointer relative py-2
                ${isActive(link.href) ? 'text-primary' : 'text-primary/70 hover:text-primary'}
              `}>
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full overflow-hidden border border-primary/20 hover:border-accent transition-colors">
                     {user.profileImageUrl ? (
                       <img src={user.profileImageUrl} alt={user.firstName || 'User'} className="h-full w-full object-cover" />
                     ) : (
                       <User className="h-5 w-5 text-primary" />
                     )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 glass-nav">
                   <Link href="/dashboard">
                     <DropdownMenuItem className="cursor-pointer font-bold uppercase tracking-wider">My Dashboard</DropdownMenuItem>
                   </Link>
                   {(user as any)?.role === "admin" && (
                     <Link href="/admin">
                       <DropdownMenuItem className="cursor-pointer font-bold uppercase tracking-wider text-purple-600 flex items-center gap-2">
                         <Shield className="w-3.5 h-3.5" /> Admin Panel
                       </DropdownMenuItem>
                     </Link>
                   )}
                   <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600 font-bold uppercase tracking-wider">
                     Logout
                   </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <a href="/api/login">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white transition-all font-bold uppercase tracking-widest">
                  Sign In
                </Button>
              </a>
            )}

            <Link href="/donate">
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold tracking-widest uppercase shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 rounded-none px-6 gold-edge">
                Donate Now
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="ghost" className="h-8 w-8 rounded-full overflow-hidden border border-primary/20">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="User" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </Button>
              </Link>
            ) : (
              <Link href="/donate">
                <Button size="sm" className="bg-primary text-white text-[10px] uppercase font-black tracking-widest px-3 h-8 rounded-none gold-edge">
                  Donate
                </Button>
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-primary hover:bg-primary/5 transition-colors"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top-5 duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <div 
                  className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                    isActive(link.href) 
                      ? 'bg-secondary/10 text-secondary' 
                      : 'text-gray-600 hover:text-secondary hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </div>
              </Link>
            ))}
            {!user && (
              <a href="/api/login" className="block w-full">
                <Button variant="outline" className="w-full mt-4">Sign In</Button>
              </a>
            )}
            <Link href="/donate">
              <Button className="w-full mt-2 bg-secondary text-white">Donate Now</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
