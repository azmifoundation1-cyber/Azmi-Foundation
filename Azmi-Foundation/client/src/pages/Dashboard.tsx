import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useRegistrations } from "@/hooks/use-registrations";
import { Loader2, User, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: registrations, isLoading: regLoading } = useRegistrations();

  if (authLoading || regLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-secondary animate-spin" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  // Filter registrations for current user
  const myRegistrations = registrations?.filter(r => r.userId === user.id) || [];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        
        <div className="mb-12 flex items-center gap-6">
           <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img 
                 src={user.profileImageUrl || "https://github.com/shadcn.png"} 
                 alt="Profile" 
                 className="w-full h-full object-cover" 
              />
           </div>
           <div>
              <h1 className="text-3xl font-bold font-serif text-primary">Welcome, {user.firstName || 'User'}!</h1>
              <p className="text-gray-600">{user.email}</p>
           </div>
        </div>

        <h2 className="text-2xl font-bold text-primary mb-6">My Applications</h2>
        
        {myRegistrations.length === 0 ? (
          <Card className="p-12 text-center text-gray-500 border-dashed">
             <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>You haven't submitted any applications yet.</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {myRegistrations.map((reg) => (
              <Card key={reg.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 py-4 border-b border-gray-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Badge variant="outline" className="uppercase tracking-wider">{reg.type}</Badge>
                     <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(reg.createdAt!).toLocaleDateString()}
                     </span>
                  </div>
                  <StatusBadge status={reg.status} />
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                     <div>
                        <span className="block text-gray-500 mb-1">Motivation</span>
                        <p>{(reg.details as any).motivation}</p>
                     </div>
                     <div>
                        <span className="block text-gray-500 mb-1">Contact Info</span>
                        <p>{(reg.details as any).phone}</p>
                        <p>{(reg.details as any).address}</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
   const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
   };
   
   return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles]}`}>
         {status.toUpperCase()}
      </span>
   );
}
