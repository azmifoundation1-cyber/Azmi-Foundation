import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, CheckCircle, Megaphone, Link as LinkIcon } from "lucide-react";
import { Link } from "wouter";

const emptyForm = {
  title: "",
  description: "",
  story: "",
  category: "other" as const,
  targetAmount: "",
  imageUrl: "",
  videoUrl: "",
};

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
}

export default function CreateCampaign() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [useUrl, setUseUrl] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/user/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit campaign");
      }
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
    onError: (e: any) => toast({ title: "Submission failed", description: e.message, variant: "destructive" }),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setForm(f => ({ ...f, imageUrl: url }));
      toast({ title: "Image uploaded!" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center px-4 py-20 text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Campaign Submitted!</h1>
          <p className="text-gray-500 max-w-md mb-8">
            Your campaign proposal has been submitted for review. Our admin team will review it and publish it shortly.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90">View My Campaigns</Button>
            </Link>
            <Link href="/campaigns">
              <Button variant="outline">Browse Campaigns</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto w-full px-4 py-12 flex-grow">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Start a Campaign</h1>
            <p className="text-sm text-gray-500 mt-0.5">Submit your campaign for admin review and publishing</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-700">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Campaign Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Help Feed 1000 Families This Winter"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["health", "education", "environment", "community", "emergency", "other"].map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fundraising Goal (₹) *</Label>
                <Input
                  type="number"
                  value={form.targetAmount}
                  onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                  placeholder="50000"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Short Description *</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Briefly describe your campaign (shown in listings)..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Full Story</Label>
              <Textarea
                rows={5}
                value={form.story}
                onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
                placeholder="Tell donors the full story — who you're helping, why it matters, how funds will be used..."
                className="mt-1"
              />
            </div>

            {/* Image upload */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Campaign Image</Label>
                <button type="button" onClick={() => setUseUrl(!useUrl)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  {useUrl ? <><Upload className="w-3 h-3" /> Upload file</> : <><LinkIcon className="w-3 h-3" /> Use URL instead</>}
                </button>
              </div>
              {useUrl ? (
                <Input
                  value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              ) : (
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleFileChange} />
                  <Button type="button" variant="outline" className="gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Uploading..." : "Choose Image"}
                  </Button>
                  {form.imageUrl && (
                    <div className="flex items-center gap-2">
                      <img src={form.imageUrl} alt="Preview" className="w-14 h-14 object-cover rounded border" />
                      <span className="text-xs text-green-600 font-medium">Ready</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label>YouTube Video URL <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input
                value={form.videoUrl}
                onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1"
              />
            </div>

            <div className="pt-2 bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800">
              <strong>Note:</strong> After submission, your campaign will be reviewed by our admin team before going live. You'll see its status in your dashboard.
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 font-semibold"
              disabled={createMutation.isPending || uploading || !form.title || !form.description || !form.targetAmount}
              onClick={() => createMutation.mutate(form)}
            >
              {createMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
              ) : "Submit Campaign for Review"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
