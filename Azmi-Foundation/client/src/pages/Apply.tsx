import { useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertCircle, CheckCircle2, Upload, FileText, Heart,
  User, Phone, MapPin, Home, Building2, Loader2,
  ChevronRight, Shield, FileImage,
} from "lucide-react";

const RELATION_OPTIONS = ["Self", "Spouse", "Parent", "Sibling", "Friend", "Other"];

function FileUploadField({
  label,
  id,
  icon: Icon,
  file,
  onChange,
  hint,
}: {
  label: string;
  id: string;
  icon: any;
  file: File | null;
  onChange: (f: File | null) => void;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div
        onClick={() => ref.current?.click()}
        className={`relative flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all
          ${file ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-primary hover:bg-primary/5"}`}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${file ? "bg-green-100" : "bg-white border border-gray-200"}`}>
          {file ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Icon className="w-5 h-5 text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          {file ? (
            <>
              <p className="text-sm font-medium text-green-700 truncate">{file.name}</p>
              <p className="text-xs text-green-600">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">Click to upload</p>
              <p className="text-xs text-gray-400">{hint || "Image or PDF, max 10MB"}</p>
            </>
          )}
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); if (ref.current) ref.current.value = ""; }}
            className="text-xs text-red-400 hover:text-red-600 font-medium flex-shrink-0"
          >
            Remove
          </button>
        )}
        <input
          ref={ref}
          id={id}
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          onChange={e => onChange(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
}

const HINGLISH_THANK_YOU = `🙏 Shukriya!

Aapki application humein mil gayi hai. Hamari team 2–3 business days mein aapse contact karegi aur agle steps batayegi.

Tab tak please apna phone available rakhein.

Allah aapke kamzor waqt mein sahara de. 💚
— Azmi Foundation Team`;

export default function Apply() {
  const [form, setForm] = useState({
    campaignerName: "",
    campaignerRelation: "",
    patientName: "",
    city: "",
    pincode: "",
    contactNumber: "",
    problemDescription: "",
    amountNeeded: "",
    familyMembers: "",
    houseType: "",
    patientLocation: "",
  });
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (medicalFile) fd.append("medicalFile", medicalFile);
      if (idProof) fd.append("idProof", idProof);

      const res = await fetch("/api/apply", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Submission failed");
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "Kuch galat ho gaya. Please dobara try karein.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
            <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 text-left">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">{HINGLISH_THANK_YOU}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button variant="outline" className="rounded-full px-6">Home par jaayein</Button>
            </Link>
            <Link href="/campaigns">
              <Button className="bg-primary hover:bg-primary/90 rounded-full px-6">Campaigns dekhein</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <img src="/logo.png" alt="Azmi Foundation" className="h-8 w-auto" />
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-800 text-sm">Apply for Fundraising</span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Apply for Fundraising</h1>
          <p className="text-white/80 text-base max-w-xl mx-auto">
            Kisi zarooratmand ki madad karne ke liye hamse judein. Apni baat share karein — hum aapke saath hain.
          </p>
        </div>
      </div>

      {/* Trust bar */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-green-500" /> 100% Confidential</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Verified NGO</div>
          <div className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-red-400" /> 80G Tax Exempt</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1 — Campaigner Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Campaigner Information
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Jo apply kar raha / rahi hai uski details</p>
          </div>
          <div className="p-6 grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Campaigner Name *</Label>
              <Input
                required
                value={form.campaignerName}
                onChange={set("campaignerName")}
                placeholder="Aapka pura naam"
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Relation with Patient *</Label>
              <Select
                value={form.campaignerRelation}
                onValueChange={v => setForm(p => ({ ...p, campaignerRelation: v }))}
                required
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_OPTIONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Contact Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  required
                  type="tel"
                  value={form.contactNumber}
                  onChange={set("contactNumber")}
                  placeholder="10-digit mobile number"
                  className="pl-10 h-11 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Patient Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Patient / Beneficiary Details
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Jis insaan ke liye madad chahiye uski details</p>
          </div>
          <div className="p-6 grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm font-medium text-gray-700">Patient Full Name *</Label>
              <Input
                required
                value={form.patientName}
                onChange={set("patientName")}
                placeholder="Mariz ka pura naam"
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">City *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  required
                  value={form.city}
                  onChange={set("city")}
                  placeholder="Shahar ka naam"
                  className="pl-10 h-11 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Pincode *</Label>
              <Input
                required
                type="text"
                maxLength={6}
                value={form.pincode}
                onChange={set("pincode")}
                placeholder="6-digit pincode"
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm font-medium text-gray-700">Patient Problem / Disease / Cause *</Label>
              <Textarea
                required
                value={form.problemDescription}
                onChange={set("problemDescription")}
                rows={4}
                placeholder="Mariz ko kya taklif hai? Bimari, surgery, accident — jo bhi ho clearly batayein..."
                className="rounded-lg resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Fundraising Amount Needed (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₹</span>
                <Input
                  required
                  type="number"
                  min="1000"
                  value={form.amountNeeded}
                  onChange={set("amountNeeded")}
                  placeholder="e.g. 500000"
                  className="pl-7 h-11 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Total Family Members *</Label>
              <Input
                required
                type="number"
                min="1"
                max="30"
                value={form.familyMembers}
                onChange={set("familyMembers")}
                placeholder="Ghar mein total kitne log"
                className="h-11 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 3 — Living Situation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-500" />
              Living Situation
            </h2>
          </div>
          <div className="p-6 grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">House Type *</Label>
              <div className="flex gap-3">
                {[{ value: "own", label: "Own", icon: Home }, { value: "rented", label: "Rented", icon: Building2 }].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, houseType: value }))}
                    className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border-2 font-medium text-sm transition-all
                      ${form.houseType === value ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Patient Currently *</Label>
              <div className="flex gap-3">
                {[{ value: "home", label: "At Home", icon: Home }, { value: "hospital", label: "In Hospital", icon: Building2 }].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, patientLocation: value }))}
                    className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border-2 font-medium text-sm transition-all
                      ${form.patientLocation === value ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 — Documents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              Documents (Optional but Recommended)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Documents ke saath application jaldi process hoti hai</p>
          </div>
          <div className="p-6 grid gap-5 sm:grid-cols-2">
            <FileUploadField
              label="Medical File / Doctor's Report"
              id="medicalFile"
              icon={FileImage}
              file={medicalFile}
              onChange={setMedicalFile}
              hint="Doctor report, prescription, hospital bill"
            />
            <FileUploadField
              label="Aadhaar Card / Voter ID"
              id="idProof"
              icon={FileText}
              file={idProof}
              onChange={setIdProof}
              hint="Aadhaar, Voter ID, or any govt ID"
            />
          </div>
        </div>

        {/* Validation */}
        {(!form.houseType || !form.patientLocation || !form.campaignerRelation) && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Please select House Type, Patient Location, and Relation options above
          </p>
        )}

        {/* Submit */}
        <div className="pb-8">
          <Button
            type="submit"
            disabled={submitting || !form.houseType || !form.patientLocation || !form.campaignerRelation}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-base rounded-xl shadow-lg disabled:opacity-50 transition-all"
          >
            {submitting ? (
              <span className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting your application...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Submit Application
              </span>
            )}
          </Button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Aapki information 100% confidential rahegi. Hum sirf madad ke liye contact karenge.
          </p>
        </div>
      </form>
    </div>
  );
}
