import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="mb-8">
        <h1 className="text-9xl font-bold font-serif text-primary/20">404</h1>
        <h2 className="text-3xl font-bold text-primary mt-4">Page Not Found</h2>
        <p className="text-gray-500 mt-2">The page you are looking for doesn't exist or has been moved.</p>
      </div>
      
      <Link href="/">
        <Button className="bg-secondary hover:bg-secondary/90 text-white flex items-center gap-2">
          <Home className="w-4 h-4" /> Back to Home
        </Button>
      </Link>
    </div>
  );
}
