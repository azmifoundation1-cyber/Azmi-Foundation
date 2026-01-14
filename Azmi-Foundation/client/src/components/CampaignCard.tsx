import { Link } from "wouter";
import { type Campaign } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, DollarSign, Users } from "lucide-react";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const percent = Math.min(100, Math.round((Number(campaign.currentAmount) / Number(campaign.targetAmount)) * 100));

  return (
    <Card className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full bg-white">
      {/* Unsplash image with descriptive query */}
      <div className="relative h-56 overflow-hidden">
        <img 
          src={campaign.imageUrl || `https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80`} 
          alt={campaign.title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="inline-block px-3 py-1 bg-secondary/90 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-2 backdrop-blur-sm">
            Active Campaign
          </span>
        </div>
      </div>

      <CardHeader className="pt-6 pb-2 px-6">
        <h3 className="text-xl font-bold font-serif text-primary line-clamp-2 group-hover:text-secondary transition-colors">
          {campaign.title}
        </h3>
      </CardHeader>

      <CardContent className="px-6 py-2 flex-grow">
        <p className="text-gray-600 text-sm line-clamp-3 mb-6">
          {campaign.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-secondary">{percent}% Funded</span>
            <span className="text-gray-500">Goal: ${Number(campaign.targetAmount).toLocaleString()}</span>
          </div>
          <Progress value={percent} className="h-2.5 bg-gray-100" />
          <div className="flex justify-between items-center pt-1">
             <div className="flex items-center gap-1 text-primary font-bold">
                <DollarSign className="w-4 h-4 text-secondary" />
                {Number(campaign.currentAmount).toLocaleString()}
             </div>
             <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                <span>124 Donors</span>
             </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6 pt-4 border-t border-gray-50">
        <Link href="/donate" className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white font-medium group-hover:bg-secondary transition-colors duration-300">
            Donate Now <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
