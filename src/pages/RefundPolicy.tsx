import React from 'react';

export default function RefundPolicy() {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Refund Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Overview</h2>
            <p>
              At PngBird, we want to ensure you are completely satisfied with your purchase. 
              Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. 
              Paddle provides all customer service inquiries and handles returns.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. 14-Day Money-Back Guarantee</h2>
            <p>
              We offer a 14-day money-back guarantee on all our one-time license purchases, subject to fair use conditions. 
              If you are not satisfied with PngBird, you can request a full refund within 14 days of your original purchase date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Fair Use Condition for Refunds</h2>
            <p>
              Because our tool involves significant computational resources and API usage, our refund policy includes a strict usage limit to prevent abuse.
            </p>
            <p className="font-medium text-foreground">
              Refunds will ONLY be granted if you have generated fewer than 10 images using our premium features.
            </p>
            <p>
              If our system logs show that you have generated 10 or more images, your refund request will be denied, even if it is within the 14-day window. This policy ensures that users can test the premium features to see if they meet their needs without exploiting the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. How to Request a Refund</h2>
            <p>
              To request a refund, please contact us at <strong>support@PngBird.com</strong> with your order number and the email address associated with your Paddle purchase. 
              Alternatively, you can contact Paddle's buyer support directly at <a href="https://paddle.net" className="text-primary hover:underline">paddle.net</a>.
            </p>
            <p>
              Once your refund is approved, your premium license will be immediately revoked, and the funds will be returned to your original payment method within 3-5 business days, depending on your bank.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Chargebacks and Disputes</h2>
            <p>
              If you initiate a chargeback or dispute with your bank or credit card company without first contacting us or Paddle for a refund, your account and license will be immediately and permanently terminated. We strongly encourage you to reach out to our support team first to resolve any issues.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
