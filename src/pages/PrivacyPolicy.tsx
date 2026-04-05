import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-16 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center">
            <Shield className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Privacy Policy</h1>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to PngBird. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our website 
            and tell you about your privacy rights and how the law protects you.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. The Data We Collect About You</h2>
          <p>
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes email address.</li>
            <li><strong>Financial and Transaction Data</strong> is handled entirely by our Merchant of Record, Paddle.com. We do not store or process your credit card details on our servers.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
            <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Payment Processing and Merchant of Record</h2>
          <p>
            Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. 
            When you purchase a license for PngBird, you are making a purchase from Paddle.com, and your payment information is collected and processed directly by them. 
            Paddle's processing of your personal data is governed by their own Privacy Policy, which you can review at <a href="https://paddle.com/privacy" className="text-primary hover:underline" target="_blank" rel="noreferrer">paddle.com/privacy</a>.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. How We Use Your Personal Data</h2>
          <p>
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., providing access to our software).</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track the activity on our service and hold certain information. 
            Cookies are files with a small amount of data which may include an anonymous unique identifier. 
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. 
            However, if you do not accept cookies, you may not be able to use some portions of our service.
          </p>
          <p className="mt-4">
            For more detailed information about the cookies we use and how to manage your preferences, please review our <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Data Security & International Transfers</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, 
            or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those 
            employees, agents, contractors, and other third parties who have a business need to know.
          </p>
          <p className="mt-4">
            Your data may be transferred to and processed in countries other than the country in which you are located. These countries may have data protection laws that are different from the laws of your country. We take appropriate safeguards to ensure your data remains protected in accordance with this privacy policy and applicable data protection laws.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Data Retention</h2>
          <p>
            We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements. We may retain your personal data for a longer period in the event of a complaint or if we reasonably believe there is a prospect of litigation in respect to our relationship with you.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Your Legal Rights</h2>
          <p>
            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Request access to your personal data.</li>
            <li>Request correction of your personal data.</li>
            <li>Request erasure of your personal data.</li>
            <li>Object to processing of your personal data.</li>
            <li>Request restriction of processing your personal data.</li>
            <li>Request transfer of your personal data.</li>
            <li>Right to withdraw consent.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at <strong>support@PngBird.com</strong> or via our <Link to="/contact" className="text-primary hover:underline">Contact page</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
