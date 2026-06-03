import { useState, useRef, useEffect } from "react";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertCircle, CheckCircle2, Upload, FileText, Heart,
  User, Phone, MapPin, Home, Building2, Loader2,
  Shield, FileImage, Search, Clock, MessageSquare,
  ChevronRight, RefreshCw,
} from "lucide-react";

type Lang = "hinglish" | "en" | "hi" | "gu" | "ur";

const LANGS: { code: Lang; label: string }[] = [
  { code: "hinglish", label: "Hinglish" },
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "ur", label: "اردو" },
];

const T: Record<Lang, Record<string, string>> = {
  hinglish: {
    title: "Fundraising ke liye Apply Karein",
    subtitle: "Kisi zarooratmand ki madad karne ke liye hamse judein. Apni baat share karein — hum aapke saath hain.",
    tab_apply: "Nayi Application",
    tab_status: "Status Check Karein",
    sec1Title: "Campaigner Ki Jankari",
    sec1Sub: "Jo apply kar raha / rahi hai uski details",
    sec2Title: "Mariz / Beneficiary Ki Details",
    sec2Sub: "Jis insaan ke liye madad chahiye uski jankari",
    sec3Title: "Rehne Ki Sthiti",
    sec3Sub: "Ghar aur mariz ki location ke baare mein",
    sec4Title: "Documents",
    sec4Sub: "Documents ke saath application jaldi process hoti hai",
    campaignerName: "Aapka Naam",
    campaignerNamePh: "Aapka pura naam",
    relation: "Mariz se Rishta",
    relationPh: "Rishta chunein",
    contact: "Contact Number",
    contactPh: "10-digit mobile number",
    patientName: "Mariz ka Pura Naam",
    patientNamePh: "Mariz ka poora naam",
    city: "Shahar",
    cityPh: "Aapka shahar",
    pincode: "Pincode",
    pincodePh: "6 digit pincode",
    problem: "Takleef / Bimari / Wajah",
    problemPh: "Mariz ko kya taklif hai? Bimari, surgery, accident — jo bhi ho clearly batayein...",
    amount: "Kitne Paise Chahiye (₹)",
    amountPh: "Jaise: 50000",
    familyMembers: "Ghar Mein Kitne Log",
    familyPh: "Total family members",
    houseType: "Ghar ka Type",
    own: "Apna",
    rented: "Kiraye ka",
    patientLocation: "Mariz Abhi Kahan Hai",
    atHome: "Ghar Par",
    inHospital: "Hospital Mein",
    medicalFile: "Medical File / Doctor ki Report",
    medicalHint: "Doctor report, prescription, hospital bill (JPG, PDF, max 50MB)",
    idProof: "Aadhaar Card / Voter ID",
    idHint: "Aadhaar, Voter ID, ya koi bhi government ID (JPG, PDF, max 50MB)",
    submit: "Application Submit Karein",
    submitting: "Submit ho rahi hai...",
    selectRequired: "Ghar ka type, mariz ki location aur rishta zaroor select karein",
    thankYouTitle: "Application Submit Ho Gayi!",
    thankYouMsg: "Shukriya! Aapki application humein mil gayi hai. Hamari team 2–3 business days mein aapse contact karegi aur agle steps batayegi.\n\nTab tak please apna phone available rakhein.\n\nAllah aapke kamzor waqt mein sahara de. 💚",
    appIdLabel: "Aapka Application ID",
    goHome: "Home Par Jaayein",
    seeCampaigns: "Campaigns Dekhein",
    statusTitle: "Application Ka Status Dekhein",
    statusSub: "Apna registered phone number enter karein",
    phonePh: "10-digit mobile number",
    checkBtn: "Status Dekhein",
    checking: "Check ho raha hai...",
    noApp: "Is phone number pe koi application nahi mili.",
    statusLabel: "Status",
    msgLabel: "Team ka Message",
    submittedOn: "Submit kiya",
    patientLabel: "Mariz",
    amountLabel: "Amount",
    checkAnother: "Dobara Check Karein",
    confidential: "Aapki information 100% confidential rahegi.",
    trustConf: "100% Confidential",
    trustVerified: "Verified NGO",
    trust80G: "80G Tax Chhoot",
    rel_Self: "Khud", rel_Spouse: "Pati/Patni", rel_Parent: "Maa/Baap",
    rel_Sibling: "Bhai/Behen", rel_Friend: "Dost", rel_Other: "Aur",
    status_new: "Naya", status_under_review: "Review Mein", status_approved: "Approved", status_rejected: "Reject Hua",
    clickUpload: "Click karke upload karein",
  },
  en: {
    title: "Apply for Medical Fundraising",
    subtitle: "Join us to help someone in need. Share your story — we are with you.",
    tab_apply: "New Application",
    tab_status: "Check My Status",
    sec1Title: "Campaigner Information",
    sec1Sub: "Details of the person applying",
    sec2Title: "Patient / Beneficiary Details",
    sec2Sub: "Details of the person who needs help",
    sec3Title: "Living Situation",
    sec3Sub: "About your home and patient location",
    sec4Title: "Documents",
    sec4Sub: "Applications with documents are processed faster",
    campaignerName: "Campaigner Name",
    campaignerNamePh: "Your full name",
    relation: "Relation with Patient",
    relationPh: "Select relation",
    contact: "Contact Number",
    contactPh: "10-digit mobile number",
    patientName: "Patient Full Name",
    patientNamePh: "Patient's full name",
    city: "City",
    cityPh: "Your city",
    pincode: "Pincode",
    pincodePh: "6-digit pincode",
    problem: "Patient Problem / Disease / Cause",
    problemPh: "What problem does the patient have? Disease, surgery, accident — describe clearly...",
    amount: "Fundraising Amount Needed (₹)",
    amountPh: "e.g. 50000",
    familyMembers: "Total Family Members",
    familyPh: "Number of people in family",
    houseType: "House Type",
    own: "Own",
    rented: "Rented",
    patientLocation: "Patient Currently",
    atHome: "At Home",
    inHospital: "In Hospital",
    medicalFile: "Medical File / Doctor's Report",
    medicalHint: "Doctor report, prescription, hospital bill (JPG, PDF, max 50MB)",
    idProof: "Aadhaar Card / Voter ID",
    idHint: "Aadhaar, Voter ID, or any government ID (JPG, PDF, max 50MB)",
    submit: "Submit Application",
    submitting: "Submitting your application...",
    selectRequired: "Please select House Type, Patient Location, and Relation",
    thankYouTitle: "Application Submitted!",
    thankYouMsg: "Thank you! Your application has been received. Our team will contact you within 2–3 business days and guide you through the next steps.\n\nPlease keep your phone available.\n\nMay God bless you in this difficult time. 💚",
    appIdLabel: "Your Application ID",
    goHome: "Go to Homepage",
    seeCampaigns: "See Campaigns",
    statusTitle: "Check Application Status",
    statusSub: "Enter your registered phone number to view your application status",
    phonePh: "Enter 10-digit mobile number",
    checkBtn: "Check Status",
    checking: "Checking...",
    noApp: "No application found for this phone number.",
    statusLabel: "Current Status",
    msgLabel: "Message from Our Team",
    submittedOn: "Submitted on",
    patientLabel: "Patient",
    amountLabel: "Amount",
    checkAnother: "Check Another Number",
    confidential: "Your information will be 100% confidential. We will only contact you for assistance.",
    trustConf: "100% Confidential",
    trustVerified: "Verified NGO",
    trust80G: "80G Tax Exempt",
    rel_Self: "Self", rel_Spouse: "Spouse", rel_Parent: "Parent",
    rel_Sibling: "Sibling", rel_Friend: "Friend", rel_Other: "Other",
    status_new: "New", status_under_review: "Under Review", status_approved: "Approved", status_rejected: "Rejected",
    clickUpload: "Click to upload",
  },
  hi: {
    title: "मेडिकल फंडरेजिंग के लिए आवेदन करें",
    subtitle: "किसी जरूरतमंद की मदद करने के लिए हमसे जुड़ें। अपनी बात साझा करें — हम आपके साथ हैं।",
    tab_apply: "नई आवेदन",
    tab_status: "स्थिति जाँचें",
    sec1Title: "आवेदक की जानकारी",
    sec1Sub: "जो आवेदन कर रहा/रही है उनकी जानकारी",
    sec2Title: "मरीज / लाभार्थी का विवरण",
    sec2Sub: "जिस व्यक्ति को मदद चाहिए उनकी जानकारी",
    sec3Title: "रहन-सहन की स्थिति",
    sec3Sub: "घर और मरीज की जगह के बारे में",
    sec4Title: "दस्तावेज़",
    sec4Sub: "दस्तावेज़ के साथ आवेदन जल्दी प्रक्रिया होती है",
    campaignerName: "आवेदक का नाम",
    campaignerNamePh: "आपका पूरा नाम",
    relation: "मरीज से संबंध",
    relationPh: "संबंध चुनें",
    contact: "संपर्क नंबर",
    contactPh: "10-अंकीय मोबाइल नंबर",
    patientName: "मरीज का पूरा नाम",
    patientNamePh: "मरीज का पूरा नाम",
    city: "शहर",
    cityPh: "आपका शहर",
    pincode: "पिनकोड",
    pincodePh: "6 अंकों का पिनकोड",
    problem: "बीमारी / समस्या / कारण",
    problemPh: "मरीज को क्या तकलीफ है? बीमारी, सर्जरी, दुर्घटना — जो भी हो स्पष्ट बताएं...",
    amount: "कितनी राशि चाहिए (₹)",
    amountPh: "जैसे: 50000",
    familyMembers: "परिवार में कुल सदस्य",
    familyPh: "परिवार के कुल सदस्य",
    houseType: "घर का प्रकार",
    own: "अपना",
    rented: "किराए का",
    patientLocation: "मरीज अभी कहाँ है",
    atHome: "घर पर",
    inHospital: "अस्पताल में",
    medicalFile: "मेडिकल फाइल / डॉक्टर की रिपोर्ट",
    medicalHint: "डॉक्टर रिपोर्ट, पर्चा, अस्पताल का बिल (JPG, PDF, अधिकतम 50MB)",
    idProof: "आधार कार्ड / वोटर आईडी",
    idHint: "आधार, वोटर आईडी, या कोई भी सरकारी ID (JPG, PDF, अधिकतम 50MB)",
    submit: "आवेदन जमा करें",
    submitting: "आवेदन जमा हो रहा है...",
    selectRequired: "घर का प्रकार, मरीज की स्थान और संबंध चुनना जरूरी है",
    thankYouTitle: "आवेदन सबमिट हो गया!",
    thankYouMsg: "शुक्रिया! आपका आवेदन हमें मिल गया है। हमारी टीम 2–3 कार्य दिवसों में आपसे संपर्क करेगी।\n\nकृपया अपना फोन उपलब्ध रखें।\n\nईश्वर इस कठिन समय में आपका साथ दे। 💚",
    appIdLabel: "आपका आवेदन ID",
    goHome: "होम पर जाएं",
    seeCampaigns: "अभियान देखें",
    statusTitle: "आवेदन की स्थिति जाँचें",
    statusSub: "अपना पंजीकृत फोन नंबर दर्ज करें",
    phonePh: "10-अंकीय मोबाइल नंबर",
    checkBtn: "स्थिति देखें",
    checking: "जाँच हो रही है...",
    noApp: "इस फोन नंबर पर कोई आवेदन नहीं मिला।",
    statusLabel: "वर्तमान स्थिति",
    msgLabel: "टीम का संदेश",
    submittedOn: "जमा किया गया",
    patientLabel: "मरीज",
    amountLabel: "राशि",
    checkAnother: "दूसरा नंबर जाँचें",
    confidential: "आपकी जानकारी 100% गोपनीय रहेगी।",
    trustConf: "100% गोपनीय",
    trustVerified: "सत्यापित NGO",
    trust80G: "80G कर छूट",
    rel_Self: "स्वयं", rel_Spouse: "पति/पत्नी", rel_Parent: "माता/पिता",
    rel_Sibling: "भाई/बहन", rel_Friend: "मित्र", rel_Other: "अन्य",
    status_new: "नया", status_under_review: "समीक्षा में", status_approved: "स्वीकृत", status_rejected: "अस्वीकृत",
    clickUpload: "अपलोड करने के लिए क्लिक करें",
  },
  gu: {
    title: "મેડિકલ ફંડ માટે અરજી કરો",
    subtitle: "જરૂરિયાતમંદ વ્યક્તિની મદદ કરવા માટે અમારી સાથે જોડાઓ. તમારી વાત શેર કરો — અમે તમારી સાથે છીએ.",
    tab_apply: "નવી અરજી",
    tab_status: "સ્થિતિ તપાસો",
    sec1Title: "અરજીકર્તાની માહિતી",
    sec1Sub: "જે અરજી કરી રહ્યા/રહ્યા છે તેની વિગત",
    sec2Title: "દર્દી / લાભાર્થીની વિગત",
    sec2Sub: "જે વ્યક્તિને મદદ જોઈએ છે તેની વિગત",
    sec3Title: "રહેઠાણની સ્થિતિ",
    sec3Sub: "ઘર અને દર્દીની જગ્યા વિશે",
    sec4Title: "દસ્તાવેજો",
    sec4Sub: "દસ્તાવેજો સાથેની અરજી ઝડપથી પ્રક્રિયા થાય છે",
    campaignerName: "અરજીકર્તાનું નામ",
    campaignerNamePh: "તમારું પૂરું નામ",
    relation: "દર્દી સાથે સંબંધ",
    relationPh: "સંબંધ પસંદ કરો",
    contact: "સંપર્ક નંબર",
    contactPh: "10 અંકનો મોબાઈલ નંબર",
    patientName: "દર્દીનું પૂરું નામ",
    patientNamePh: "દર્દીનું સંપૂર્ણ નામ",
    city: "શહેર",
    cityPh: "તમારું શહેર",
    pincode: "પિનકોડ",
    pincodePh: "6 અંકનો પિનકોડ",
    problem: "બીમારી / સમસ્યા / કારણ",
    problemPh: "દર્દીને શું તકલીફ છે? બીમારી, શસ્ત્રક્રિયા, અકસ્માત — સ્પષ્ટ જણાવો...",
    amount: "કેટલી રકમ જોઈએ (₹)",
    amountPh: "જેમ કે: 50000",
    familyMembers: "પરિવારમાં કુલ સભ્યો",
    familyPh: "પરિવારના કુલ સભ્યો",
    houseType: "ઘરનો પ્રકાર",
    own: "પોતાનું",
    rented: "ભાડાનું",
    patientLocation: "દર્દી હાલ ક્યાં છે",
    atHome: "ઘરે",
    inHospital: "હોસ્પિટલમાં",
    medicalFile: "મેડિકલ ફાઈલ / ડૉક્ટરનો રિપોર્ટ",
    medicalHint: "ડૉક્ટર રિપોર્ટ, પ્રિસ્ક્રિપ્શન, હોસ્પિટલ બિલ (JPG, PDF, મહત્તમ 50MB)",
    idProof: "આધાર કાર્ડ / મતદાર ID",
    idHint: "આધાર, મતદાર ID, અથવા કોઈ સરકારી ID (JPG, PDF, મહત્તમ 50MB)",
    submit: "અરજી સબમિટ કરો",
    submitting: "અરજી સબમિટ થઈ રહી છે...",
    selectRequired: "ઘરનો પ્રકાર, દર્દીની સ્થાન અને સંબંધ પસંદ કરો",
    thankYouTitle: "અરજી સ્વીકારી!",
    thankYouMsg: "આભાર! તમારી અરજી અમને મળી ગઈ છે. અમારી ટીમ 2–3 કાર્ય દિવસોમાં તમારો સંપર્ક કરશે.\n\nકૃપા કરીને ફોન ઉપલબ્ધ રાખો.\n\nઈશ્વર આ મુશ્કેલ સમયમાં તમારી સાથે હો. 💚",
    appIdLabel: "તમારો અરજી ID",
    goHome: "હોમ પર જાઓ",
    seeCampaigns: "અભિયાન જુઓ",
    statusTitle: "અરજીની સ્થિતિ તપાસો",
    statusSub: "તમારો નોંધાયેલ ફોન નંબર દાખલ કરો",
    phonePh: "10 અંકનો મોબાઈલ નંબર",
    checkBtn: "સ્થિતિ જુઓ",
    checking: "તપાસ થઈ રહી છે...",
    noApp: "આ ફોન નંબર પર કોઈ અરજી મળી નથી.",
    statusLabel: "વર્તમાન સ્થિતિ",
    msgLabel: "ટીમ તરફથી સંદેશ",
    submittedOn: "સ્વીકૃત",
    patientLabel: "દર્દી",
    amountLabel: "રકમ",
    checkAnother: "બીજો નંબર તપાસો",
    confidential: "તમારી માહિતી 100% ગોપનીય રહેશે.",
    trustConf: "100% ગોપનીય",
    trustVerified: "ચકાસાયેલ NGO",
    trust80G: "80G ટેક્સ મુક્તિ",
    rel_Self: "પોતે", rel_Spouse: "પતિ/પત્ની", rel_Parent: "માતા/પિતા",
    rel_Sibling: "ભાઈ/બહેન", rel_Friend: "મિત્ર", rel_Other: "અન્ય",
    status_new: "નવું", status_under_review: "સમીક્ષા હેઠળ", status_approved: "સ્વીકૃત", status_rejected: "નકારવામાં આવ્યું",
    clickUpload: "અપલોડ કરવા ક્લિક કરો",
  },
  ur: {
    title: "میڈیکل فنڈ ریزنگ کے لیے درخواست دیں",
    subtitle: "کسی ضرورتمند کی مدد کرنے کے لیے ہم سے جڑیں۔ اپنی بات شیئر کریں — ہم آپ کے ساتھ ہیں۔",
    tab_apply: "نئی درخواست",
    tab_status: "حالت چیک کریں",
    sec1Title: "درخواست گزار کی معلومات",
    sec1Sub: "جو درخواست دے رہا/رہی ہے اس کی تفصیل",
    sec2Title: "مریض / مستفید کی تفصیل",
    sec2Sub: "جس شخص کو مدد چاہیے اس کی تفصیل",
    sec3Title: "رہائش کی صورتحال",
    sec3Sub: "گھر اور مریض کے مقام کے بارے میں",
    sec4Title: "دستاویزات",
    sec4Sub: "دستاویزات کے ساتھ درخواست جلد عمل میں آتی ہے",
    campaignerName: "درخواست گزار کا نام",
    campaignerNamePh: "آپ کا پورا نام",
    relation: "مریض سے رشتہ",
    relationPh: "رشتہ منتخب کریں",
    contact: "رابطہ نمبر",
    contactPh: "10 ہندسوں کا موبائل نمبر",
    patientName: "مریض کا پورا نام",
    patientNamePh: "مریض کا مکمل نام",
    city: "شہر",
    cityPh: "آپ کا شہر",
    pincode: "پن کوڈ",
    pincodePh: "6 ہندسوں کا پن کوڈ",
    problem: "بیماری / تکلیف / وجہ",
    problemPh: "مریض کو کیا تکلیف ہے؟ بیماری، آپریشن، حادثہ — جو بھی ہو واضح بتائیں...",
    amount: "کتنی رقم درکار ہے (₹)",
    amountPh: "مثلاً: 50000",
    familyMembers: "گھر میں کل افراد",
    familyPh: "خاندان کے کل افراد",
    houseType: "گھر کی قسم",
    own: "اپنا",
    rented: "کرایے کا",
    patientLocation: "مریض ابھی کہاں ہے",
    atHome: "گھر پر",
    inHospital: "ہسپتال میں",
    medicalFile: "میڈیکل فائل / ڈاکٹر کی رپورٹ",
    medicalHint: "ڈاکٹر رپورٹ، نسخہ، ہسپتال بل (JPG, PDF, زیادہ سے زیادہ 50MB)",
    idProof: "آدھار کارڈ / ووٹر آئی ڈی",
    idHint: "آدھار، ووٹر آئی ڈی، یا کوئی بھی سرکاری ID (JPG, PDF, زیادہ سے زیادہ 50MB)",
    submit: "درخواست جمع کریں",
    submitting: "درخواست جمع ہو رہی ہے...",
    selectRequired: "گھر کی قسم، مریض کا مقام اور رشتہ منتخب کریں",
    thankYouTitle: "درخواست جمع ہو گئی!",
    thankYouMsg: "شکریہ! آپ کی درخواست ہمیں مل گئی ہے۔ ہماری ٹیم 2–3 کاروباری دنوں میں آپ سے رابطہ کرے گی۔\n\nبراہ کرم اپنا فون دستیاب رکھیں۔\n\nاللہ اس مشکل وقت میں آپ کا ساتھ دے۔ 💚",
    appIdLabel: "آپ کا درخواست ID",
    goHome: "ہوم پر جائیں",
    seeCampaigns: "مہمات دیکھیں",
    statusTitle: "درخواست کی حالت چیک کریں",
    statusSub: "اپنا رجسٹرڈ فون نمبر درج کریں",
    phonePh: "10 ہندسوں کا موبائل نمبر",
    checkBtn: "حالت دیکھیں",
    checking: "چیک ہو رہا ہے...",
    noApp: "اس فون نمبر پر کوئی درخواست نہیں ملی۔",
    statusLabel: "موجودہ حالت",
    msgLabel: "ٹیم کا پیغام",
    submittedOn: "جمع کیا گیا",
    patientLabel: "مریض",
    amountLabel: "رقم",
    checkAnother: "دوسرا نمبر چیک کریں",
    confidential: "آپ کی معلومات 100% خفیہ رہیں گی۔",
    trustConf: "100% خفیہ",
    trustVerified: "تصدیق شدہ NGO",
    trust80G: "80G ٹیکس چھوٹ",
    rel_Self: "خود", rel_Spouse: "شوہر/بیوی", rel_Parent: "والدین",
    rel_Sibling: "بھائی/بہن", rel_Friend: "دوست", rel_Other: "دیگر",
    status_new: "نیا", status_under_review: "زیر جائزہ", status_approved: "منظور", status_rejected: "مسترد",
    clickUpload: "اپلوڈ کرنے کے لیے کلک کریں",
  },
};

