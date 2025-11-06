import React, { useEffect, useState, Suspense, useContext } from 'react';
import { ProductDetails } from '../components/product-details';
import { ProductDetailsSkeleton } from '../components/product-details-skeleton';
import { usePaddle } from '../lib/usePaddle';
import { useUser } from '../UserContext';
import { View, UserPlan } from '../types';
import { pricingPlans } from './Pricing';
import { AppViewContext } from '../App';

import type { CheckoutEventsData } from '@paddle/paddle-js/types/checkout/events';

const defaultPriceId = pricingPlans.find(p => p.planType === 'pro')?.paddleProductId;

function CheckoutContent() {
  const { setView } = useContext(AppViewContext)!;
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const userEmail = searchParams.get("email") ?? undefined;
  const appUserId = searchParams.get("app-user-id") ?? undefined; // Supabase User ID
  const priceId = searchParams.get("price-id") ?? defaultPriceId ?? "";
  const discountCode = searchParams.get("discount-code") ?? undefined;
  const discountId = searchParams.get("discount-id") ?? undefined;

  const { updateUserPlan, authenticated } = useUser();

  const handleCheckoutComplete = async (data: CheckoutEventsData) => { // data is now CheckoutCompletedData from usePaddle
    console.log('Paddle checkout completed (usePaddle callback):', data);
    // The 'subscription' property is safely available on CheckoutCompletedData
    if (data.subscription) { 
      const subscription = data.subscription;
      let newPlan: UserPlan | undefined;
      const purchasedPriceId = subscription.items[0]?.price_id;
      const matchingPlan = pricingPlans.find(p => p.paddleProductId === purchasedPriceId);

      if (matchingPlan) {
        newPlan = matchingPlan.planType;
        if (authenticated) { // Only update user plan if authenticated
          await updateUserPlan(newPlan);
          alert(`Subscription successful! Your plan has been updated to ${matchingPlan.title}.`);
        } else {
          // This case should ideally not happen if Pricing page gates access to unauthenticated users.
          alert('Subscription successful! Please log in to see your updated plan.');
        }
      } else {
        alert('Subscription successful, but could not determine new plan. Please check your dashboard.');
      }
      
      setView(View.Dashboard); // Redirect to Dashboard after successful checkout
    } else {
      alert('Purchase successful! Thank you.');
      setView(View.Pricing); // Redirect back to Pricing
    }
  };

  const { checkoutData } = usePaddle({
    priceId,
    userEmail,
    appUserId,
    discountCode,
    discountId,
    onCheckoutComplete: handleCheckoutComplete,
  });

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Access Denied</h1>
        <p className="text-lg text-secondary-foreground/80">
          Please <button onClick={() => setView(View.Auth)} className="text-primary hover:underline">log in</button> to complete your purchase.
        </p>
      </div>
    );
  }

  if (!priceId) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Checkout Error</h1>
        <p className="text-lg text-secondary-foreground/80">
          Missing price ID for checkout. Please select a plan from the <button onClick={() => setView(View.Pricing)} className="text-primary hover:underline">Pricing</button> page.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid mx-auto p-0 px-2 
                  lg:w-full lg:grid-cols-[1fr_1fr] lg:p-0 lg:min-h-screen`}
    >
      <div className="w-full flex justify-center lg:bg-card lg:order-2 lg:min-h-[50vh] pt-6 pb-6">
        <div
          className={`w-full max-w-[min(647px,100vw)] pt-6 
                      lg:px-8 lg:pt-16`}
        >
          {checkoutData ? <ProductDetails checkoutData={checkoutData} /> : <ProductDetailsSkeleton />}
        </div>
      </div>

      <div className="w-full max-w-[min(647px,100vw)] lg:order-1 lg:pt-10 lg:px-4 mx-auto">
        {checkoutData && (
          <h2 className="hidden lg:block text-2xl py-6 px-3 font-semibold leading-none text-card-foreground">Payment details</h2>
        )}
        <div className="paddle-checkout-frame w-full" />
      </div>
    </div>
  );
}

const CheckoutPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-24 text-center text-secondary-foreground">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
export default CheckoutPage;