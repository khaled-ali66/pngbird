import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-16 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Terms of Service</h1>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Acceptance of Terms & Age Restriction</h2>
          <p>
            By accessing and using PngBird ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </p>
          <p className="mt-4">
            <strong>Age Restriction:</strong> You must be at least 18 years of age (or the age of legal majority in your jurisdiction) to use the Service. By using the Service, you represent and warrant that you meet this age requirement.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Merchant of Record and Payments</h2>
          <p>
            Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. 
            Paddle provides all customer service inquiries related to payments and handles returns. 
            By purchasing a premium license, you agree to Paddle's Terms and Conditions.
          </p>
          <p>
            All purchases are subject to our <Link to="/refund" className="text-primary hover:underline">Refund Policy</Link>, which includes a 14-day money-back guarantee subject to specific usage limits.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Acceptable Use Policy</h2>
          <p>
            You agree to use the Service only for lawful purposes. You strictly agree <strong>NOT</strong> to use the Service to generate, upload, or process content that:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Promotes or creates a risk of physical or mental harm, emotional distress, death, disability, or disfigurement to yourself, any person, or animal.</li>
            <li>Seeks to harm or exploit children in any way.</li>
            <li>Is illegal, fraudulent, or promotes illegal activities.</li>
            <li>Infringes on the intellectual property rights, copyrights, or trademarks of others.</li>
            <li>Contains non-consensual explicit content, deepfakes, or sexually explicit material (NSFW).</li>
            <li>Promotes hate speech, violence, self-harm, or discrimination based on race, religion, sex, sexual orientation, age, or disability.</li>
            <li>Violates the privacy or publicity rights of any third party.</li>
            <li>Contains disinformation that is false, deceptive, or misleading, or threatens/undermines democratic processes or institutions.</li>
          </ul>
          <p className="mt-4">
            We reserve the right to immediately terminate your account and revoke your license without a refund if you violate this Acceptable Use Policy.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Bring Your Own Key (BYOK) Liability</h2>
          <p>
            PngBird allows users to input their own API keys (e.g., from Google, OpenAI, Replicate) to use the Service for free. 
            If you choose to use your own API keys:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>You are solely responsible for keeping your API keys secure.</li>
            <li>You are solely responsible for any financial charges incurred on your third-party API accounts.</li>
            <li>You must comply with the Terms of Service and Acceptable Use Policies of the respective API providers.</li>
            <li>PngBird is not liable for any account bans, rate limits, or overage charges imposed by your API providers.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Intellectual Property Rights</h2>
          <p>
            The Service and its original content, features, and functionality are owned by PngBird and are protected by international copyright, 
            trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </p>
          <p className="mt-4">
            You retain all rights to the images you upload and generate using the Service, provided they comply with our Acceptable Use Policy. We do not claim ownership over your generated content.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Disclaimer of Warranties</h2>
          <p>
            Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. 
            The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, 
            implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Limitation of Liability</h2>
          <p>
            In no event shall PngBird, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, 
            incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
            or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; 
            (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; 
            and (iv) unauthorized access, use or alteration of your transmissions or content.
          </p>
          <p className="mt-4">
            In any case, the total liability of PngBird is limited to the amount that you have paid for the premium license of the Service.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at <strong>support@PngBird.com</strong> or via our <Link to="/contact" className="text-primary hover:underline">Contact page</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
