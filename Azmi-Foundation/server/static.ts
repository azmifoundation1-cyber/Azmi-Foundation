import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

const BASE_URL = "https://azmifoundation.com";

const SEO_PAGES: Record<string, { title: string; description: string; keywords: string }> = {
  "/": {
    title: "Azmi Foundation | Islamic Education, Healthcare & Community Welfare Nonprofit",
    description: "Azmi Foundation is an Islamic nonprofit feeding 2,000+ people daily in Ahmedabad. Donate Zakat or Sadaqah to support 846 families. 80G tax receipts provided.",
    keywords: "Islamic foundation, Muslim charity, Zakat donation, Sadaqah, Azmi Foundation, Ahmedabad NGO, Dr Shahbaaz Azmi, 80G charity India",
  },
  "/about": {
    title: "About Azmi Foundation | 18 Years Serving the Ummah in Ahmedabad",
    description: "Learn about Azmi Foundation's 18-year mission to feed, educate, and heal underserved communities in Ahmedabad, Gujarat. Founded by Dr. Shahbaaz Azmi.",
    keywords: "About Azmi Foundation, Islamic nonprofit mission, Dr Shahbaaz Azmi, Ahmedabad charity, NGO Gujarat",
  },
  "/programs": {
    title: "Our Programs | Food, Education, Healthcare & Welfare — Azmi Foundation",
    description: "Azmi Foundation runs food distribution for 2,000+ daily, grocery kits for 846 families, education support, and healthcare outreach in Ahmedabad. See your donation's impact.",
    keywords: "Azmi Foundation programs, food distribution Ahmedabad, Islamic education, healthcare nonprofit Gujarat",
  },
  "/campaigns": {
    title: "Active Campaigns | Donate Now — Azmi Foundation",
    description: "Support active donation campaigns by Azmi Foundation — emergency grocery drives, education funds, and more. Every donation reaches families directly. 80G receipts issued.",
    keywords: "Azmi Foundation campaigns, donate groceries families Ahmedabad, Islamic charity campaign India",
  },
  "/donate": {
    title: "Donate to Azmi Foundation | Zakat, Sadaqah & One-Time Gifts",
    description: "Donate to Azmi Foundation via Razorpay, UPI, or bank transfer. ₹680 feeds one family. Fund food for 846 families in Ahmedabad. 80G tax exemption certificate provided.",
    keywords: "donate Azmi Foundation, Zakat donation online India, Sadaqah, 80G tax exemption, Islamic charity donate",
  },
  "/zakat": {
    title: "Pay Your Zakat | Zakat Calculator & Online Donation — Azmi Foundation",
    description: "Calculate and pay your Zakat through Azmi Foundation. Your Zakat funds food, education, and welfare for 846 families in Ahmedabad. Fully transparent, 80G receipt available.",
    keywords: "Zakat calculator India, pay Zakat online, how to calculate Zakat, Zakat donation 2026, Islamic giving",
  },
  "/sadaqah": {
    title: "Sadaqah Jariyah | Give Continuous Charity — Azmi Foundation",
    description: "Give Sadaqah Jariyah through Azmi Foundation. Feed 2,000+ people daily — a cause that earns continuous reward. Donate ₹680 for one family's weekly groceries today.",
    keywords: "Sadaqah Jariyah, continuous charity Islam, Sadaqah donation India, Islamic giving Azmi Foundation",
  },
  "/volunteer": {
    title: "Volunteer With Azmi Foundation | Join Our Mission in Ahmedabad",
    description: "Volunteer with Azmi Foundation and help feed 2,000+ people daily, support education, and healthcare access in Ahmedabad, Gujarat. Remote and in-person roles available.",
    keywords: "volunteer Islamic foundation, Muslim volunteer Ahmedabad, nonprofit volunteer India, Azmi Foundation volunteer",
  },
  "/get-involved": {
    title: "Get Involved | Volunteer & Partner — Azmi Foundation",
    description: "Volunteer, fundraise, or partner with Azmi Foundation. Help us reach every hungry family in Ahmedabad. Multiple ways to give your time and skills.",
    keywords: "get involved Azmi Foundation, volunteer, partner NGO Ahmedabad, Islamic nonprofit",
  },
  "/contact": {
    title: "Contact Azmi Foundation | Ahmedabad, Gujarat",
    description: "Contact Azmi Foundation for donations, partnerships, or volunteering. Reach us at our office in Ahmedabad, Gujarat. We respond within 24 hours.",
    keywords: "Contact Azmi Foundation, Ahmedabad NGO contact, Islamic nonprofit contact Gujarat",
  },
  "/blog": {
    title: "Islamic Giving Blog | Zakat, Sadaqah & Charity Guides — Azmi Foundation",
    description: "Guides on Zakat calculation, Sadaqah Jariyah, Islamic giving principles, and how your donations create impact for 846 families in Ahmedabad.",
    keywords: "Islamic giving blog, Zakat guide 2026, Sadaqah Jariyah, Muslim charity articles, Islamic nonprofit blog",
  },
};

