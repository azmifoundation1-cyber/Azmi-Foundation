import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

function formatAmount(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr+`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L+`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K+`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function Login() {
  const [, navigate] = useLocation();
  const { login, user } = useAuth();
  const { data: stats } = useQuery<{ totalAmount: number; totalDonors: number; activeCampaigns: number }>({
    queryKey: ["/api/public/stats"],
    queryFn: () => fetch("/api/public/stats").then(r => r.json()),
    staleTime: 60000,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login.mutateAsync({ email, password });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — decorative */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-cover bg-center"
        style={{ backgroundImage: "url('/placeholder-hero.jpg'), linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.png" alt="Azmi Foundation" className="h-14 w-auto drop-shadow-lg" />
          <span className="text-white text-xl font-bold tracking-widest uppercase">Azmi Foundation</span>
        </div>
        <div className="relative z-10">
          <blockquote className="text-white">
            <p className="text-3xl font-light leading-snug italic mb-6">
              "Together we build bridges of compassion, one heart at a time."
            </p>
            <footer className="text-white/60 text-sm uppercase tracking-widest">— Azmi Foundation Mission</footer>
          </blockquote>
        </div>
        <div className="relative z-10 flex gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{stats ? formatAmount(stats.totalAmount) : "—"}</div>
            <div className="text-white/60 text-xs uppercase tracking-wider mt-1">Funds Raised</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{stats ? `${stats.totalDonors.toLocaleString("en-IN")}+` : "—"}</div>
            <div className="text-white/60 text-xs uppercase tracking-wider mt-1">Donors</div>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{stats ? `${stats.activeCampaigns}+` : "—"}</div>
            <div className="text-white/60 text-xs uppercase tracking-wider mt-1">Campaigns</div>
          </div>
        </div>
      </div>

      {/* Right Panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-10 lg:hidden">
            <img src="/logo.png" alt="Azmi Foundation" className="h-12 w-auto" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-500">Sign in to your Azmi Foundation account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-gray-200 focus:border-primary focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <span className="text-xs text-primary hover:underline cursor-pointer">Forgot password?</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 border-gray-200 focus:border-primary focus:ring-primary"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-sm transition-all"
            >
              {login.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 tracking-widest">or continue with</span>
            </div>
          </div>

          <a href="/api/login" className="block">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-200 hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Replit Account
            </Button>
          </a>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
