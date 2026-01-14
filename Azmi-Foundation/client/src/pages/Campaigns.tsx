import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CampaignCard } from "@/components/CampaignCard";
import { useCampaigns } from "@/hooks/use-campaigns";
import { Loader2 } from "lucide-react";

export default function Campaigns() {
  const { data: campaigns, isLoading } = useCampaigns();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <div className="bg-gray-50 py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold font-serif text-primary mb-6">Our Active Campaigns</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your support can change lives. Browse our current fundraising initiatives and contribute to a cause that resonates with you.
          </p>
        </div>
      </div>

      <div className="flex-grow py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-12 h-12 text-secondary animate-spin" />
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
             <div className="text-center py-24 text-gray-500">
               <p className="text-xl">No active campaigns at the moment. Please check back later.</p>
             </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