const ORG_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": ["Organization", "NGO"],
  "name": "Azmi Foundation",
  "alternateName": "Azmi Foundation for Education and Welfare",
  "url": BASE_URL,
  "logo": `${BASE_URL}/logo.png`,
  "image": `${BASE_URL}/azmi-img1.jpg`,
  "description": "Azmi Foundation is an Islamic nonprofit feeding 2,000+ people daily and providing grocery kits to 846 families in Ahmedabad, Gujarat through food distribution, education, and healthcare programs.",
  "foundingDate": "2006",
  "areaServed": "India",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Ahmedabad",
    "addressRegion": "Gujarat",
    "addressCountry": "IN"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "donations",
    "url": `${BASE_URL}/donate`
  },
  "sameAs": [
    "https://www.facebook.com/azmifoundation",
    "https://www.instagram.com/azmifoundation"
  ]
});

const FAQ_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How can I donate to Azmi Foundation?",
      "acceptedAnswer": { "@type": "Answer", "text": "You can donate online at azmifoundation.com/donate via Razorpay, UPI (8320218861@okbizaxis), or bank transfer to Axis Bank. 80G tax receipts are auto-generated for all donations." }
    },
    {
      "@type": "Question",
      "name": "What does Azmi Foundation do?",
      "acceptedAnswer": { "@type": "Answer", "text": "Azmi Foundation feeds 2,000+ people every single day, provides grocery kits to 846 families (₹680 per kit), supports education for underprivileged children, and runs healthcare outreach in Ahmedabad, Gujarat." }
    },
    {
      "@type": "Question",
      "name": "Is donation to Azmi Foundation tax-deductible?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Azmi Foundation is registered under Section 80G (Reg: AAGTA9354BF20261) and 12A of the Income Tax Act. All donations qualify for income tax deduction." }
    },
    {
      "@type": "Question",
      "name": "How much does it cost to feed one family?",
      "acceptedAnswer": { "@type": "Answer", "text": "₹680 provides a complete weekly grocery kit for one family. Your donation of ₹6,800 can feed 10 families for a week." }
    }
  ]
});

const WEBSITE_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Azmi Foundation",
  "url": BASE_URL,
  "description": "Islamic nonprofit feeding 2,000+ people daily in Ahmedabad"
});

function buildMeta(url: string): string {
  const clean = url.split("?")[0].replace(/\/$/, "") || "/";
  const meta = SEO_PAGES[clean] || SEO_PAGES["/"];
  const canonical = `${BASE_URL}${clean === "/" ? "" : clean}`;
  const ogImage = `${BASE_URL}/azmi-img1.jpg`;
  const isHome = clean === "/";

  return [
    `<title>${meta.title}</title>`,
    `<meta name="description" content="${meta.description.replace(/"/g, "&quot;")}">`,
    `<meta name="keywords" content="${meta.keywords}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Azmi Foundation">`,
    `<meta property="og:title" content="${meta.title.replace(/"/g, "&quot;")}">`,
    `<meta property="og:description" content="${meta.description.replace(/"/g, "&quot;")}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:locale" content="en_IN">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${meta.title.replace(/"/g, "&quot;")}">`,
    `<meta name="twitter:description" content="${meta.description.replace(/"/g, "&quot;")}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
    `<meta name="robots" content="index, follow">`,
    `<meta name="author" content="Azmi Foundation">`,
    `<script type="application/ld+json">${ORG_SCHEMA}</script>`,
    `<script type="application/ld+json">${WEBSITE_SCHEMA}</script>`,
    isHome ? `<script type="application/ld+json">${FAQ_SCHEMA}</script>` : "",
  ].filter(Boolean).join("\n    ");
}

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/about</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/programs</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/campaigns</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/campaigns/3</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/donate</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/zakat</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/sadaqah</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/volunteer</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/get-involved</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${BASE_URL}/contact</loc><changefreq>yearly</changefreq><priority>0.6</priority></url>
  <url><loc>${BASE_URL}/blog</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/blog/how-to-calculate-zakat-on-savings</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${BASE_URL}/blog/what-is-sadaqah-jariyah</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${BASE_URL}/blog/importance-of-islamic-education</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${BASE_URL}/blog/ramadan-charity-giving-guide</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
</urlset>`;

const ROBOTS = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /login
Disallow: /signup

Sitemap: ${BASE_URL}/sitemap.xml`;

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }

  app.use(express.static(distPath));

  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.type("text/plain").send(ROBOTS);
  });

  app.get("/sitemap.xml", (_req: Request, res: Response) => {
    res.type("application/xml").send(SITEMAP);
  });

  // Inject per-page SEO tags so Googlebot sees real metadata
  app.use("*", (req: Request, res: Response) => {
    const htmlPath = path.resolve(distPath, "index.html");
    let html = fs.readFileSync(htmlPath, "utf-8");
    const injected = buildMeta(req.originalUrl);
    html = html.replace("</head>", `  ${injected}\n  </head>`);
    res.type("text/html").send(html);
  });
}
