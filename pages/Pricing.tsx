import React, { createContext, useContext } from 'react';
import { useUser } from '../UserContext';
import { UserPlan, View } from '../types';
import { AppViewContext } from '../App';

interface PricingPlan {
  title: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  annualSavings: string;
  features: string[];
  buttonText: string;
  isFree?: boolean;
  planType: UserPlan;
  paddleProductId?: string;
}

export const pricingPlans: PricingPlan[] = [
  {
    title: 'Starter Plan',
    description: 'Perfect for individuals starting their AI journey.',
    monthlyPrice: 'Free',
    annualPrice: 'Free',
    annualSavings: '',
    features: [
      '5 AI Chat Generations / day',
      'Basic AI access',
    ],
    buttonText: 'Get Started',
    isFree: true,
    planType: 'starter',
  },
  {
    title: 'Pro Plan',
    description: 'Advanced tools for serious strategists and creators.',
    monthlyPrice: '$12.90 / month',
    annualPrice: '$129.00 / year',
    annualSavings: 'Save 17%',
    features: [
      'Access to Co-founder Voice Agent (with rate limits)',
      '5 Image Generations / day',
      '50 AI Chat Generations / day',
      'All other AI features (limited usage)',
      'Community support',
    ],
    buttonText: 'Upgrade to Pro',
    planType: 'pro',
    paddleProductId: 'pri_01hsmv8f6f9h4f7e2s1a7g6f5d',
  },
  {
    title: 'Advanced Plan',
    description: 'Unlimited power for comprehensive AI integration.',
    monthlyPrice: '$39.90 / month',
    annualPrice: '$399.00 / year',
    annualSavings: 'Save 17%',
    features: [
      'Unlimited access to all features',
      'Unlimited Co-founder Voice Agent',
      'Unlimited Image Generations',
      'Unlimited AI Chat Generations',
      'Premium customer service',
      'Priority access to new features',
    ],
    buttonText: 'Upgrade to Advanced',
    planType: 'advanced',
    paddleProductId: 'pri_01hsmv9a0b1c2d3e4f5g6h7i8j',
  },
];

const Pricing: React.FC = () => {
  const { userPlan, updateUserPlan, authenticated, user } = useUser();
  const { setView } = useContext(AppViewContext)!;

  const handlePurchase = (plan: PricingPlan) => {
    if (!authenticated) {
      alert("Please log in or register to purchase a plan.");
      setView(View.Auth);
      return;
    }

    if (plan.isFree) {
      updateUserPlan('starter');
      alert('You are now on the Starter Plan!');
      return;
    }

    if (!window.Paddle) {
      alert("Payment system not available. Please try again later or contact support.");
      return;
    }

    if (plan.paddleProductId) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('view', View.Checkout);
      currentUrl.searchParams.set('price-id', plan.paddleProductId);
      
      // Pass authenticated user email and ID for pre-filling checkout
      if (user?.email) {
        currentUrl.searchParams.set('email', user.email);
      }
      if (user?.id) {
        currentUrl.searchParams.set('app-user-id', user.id);
      }

      window.history.pushState({}, '', currentUrl.toString());
      setView(View.Checkout);
    } else {
      alert('Product ID missing for this plan.');
    }
  };

  const getButtonState = (planType: UserPlan) => {
    if (!authenticated) {
      return { text: 'Login to Purchase', disabled: false, className: 'bg-primary text-primary-foreground hover:bg-primary/90' };
    }
    if (userPlan === planType) {
      return { text: 'Current Plan', disabled: true, className: 'bg-primary/50 text-primary-foreground cursor-not-allowed' };
    }
    const plans: UserPlan[] = ['starter', 'pro', 'advanced'];
    if (plans.indexOf(userPlan) > plans.indexOf(planType)) {
      return { text: 'Downgrade (Contact Support)', disabled: true, className: 'bg-red-600/50 text-white cursor-not-allowed' };
    }
    return { text: `Upgrade to ${planType.charAt(0).toUpperCase() + planType.slice(1)}`, disabled: false, className: 'bg-primary text-primary-foreground hover:bg-primary/90' };
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="mt-4 text-lg text-secondary-foreground/80">
          Unlock the full potential of AI with a plan that fits your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {pricingPlans.map((plan, index) => {
          const buttonState = getButtonState(plan.planType);
          const isActivePlan = userPlan === plan.planType;

          return (
            <div
              key={plan.title}
              className={`bg-card border rounded-lg p-8 flex flex-col justify-between transform transition-transform duration-300 hover:scale-[1.02] ${
                isActivePlan
                  ? 'border-primary shadow-md shadow-primary/30'
                  : 'border-border'
              }`}
            >
              <div>
                <h2 className={`text-2xl font-bold ${isActivePlan ? 'text-primary' : 'text-card-foreground'} mb-2`}>{plan.title}</h2>
                <p className="text-secondary-foreground/70 mb-6">{plan.description}</p>
                
                <div className="mb-8">
                  {plan.isFree ? (
                    <p className="text-5xl font-extrabold text-foreground">Free</p>
                  ) : (
                    <>
                      <p className="text-4xl font-extrabold text-foreground mb-1">{plan.monthlyPrice}</p>
                      <p className="text-lg text-secondary-foreground/80">{plan.annualPrice} <span className="text-primary font-medium">({plan.annualSavings})</span></p>
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8 text-secondary-foreground">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <svg className="h-5 w-5 text-success mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button
                onClick={() => handlePurchase(plan)}
                disabled={buttonState.disabled}
                className={`w-full py-3 rounded-md font-semibold transition-colors ${buttonState.className}`}
              >
                {buttonState.text}
              </button>
            </div>
          );
        })}
      </div>
       <p className="mt-12 text-center text-sm text-secondary-foreground/60">
        Prices are for demonstration purposes only. This is a client-side simulation; in a production environment, payment processing would involve a secure backend. Learn more about Paddle pricing at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ai.google.dev/gemini-api/docs/billing</a>.
      </p>
    </div>
  );
};

export default Pricing;