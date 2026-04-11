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
  price: string;
  oldPrice: string;
  description: string;
  features: string[];
  lockedFeatures?: string[];
  icon: React.ElementType;
  color: string;
  bg: string;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$5',
    oldPrice: '$10',
    description: 'Perfect for hobbyists',
    features: [
      'Unlimited Generations',
      'Lifetime access',
      '1 Image generation at a time',
      'Auto Background Removal',
      'Standard Quality (1K)',
      'Email Support'
    ],
    icon: Zap,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$15',
    oldPrice: '$30',
    description: 'For power users',
    features: [
      'Unlimited Generations',
      'Lifetime access',
      'Batch generation (up to 4)',
      'Pro + Auto BG Removal',
      'High Quality (2K)',
      'Priority Support',
      'Web Search Inspiration'
    ],
    icon: Sparkles,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    popular: true
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: '$25',
    oldPrice: '$50',
    description: 'The complete toolkit',
    features: [
      'Unlimited Generations',
      'Lifetime access',
      'Batch generation (up to 4)',
      'ZIP Export (All Images)',
      'Pro + Auto BG Removal',
      'Ultra Quality (4K)',
      'Priority Support',
      'Web Search Inspiration',
      'Reference Images',
      'Private generations'
    ],
    icon: Crown,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10'
  }
];

export function PricingSection() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  const currentPlanId = user?.unsafeMetadata?.plan as string || 'free';

  const handleSelectPlan = async (planId: string) => {
    if (currentPlanId === planId) {
      toast.info('You are already on this plan');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
    }
  };

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
          Simple, One-Time Pricing
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          No subscriptions. Pay once, own it forever. Choose the plan that fits your creative workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
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
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${plan.bg}`}>
                  <plan.icon className={`w-6 h-6 ${plan.color}`} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground line-through">{plan.oldPrice}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
                {plan.lockedFeatures?.map((feature, i) => (
                  <div key={`locked-${i}`} className="flex items-start gap-3 text-sm text-muted-foreground/50">
                    <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="line-through">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

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
