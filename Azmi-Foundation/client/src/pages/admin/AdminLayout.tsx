import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, LayoutDashboard, Megaphone, Heart, Users, BookOpen, MessageSquare, ClipboardList, LogOut, ChevronRight, Shield, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Campaigns", path: "/admin/campaigns", icon: Megaphone },
  { label: "Donations", path: "/admin/donations", icon: Heart },
  { label: "Registrations", path: "/admin/registrations", icon: ClipboardList },
  { label: "Programs", path: "/admin/programs", icon: BookOpen },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Messages", path: "/admin/messages", icon: MessageSquare },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  if ((user as any).role !== "admin") {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <Shield className="w-16 h-16 text-red-400" />
        <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
        <p className="text-gray-500 text-center max-w-sm">
          You need admin privileges to access this page. Contact your administrator.
        </p>
        <a href="/dashboard" className="mt-2 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="font-bold text-white text-lg">Admin Panel</span>
          </div>
          <p className="text-gray-400 text-xs truncate">Azmi Foundation</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ label, path, icon: Icon }) => {
            const isActive = location === path || (path !== "/admin" && location.startsWith(path));
            return (
              <Link key={path} href={path}>
                <a className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-green-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <img src={user.profileImageUrl || "https://github.com/shadcn.png"} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <a className="flex-1 text-center text-xs text-gray-400 hover:text-white py-1 px-2 rounded hover:bg-gray-800 transition-colors">User View</a>
            </Link>
            <a href="/api/logout" className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 py-1 px-2 rounded hover:bg-gray-800 transition-colors">
              <LogOut className="w-3 h-3" /> Logout
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
