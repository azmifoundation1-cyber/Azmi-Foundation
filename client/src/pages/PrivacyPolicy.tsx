import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/use-seo";

const PRIVACY_HTML = `
<style>
  [data-custom-class='body'], [data-custom-class='body'] * { background: transparent !important; }
  [data-custom-class='title'], [data-custom-class='title'] * { font-family: Arial !important; font-size: 26px !important; color: #000000 !important; }
  [data-custom-class='subtitle'], [data-custom-class='subtitle'] * { font-family: Arial !important; color: #595959 !important; font-size: 14px !important; }
  [data-custom-class='heading_1'], [data-custom-class='heading_1'] * { font-family: Arial !important; font-size: 19px !important; color: #000000 !important; }
  [data-custom-class='heading_2'], [data-custom-class='heading_2'] * { font-family: Arial !important; font-size: 17px !important; color: #000000 !important; }
  [data-custom-class='body_text'], [data-custom-class='body_text'] * { color: #595959 !important; font-size: 14px !important; font-family: Arial !important; }
  [data-custom-class='link'], [data-custom-class='link'] * { color: #3030F1 !important; font-size: 14px !important; font-family: Arial !important; word-break: break-word !important; }
  .privacy-content ul { list-style-type: square; }
  .privacy-content ul > li > ul { list-style-type: circle; }
  .privacy-content ul > li > ul > li > ul { list-style-type: square; }
  .privacy-content ol li { font-family: Arial; }
  .privacy-content bdt { display: inline; }
</style>

<div data-custom-class="body">
  <div><strong><span style="font-size: 26px;"><span data-custom-class="title"><h1>AZMI FOUNDATION PRIVACY POLICY</h1></span></span></strong></div>
  <div><span style="color: rgb(127,127,127);"><strong><span style="font-size: 15px;"><span data-custom-class="subtitle">Last updated May 01, 2026</span></span></strong></span></div>
  <div><br></div>

  <div style="line-height:1.5;"><span data-custom-class="body_text">This Privacy Notice for <strong>AZMI FOUNDATION</strong> ('we', 'us', or 'our'), describes how and why we might access, collect, store, use, and/or share ('process') your personal information when you use our services ('Services'), including when you:</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height:1.5;">Visit our website at <a href="https://www.azmifoundation.com" target="_blank" data-custom-class="link">www.azmifoundation.com</a></li>
    <li data-custom-class="body_text" style="line-height:1.5;">Make donations or engage with our fundraising campaigns</li>
    <li data-custom-class="body_text" style="line-height:1.5;">Engage with us in other related ways, including any marketing or events</li>
  </ul>

  <div style="line-height:1.5;"><span data-custom-class="body_text"><strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:support@azmifoundation.com" data-custom-class="link">support@azmifoundation.com</a>.</span></div>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span style="font-size:19px;" data-custom-class="heading_1">SUMMARY OF KEY POINTS</span></strong></div>
  <div><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">This summary provides key points from our Privacy Notice. You can find out more details about any of these topics by reading the full notice below.</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>What personal information do we process?</strong> We collect information you provide when making donations, registering, or contacting us — including name, email, phone, PAN, and address.</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information beyond what is needed for 80G tax receipts (PAN number).</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>Do we collect any information from third parties?</strong> We do not collect information from third parties.</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>How do we process your information?</strong> We process your information to operate our services, process donations, issue tax receipts, and communicate with you.</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>In what situations and with which parties do we share personal information?</strong> We may share information with payment processors (Razorpay) and government authorities for tax compliance only.</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>How do we keep your information safe?</strong> We have technical and organisational measures in place to protect your personal information.</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>What are your rights?</strong> You may request access, correction, or deletion of your personal data at any time by emailing us.</li>
  </ul>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span style="font-size:19px;" data-custom-class="heading_1">1. WHAT INFORMATION DO WE COLLECT?</span></strong></div>
  <div><br></div>
  <div style="line-height:1.5;"><strong><span data-custom-class="heading_2">Personal information you disclose to us</span></strong></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">We collect personal information that you voluntarily provide when making a donation, registering on the site, applying for fundraising, or contacting us. This includes:</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height:1.5;">Name, email address, phone number</li>
    <li data-custom-class="body_text" style="line-height:1.5;">Mailing address and PIN code</li>
    <li data-custom-class="body_text" style="line-height:1.5;">PAN number (for 80G tax receipts only)</li>
    <li data-custom-class="body_text" style="line-height:1.5;">Payment information processed securely through Razorpay (we do not store card details)</li>
    <li data-custom-class="body_text" style="line-height:1.5;">Messages and enquiries submitted via the contact form</li>
  </ul>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span data-custom-class="heading_2">Information automatically collected</span></strong></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">When you visit our website, we automatically collect certain information, including your IP address, browser type, device information, and pages visited. We use cookies and similar tracking technologies (including Google Analytics, Meta Pixel, Microsoft Clarity, and Google AdSense) to improve user experience and measure campaign performance.</span></div>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span style="font-size:19px;" data-custom-class="heading_1">2. HOW DO WE PROCESS YOUR INFORMATION?</span></strong></div>
  <div><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">We process your personal information for the following purposes:</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height:1.5;">To process and confirm your donations</li>
    <li data-custom-class="body_text" style="line-height:1.5;">To generate and deliver 80G tax exemption receipts</li>
    <li data-custom-class="body_text" style="line-height:1.5;">To communicate with you about campaigns, receipts, and updates</li>
    <li data-custom-class="body_text" style="line-height:1.5;">To evaluate fundraising applications</li>
    <li data-custom-class="body_text" style="line-height:1.5;">To comply with legal and regulatory obligations</li>
    <li data-custom-class="body_text" style="line-height:1.5;">To improve our website and services</li>
  </ul>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span style="font-size:19px;" data-custom-class="heading_1">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</span></strong></div>
  <div><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">We may share your personal information in the following situations:</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>Razorpay:</strong> Payment processing. Razorpay processes your payment securely under their own privacy policy.</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>Government / Tax Authorities:</strong> We may be required to share donor information (including PAN) with the Income Tax Department of India for 80G compliance.</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>Legal obligations:</strong> We may disclose your information if required by law, court order, or government authority.</li>
  </ul>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span style="font-size:19px;" data-custom-class="heading_1">4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</span></strong></div>
  <div><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">Yes. We use cookies and similar tracking technologies to collect and store information. The technologies we use include:</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>Google Tag Manager & Google Analytics</strong> — website analytics</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>Google Ads (gtag)</strong> — conversion tracking for donation campaigns</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>Meta Pixel (Facebook)</strong> — ad performance measurement</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>Microsoft Clarity</strong> — session recording and heatmaps</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>Google AdSense</strong> — display advertising to support our operational costs</li>
    <li data-custom-class="body_text" style="line-height:1.5;"><strong>Ahrefs Analytics</strong> — SEO and traffic analytics</li>
  </ul>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span style="font-size:19px;" data-custom-class="heading_1">5. HOW LONG DO WE KEEP YOUR INFORMATION?</span></strong></div>
  <div><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">We keep your personal information for as long as necessary to fulfil the purposes outlined in this notice, unless a longer retention period is required by law (e.g., donation records for tax and audit purposes are retained for a minimum of 7 years as required under Indian law).</span></div>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span style="font-size:19px;" data-custom-class="heading_1">6. HOW DO WE KEEP YOUR INFORMATION SAFE?</span></strong></div>
  <div><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">We have implemented appropriate technical and organisational security measures to protect your personal information. All payments are processed via Razorpay, which is PCI-DSS compliant. We do not store credit/debit card details on our servers. However, no method of transmission over the Internet is 100% secure.</span></div>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span style="font-size:19px;" data-custom-class="heading_1">7. WHAT ARE YOUR PRIVACY RIGHTS?</span></strong></div>
  <div><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">You have the right to:</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height:1.5;">Request access to the personal information we hold about you</li>
    <li data-custom-class="body_text" style="line-height:1.5;">Request correction of inaccurate information</li>
    <li data-custom-class="body_text" style="line-height:1.5;">Request deletion of your personal information (subject to legal obligations)</li>
    <li data-custom-class="body_text" style="line-height:1.5;">Withdraw consent to marketing communications at any time</li>
  </ul>
  <div style="line-height:1.5;"><span data-custom-class="body_text">To exercise any of these rights, please contact us at <a href="mailto:support@azmifoundation.com" data-custom-class="link">support@azmifoundation.com</a>.</span></div>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span style="font-size:19px;" data-custom-class="heading_1">8. ABOUT OUR ORGANISATION</span></strong></div>
  <div><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">Azmi Foundation is an 80G & FCRA registered charitable trust based in Ahmedabad, Gujarat, India. Our main services and activities include:</span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height:1.5;">Providing free and affordable healthcare services through medical camps, health awareness programs, and support for underprivileged patients.</li>
    <li data-custom-class="body_text" style="line-height:1.5;">Promoting education by supporting students from economically weaker sections through scholarships, school infrastructure support, and educational aid.</li>
    <li data-custom-class="body_text" style="line-height:1.5;">Running food distribution and hunger relief programs for orphans, widows, and needy families.</li>
    <li data-custom-class="body_text" style="line-height:1.5;">Women empowerment and skill development initiatives.</li>
    <li data-custom-class="body_text" style="line-height:1.5;">Disaster relief and emergency support during natural calamities.</li>
    <li data-custom-class="body_text" style="line-height:1.5;">General social service and community development projects.</li>
  </ul>
  <div style="line-height:1.5;"><span data-custom-class="body_text">The foundation operates under the leadership of Dr. Azmi Shahbaz Azhar (Managing Trustee) along with other family trustees. We accept donations from individuals and organisations to fund our charitable projects. Donors in India can avail tax benefits under Section 80G of the Income Tax Act.</span></div>
  <div><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">We use Google AdSense on our website to generate revenue that helps cover operational costs and supports our social service activities.</span></div>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span style="font-size:19px;" data-custom-class="heading_1">9. DO WE MAKE UPDATES TO THIS NOTICE?</span></strong></div>
  <div><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">Yes, we will update this notice as necessary to stay compliant with relevant laws. The updated version will be indicated by an updated 'Last updated' date at the top of this notice.</span></div>
  <div><br></div>

  <div style="line-height:1.5;"><strong><span style="font-size:19px;" data-custom-class="heading_1">10. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</span></strong></div>
  <div><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text">If you have questions or comments about this notice, you may contact us at:</span></div>
  <div style="line-height:1.5;"><br></div>
  <div style="line-height:1.5;"><span data-custom-class="body_text"><strong>Azmi Foundation</strong><br>Ahmedabad, Gujarat, India<br>Email: <a href="mailto:support@azmifoundation.com" data-custom-class="link">support@azmifoundation.com</a><br>Website: <a href="https://www.azmifoundation.com" target="_blank" data-custom-class="link">www.azmifoundation.com</a></span></div>
  <div><br></div>

  <div><br></div>
  <div><span data-custom-class="body_text">This Privacy Policy was created using <a href="https://termly.io/products/privacy-policy-generator/" target="_blank" rel="noopener external" data-custom-class="link">Termly's Privacy Policy Generator</a></span></div>
</div>
`;

export default function PrivacyPolicy() {
  useSEO({
    title: "Privacy Policy",
    description: "Read the Azmi Foundation Privacy Policy. Learn how we collect, use, and protect your personal information when you donate or use our website.",
    url: "/privacy-policy",
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div
          className="privacy-content"
          dangerouslySetInnerHTML={{ __html: PRIVACY_HTML }}
        />
      </main>
      <Footer />
    </div>
  );
}
