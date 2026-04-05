import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ArrowLeft } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-16 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center">
            <Cookie className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Cookie Policy</h1>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-lg text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. What are cookies?</h2>
          <p>
            Cookies are small text files that uniquely identify your browser or device. The cookie file is stored on your browser. 
            When you return to our website (or visit websites that use the same cookies), these websites recognize the cookies and your browsing device.
          </p>
          <p>
            Cookies do many different jobs, like letting you navigate between pages efficiently, remembering your preferences, 
            and generally improving your experience. They can also help ensure that the advertisements you see online are more relevant to you and your interests.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. How do we use cookies?</h2>
          <p>
            We use cookies for several different purposes:
          </p>
          <ul className="list-disc pl-6 space-y-4 mt-4">
            <li>
              <strong>Essential Cookies:</strong> These cookies are necessary to provide you with the core functionality of our Services, 
              such as accessing secure areas, managing your session, and storing your API keys locally in your browser. Without these cookies, 
              we would not be able to provide you with the services you have asked for.
            </li>
            <li>
              <strong>Functionality Cookies:</strong> These record information about choices you have made and allow us to tailor our Services to you. 
              For example, remembering your theme preference (light/dark mode) or your preferred AI model settings.
            </li>
            <li>
              <strong>Performance & Analytics Cookies:</strong> These help us measure traffic and usage data to analyze how our Services are used. 
              This allows us to provide a better user experience and maintain, operate, and improve our platform.
            </li>
            <li>
              <strong>Targeting & Advertising Cookies:</strong> We may use third-party advertising companies, such as Google AdSense, to serve ads. 
              These cookies help show you ads that are relevant to you and measure the effectiveness of ad campaigns.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Third-Party Cookies</h2>
          <p>
            In addition to our own cookies, we may also use various third-party cookies to report usage statistics, deliver advertisements, 
            and process payments. For example, our Merchant of Record, Paddle.com, uses cookies to securely process your transactions and prevent fraud.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Managing Your Cookie Preferences</h2>
          <p>
            You have the right to decide whether to accept or reject non-essential cookies. You can exercise your cookie preferences through 
            the cookie consent banner that appears when you first visit our website.
          </p>
          <p className="mt-4">
            Additionally, most web browsers allow some control of most cookies through the browser settings. You can set your browser to refuse 
            all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that 
            some parts of this website may become inaccessible or not function properly (such as storing your API keys).
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Contact Us</h2>
          <p>
            If you have any questions about our use of cookies or other technologies, please contact us at <strong>support@PngBird.com</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
