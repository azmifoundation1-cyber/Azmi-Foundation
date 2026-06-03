import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertCampaign, type InsertDonation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCampaigns() {
  return useQuery({
    queryKey: [api.campaigns.list.path],
    queryFn: async () => {
      const res = await fetch(api.campaigns.list.path);
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return api.campaigns.list.responses[200].parse(await res.json());
    },
  });
}

export function useCampaign(id: number) {
  return useQuery({
    queryKey: [api.campaigns.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.campaigns.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return api.campaigns.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCampaign) => {
      const res = await fetch(api.campaigns.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      return api.campaigns.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.campaigns.list.path] });
      toast({ title: "Success", description: "Campaign created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create campaign", variant: "destructive" });
    },
  });
}

export function useCreateDonation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertDonation) => {
      const validated = api.donations.create.input.parse(data);
      const res = await fetch(api.donations.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to process donation");
      return api.donations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.campaigns.list.path] });
      toast({ title: "Thank You!", description: "Your donation has been received." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to process donation", variant: "destructive" });
    },
  });
}
