import React from 'react';
import { PricingSection } from '../components/PricingSection';

export default function Pricing() {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-6 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <PricingSection />
      </div>
    </div>
  );
}
