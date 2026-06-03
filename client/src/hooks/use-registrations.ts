import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertRegistration } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useRegistrations() {
  return useQuery({
    queryKey: [api.registrations.list.path],
    queryFn: async () => {
      const res = await fetch(api.registrations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch registrations");
      return api.registrations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertRegistration) => {
      const res = await fetch(api.registrations.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
         if (res.status === 401) throw new Error("Please log in to register");
         throw new Error("Failed to submit registration");
      }
      return api.registrations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Application Submitted", description: "We will review your details shortly." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