function statusColor(s: string) {
  if (s === "approved") return "bg-green-100 text-green-700 border-green-200";
  if (s === "rejected") return "bg-red-100 text-red-700 border-red-200";
  if (s === "under_review") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}
function statusKey(s: string) {
  if (s === "under_review") return "status_under_review";
  return `status_${s}`;
}

function FileUploadField({ label, id, icon: Icon, file, onChange, hint, isRTL }: {
  label: string; id: string; icon: any; file: File | null;
  onChange: (f: File | null) => void; hint?: string; isRTL?: boolean;
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
              <p className="text-sm font-medium text-gray-600">Click to upload</p>
              {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
            </>
          )}
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="text-gray-400 hover:text-red-500 transition-colors text-xs px-2 py-1 rounded"
          >
            ✕
          </button>
        )}
        <input ref={ref} id={id} type="file" className="hidden" accept="image/*,.pdf"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      </div>
    </div>
  );
}

export default function Apply() {
  useSEO({
    title: "Apply for Fundraising Support",
    description: "Apply to Azmi Foundation for fundraising support. We help individuals in need raise funds for medical emergencies, education, and community hardships across India.",
    url: "/apply",
  });
  const [lang, setLang] = useState<Lang>("hinglish");
  const t = T[lang];
  const isRTL = lang === "ur";
  const [tab, setTab] = useState<"apply" | "status">("apply");

  const [form, setForm] = useState({
    campaignerName: "", campaignerRelation: "", patientName: "",
    city: "", pincode: "", contactNumber: "", problemDescription: "",
    amountNeeded: "", familyMembers: "",
    houseType: "" as "" | "own" | "rented",
    patientLocation: "" as "" | "home" | "hospital",
  });
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [statusPhone, setStatusPhone] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusResults, setStatusResults] = useState<any[] | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── Meta Pixel ViewContent — fires when Apply page loads ──
  useEffect(() => {
    try {
      (window as any).fbq?.("track", "ViewContent", {
        content_name: "Apply for Medical Fundraising",
        content_type: "application_form",
      });
    } catch (e) {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.houseType || !form.patientLocation || !form.campaignerRelation) {
      setError(t.selectRequired);
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k === "campaignerRelation" ? "campaignerRelation" : k, v));
      if (medicalFile) fd.append("medicalFile", medicalFile);
      if (idProof) fd.append("idProof", idProof);
      const res = await fetch("/api/apply", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setAppId(data.id);
      setSubmitted(true);

      // ── Meta Pixel Lead event — fires on successful application ──
      try {
        (window as any).fbq?.("track", "Lead", {
          content_name: "Medical Fundraising Application",
          content_category: "fundraising_apply",
          value: Number(form.amountNeeded) || 0,
          currency: "INR",
        });
      } catch (e) {}
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError("");
    setStatusResults(null);
    const phone = statusPhone.replace(/\D/g, "").slice(-10);
    if (phone.length !== 10) {
      setStatusError(lang === "ur" ? "براہ کرم صحیح 10 ہندسوں کا نمبر درج کریں" : "Please enter a valid 10-digit number");
      return;
    }
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/apply/status?phone=${phone}`);
      const data = await res.json();
      if (!res.ok) {
        setStatusError(data.message || t.noApp);
      } else {
        setStatusResults(data);
      }
    } catch {
      setStatusError(t.noApp);
    } finally {
      setStatusLoading(false);
    }
  };

  const relationOptions = [
    { value: "Self", label: t.rel_Self },
    { value: "Spouse", label: t.rel_Spouse },
    { value: "Parent", label: t.rel_Parent },
    { value: "Sibling", label: t.rel_Sibling },
    { value: "Friend", label: t.rel_Friend },
    { value: "Other", label: t.rel_Other },
  ];

  return (
    <div className={`min-h-screen bg-gray-50 font-sans ${isRTL ? "dir-rtl" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-primary text-white py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <span className="text-white/70 hover:text-white text-sm cursor-pointer flex items-center gap-1">
              <ChevronRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} /> Azmi Foundation
            </span>
          </Link>
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  lang === l.code ? "bg-white text-primary shadow" : "text-white/80 hover:text-white"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-primary to-primary/90 text-white pt-8 pb-10 px-4 text-center">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">{t.title}</h1>
        <p className="text-white/70 mt-2 text-sm max-w-lg mx-auto leading-relaxed">{t.subtitle}</p>
        <div className="flex items-center justify-center gap-6 mt-5 text-xs text-white/60">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-green-400" />{t.trustConf}</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />{t.trustVerified}</span>
          <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-red-400" />{t.trust80G}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 -mt-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab("apply")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all ${
                tab === "apply" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="w-4 h-4" /> {t.tab_apply}
            </button>
            <button
              onClick={() => setTab("status")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all ${
                tab === "status" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Search className="w-4 h-4" /> {t.tab_status}
            </button>
          </div>

          {/* ─── APPLY TAB ─── */}
          {tab === "apply" && (
            <div className="p-6">
              {submitted && appId ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 mb-3">{t.thankYouTitle}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line max-w-sm mx-auto mb-6">{t.thankYouMsg}</p>
                  <div className="bg-primary/5 border border-primary/10 rounded-xl px-6 py-4 inline-block mb-6">
                    <p className="text-xs text-gray-500 mb-1">{t.appIdLabel}</p>
                    <p className="text-3xl font-black text-primary">#{appId}</p>
                  </div>
                  <p className="text-xs text-gray-400 mb-6">{t.confidential}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      className="rounded-full px-6"
                      onClick={() => { setTab("status"); setStatusPhone(form.contactNumber); }}
                    >
                      <Search className="w-4 h-4 mr-2" /> {t.tab_status}
                    </Button>
                    <Link href="/"><Button className="rounded-full px-6 bg-primary hover:bg-black text-white">{t.goHome}</Button></Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Section 1 */}
                  <Section icon={<User className="w-4 h-4" />} title={t.sec1Title} sub={t.sec1Sub}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label={`${t.campaignerName} *`}>
                        <Input value={form.campaignerName} onChange={e => set("campaignerName", e.target.value)}
                          placeholder={t.campaignerNamePh} required />
                      </Field>
                      <Field label={`${t.relation} *`}>
                        <Select value={form.campaignerRelation} onValueChange={v => set("campaignerRelation", v)}>
                          <SelectTrigger><SelectValue placeholder={t.relationPh} /></SelectTrigger>
                          <SelectContent>
                            {relationOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Field label={`${t.contact} *`}>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input className="pl-9" type="tel" value={form.contactNumber}
                          onChange={e => set("contactNumber", e.target.value)} placeholder={t.contactPh} required maxLength={10} />
                      </div>
                    </Field>
                  </Section>

                  {/* Section 2 */}
                  <Section icon={<Heart className="w-4 h-4" />} title={t.sec2Title} sub={t.sec2Sub}>
                    <Field label={`${t.patientName} *`}>
                      <Input value={form.patientName} onChange={e => set("patientName", e.target.value)}
                        placeholder={t.patientNamePh} required />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label={`${t.city} *`}>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input className="pl-9" value={form.city} onChange={e => set("city", e.target.value)} placeholder={t.cityPh} required />
                        </div>
                      </Field>
                      <Field label={`${t.pincode} *`}>
                        <Input type="text" inputMode="numeric" value={form.pincode}
                          onChange={e => set("pincode", e.target.value)} placeholder={t.pincodePh} required maxLength={6} />
                      </Field>
                    </div>
                    <Field label={`${t.problem} *`}>
                      <Textarea value={form.problemDescription} onChange={e => set("problemDescription", e.target.value)}
                        placeholder={t.problemPh} required rows={4} className="resize-none" />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label={`${t.amount} *`}>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₹</span>
                          <Input className="pl-7" type="number" min="1000" value={form.amountNeeded}
                            onChange={e => set("amountNeeded", e.target.value)} placeholder={t.amountPh} required />
                        </div>
                      </Field>
                      <Field label={`${t.familyMembers} *`}>
                        <Input type="number" min="1" value={form.familyMembers}
                          onChange={e => set("familyMembers", e.target.value)} placeholder={t.familyPh} required />
                      </Field>
                    </div>
                  </Section>

                  {/* Section 3 */}
                  <Section icon={<Home className="w-4 h-4" />} title={t.sec3Title} sub={t.sec3Sub}>
                    <Field label={`${t.houseType} *`}>
                      <div className="flex gap-3">
                        {[{ v: "own" as const, l: t.own, icon: Home }, { v: "rented" as const, l: t.rented, icon: Building2 }].map(o => (
                          <button key={o.v} type="button" onClick={() => set("houseType", o.v)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all
                              ${form.houseType === o.v ? "border-primary bg-primary text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-primary/50"}`}>
                            <o.icon className="w-4 h-4" /> {o.l}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label={`${t.patientLocation} *`}>
                      <div className="flex gap-3">
                        {[{ v: "home" as const, l: t.atHome }, { v: "hospital" as const, l: t.inHospital }].map(o => (
                          <button key={o.v} type="button" onClick={() => set("patientLocation", o.v)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all
                              ${form.patientLocation === o.v ? "border-primary bg-primary text-white shadow-md" : "border-gray-200 bg-white text-gray-600 hover:border-primary/50"}`}>
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </Section>

                  {/* Section 4 */}
                  <Section icon={<FileText className="w-4 h-4" />} title={t.sec4Title} sub={t.sec4Sub}>
                    <FileUploadField label={t.medicalFile} id="medicalFile" icon={FileImage} file={medicalFile}
                      onChange={setMedicalFile} hint={t.medicalHint} isRTL={isRTL} />
                    <FileUploadField label={t.idProof} id="idProof" icon={Shield} file={idProof}
                      onChange={setIdProof} hint={t.idHint} isRTL={isRTL} />
                  </Section>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                    </div>
                  )}

                  <Button type="submit" disabled={submitting}
                    className="w-full bg-primary hover:bg-black text-white py-7 text-base font-black uppercase tracking-widest rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
                    {submitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> {t.submitting}</span>
                    ) : (
                      <span className="flex items-center gap-2"><Heart className="w-5 h-5" /> {t.submit}</span>
                    )}
                  </Button>
                  <p className="text-center text-xs text-gray-400">{t.confidential}</p>
                </form>
              )}
            </div>
          )}

          {/* ─── STATUS TAB ─── */}
          {tab === "status" && (
            <div className="p-6">
              {!statusResults ? (
                <form onSubmit={checkStatus} className="space-y-6">
                  <div className="text-center pt-2 pb-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-black text-gray-800">{t.statusTitle}</h2>
                    <p className="text-sm text-gray-500 mt-1">{t.statusSub}</p>
                  </div>
                  <Field label={`${t.contact} *`}>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input className="pl-9 py-5 text-base" type="tel" value={statusPhone}
                        onChange={e => setStatusPhone(e.target.value)} placeholder={t.phonePh} maxLength={10} required />
                    </div>
                  </Field>
                  {statusError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {statusError}
                    </div>
                  )}
                  <Button type="submit" disabled={statusLoading}
                    className="w-full bg-primary hover:bg-black text-white py-6 text-sm font-black uppercase tracking-widest rounded-xl">
                    {statusLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {t.checking}</span>
                    ) : (
                      <span className="flex items-center gap-2"><Search className="w-4 h-4" /> {t.checkBtn}</span>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-gray-800">{statusResults.length > 1 ? `${statusResults.length} Applications Found` : "Application Found"}</h2>
                    <button onClick={() => { setStatusResults(null); setStatusPhone(""); }}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> {t.checkAnother}
                    </button>
                  </div>
                  {statusResults.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">{t.patientLabel}</p>
                          <p className="font-black text-gray-900">{app.patientName}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColor(app.status)}`}>
                          {t[statusKey(app.status)] || app.status}
                        </span>
                      </div>
                      <div className="px-4 py-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-400">{t.amountLabel}</p>
                            <p className="font-semibold text-gray-800">₹{Number(app.amountNeeded).toLocaleString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">{t.submittedOn}</p>
                            <p className="font-semibold text-gray-800">
                              {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        {app.userMessage ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-1.5">
                              <MessageSquare className="w-3.5 h-3.5" /> {t.msgLabel}
                            </p>
                            <p className="text-sm text-blue-800 leading-relaxed">{app.userMessage}</p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                            {lang === "ur" ? "ابھی کوئی پیغام نہیں۔ ٹیم جلد رابطہ کرے گی۔"
                              : lang === "hi" ? "अभी कोई संदेश नहीं। टीम जल्द संपर्क करेगी।"
                              : lang === "gu" ? "હજુ કોઈ સંદેશ નથી. ટીમ ટૂંક સમયમાં સંપર્ક કરશે."
                              : "No message yet. Our team will reach out soon."}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                          <Shield className="w-3 h-3" /> App ID #{app.id}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-2">
                    <Link href="/" className="flex-1">
                      <Button variant="outline" className="w-full rounded-full text-sm">{t.goHome}</Button>
                    </Link>
                    <Link href="/campaigns" className="flex-1">
                      <Button className="w-full bg-primary text-white hover:bg-black rounded-full text-sm">{t.seeCampaigns}</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="pb-16" />
    </div>
  );
}

function Section({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary">{icon}</div>
        <div>
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">{title}</h3>
          <p className="text-xs text-gray-400">{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {children}
    </div>
  );
}
