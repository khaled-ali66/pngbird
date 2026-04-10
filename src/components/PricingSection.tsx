import React, { useState } from 'react';
import { Check, Crown, Zap, Sparkles, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DemoCheckoutModal } from './DemoCheckoutModal';

type Plan = {
  id: string;
  name: string;
  originalPrice: string;
  discountPrice: string;
  description: string;
  features: string[];
  // الـ features دي بتتخفى عن الـ plans اللي أقل
  lockedFromPlans?: string[]; // الـ plan ids اللي هتشوف الـ feature دي locked
  icon: React.ElementType;
  color: string;
  bg: string;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    originalPrice: '$9',
    discountPrice: '$4.5',
    description: 'Perfect for hobbyists',
    features: [
      '1 Image generation at a time',
      '20 Local Image History',
      'Auto Background Removal',
      'Standard Quality (1K)',
      'Email Support',
    ],
    icon: Zap,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'pro',
    name: 'Pro',
    originalPrice: '$29',
    discountPrice: '$14.5',
    description: 'For power users',
    features: [
      'Batch generation (up to 4)',
      '100 Local Image History',
      'Pro + Auto BG Removal',
      'High Quality (2K)',
      'Priority Support',
      'Web Search Inspiration',
    ],
    icon: Sparkles,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    popular: true,
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    originalPrice: '$49',
    discountPrice: '$24.5',
    description: 'The complete toolkit',
    features: [
      'Batch generation (up to 4)',
      'Unlimited Local History',
      'ZIP Export (All Images)',
      'Pro + Auto BG Removal',
      'Ultra Quality (4K)',
      'Priority Support',
      'Web Search Inspiration',
      'Reference Images',
    ],
    icon: Crown,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
];

// الـ features اللي بتتخفى من كل plan
// basic  → يشوف pro + ultimate features كـ locked
// pro    → يشوف ultimate features كـ locked
const PLAN_ORDER = ['free', 'basic', 'pro', 'ultimate'];

// features خاصة بكل plan — مش موجودة في اللي قبله
const PRO_EXCLUSIVE = [
  'Batch generation (up to 4)',
  'Pro + Auto BG Removal',
  'High Quality (2K)',
  'Priority Support',
  'Web Search Inspiration',
];

const ULTIMATE_EXCLUSIVE = [
  'ZIP Export (All Images)',
  'Ultra Quality (4K)',
  'Reference Images',
  'Unlimited Local History',
];

function isFeatureLocked(feature: string, planId: string, currentPlanId: string): boolean {
  const currentLevel = PLAN_ORDER.indexOf(currentPlanId);

  // ultimate features مخفية عن free و basic
  if (ULTIMATE_EXCLUSIVE.includes(feature)) {
    return currentLevel < PLAN_ORDER.indexOf('ultimate');
  }

  // pro features مخفية عن free و basic (لما نكون في كارد ultimate أو pro)
  if (PRO_EXCLUSIVE.includes(feature) && planId !== 'basic') {
    return currentLevel < PLAN_ORDER.indexOf('pro');
  }

  return false;
}

export function PricingSection() {
  const { user } = useUser();
  const navigate  = useNavigate();
  const [loadingPlan,  setLoadingPlan]  = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  const currentPlanId = (user?.unsafeMetadata?.plan as string) || 'free';

  const handleSelectPlan = (planId: string) => {
    if (currentPlanId === planId) { toast.info('You are already on this plan'); return; }
    const plan = plans.find(p => p.id === planId);
    if (plan) setSelectedPlan(plan);
  };

  return (
    <div className="space-y-12">

      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
          Simple, One-Time Pricing
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          No subscriptions. Pay once, own it forever. Choose the plan that fits your creative workflow.
        </p>

        {/* Discount badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-bold">
          🎉 Limited Time — 50% OFF All Plans
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${
              plan.popular
                ? 'bg-card border-purple-500/50 shadow-2xl shadow-purple-500/10'
                : 'bg-card/50 border-border hover:border-border/80'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}

            <div className="space-y-6 flex-1">

              {/* Icon + Price */}
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${plan.bg}`}>
                  <plan.icon className={`w-6 h-6 ${plan.color}`} />
                </div>

                {/* Price with strikethrough */}
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                    <span className="text-xs font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">-50%</span>
                  </div>
                  <span className="text-3xl font-bold text-foreground">{plan.discountPrice}</span>
                </div>
              </div>

              {/* Name + description */}
              <div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {plan.features.map((feature, i) => {
                  const locked = isFeatureLocked(feature, plan.id, currentPlanId);
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 text-sm transition-all ${
                        locked ? 'opacity-0 pointer-events-none select-none h-0 overflow-hidden my-0 py-0' : 'text-muted-foreground'
                      }`}
                      aria-hidden={locked}
                    >
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => handleSelectPlan(plan.id)}
              disabled={loadingPlan !== null}
              className={`mt-8 w-full h-12 rounded-xl font-bold transition-all ${
                plan.popular
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-foreground text-background hover:bg-foreground/90'
              }`}
            >
              {loadingPlan === plan.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : currentPlanId === plan.id ? (
                'Current Plan'
              ) : (
                `Get ${plan.name}`
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="text-center p-8 bg-card/30 border border-border rounded-3xl">
        <p className="text-sm text-muted-foreground">
          All plans include a 14-day money-back guarantee. Need a custom plan?{' '}
          <a href="/contact" className="text-foreground font-bold hover:underline">Contact us</a>.
        </p>
      </div>

      {selectedPlan && (
        <DemoCheckoutModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan}
        />
      )}
    </div>
  );
}
