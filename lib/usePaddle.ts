import { useEffect, useState } from 'react';
import { initializePaddle, Paddle, Environments, Theme } from "@paddle/paddle-js";
// Fix: Import CheckoutEventsData and CheckoutCompletedData from the specific events path
import type { CheckoutEventsData, CheckoutCompletedData } from "@paddle/paddle-js/types/checkout/events";
// Fix: Import CheckoutOpenOptions from its specific path
import type { CheckoutOpenOptions } from "@paddle/paddle-js/types/checkout/open-options";


interface UsePaddleProps {
  priceId: string | undefined;
  userEmail?: string;
  appUserId?: string; // This will be the Supabase user ID
  discountCode?: string;
  discountId?: string;
  // Fix: Use CheckoutCompletedData for onCheckoutComplete for precise typing of completed events
  onCheckoutComplete: (data: CheckoutCompletedData) => void; // Callback for checkout completion
  onCheckoutLoaded?: (data: CheckoutEventsData) => void; // Callback for checkout loaded
  onCheckoutUpdated?: (data: CheckoutEventsData) => void; // Callback for checkout updated
  theme?: Theme; // Allow theme to be passed if needed
}

export const usePaddle = ({ 
  priceId, 
  userEmail, 
  appUserId, 
  discountCode, 
  discountId, 
  onCheckoutComplete,
  onCheckoutLoaded,
  onCheckoutUpdated,
  theme = 'dark', // Default theme if not provided
}: UsePaddleProps) => {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutEventsData | null>(null);
  const [isPaddleReady, setIsPaddleReady] = useState(false);

  useEffect(() => {
    // Check if Paddle is already initialized or if client token is missing
    if (paddle?.Initialized || !process.env.PADDLE_CLIENT_TOKEN) {
      // If already initialized, just set it as ready to open checkout
      if (paddle?.Initialized) setIsPaddleReady(true);
      return;
    }

    const paddleClientToken = process.env.PADDLE_CLIENT_TOKEN;
    const paddleEnvironment = (process.env.PADDLE_ENV as Environments) || 'sandbox';

    initializePaddle({
      token: paddleClientToken,
      environment: paddleEnvironment,
      eventCallback: (event) => {
        // Handle checkout completion
        if (event.name === "checkout.completed") {
          // Fix: Cast event.data to CheckoutCompletedData since the event name confirms its type
          onCheckoutComplete(event.data as CheckoutCompletedData);
        }
        // Handle checkout loaded and updated events for displaying product details
        if (event.data && event.name === 'checkout.loaded') {
          setCheckoutData(event.data);
          onCheckoutLoaded?.(event.data);
        }
        if (event.data && event.name === 'checkout.updated') {
          setCheckoutData(event.data);
          onCheckoutUpdated?.(event.data);
        }
      },
      checkout: {
        settings: {
          variant: "one-page",
          displayMode: "inline",
          theme: theme,
          frameTarget: "paddle-checkout-frame",
          frameInitialHeight: 450,
          frameStyle: "width: 100%; background-color: transparent; border: none",
        },
      },
    }).then((paddleInstance) => {
      if (paddleInstance) {
        setPaddle(paddleInstance);
        setIsPaddleReady(true);
      }
    }).catch(error => {
      console.error("Failed to initialize Paddle.js:", error);
      // Potentially set an error state here
    });

  }, [paddle, onCheckoutComplete, onCheckoutLoaded, onCheckoutUpdated, theme]);

  useEffect(() => {
    if (isPaddleReady && paddle && priceId) {
      // Fix: Use CheckoutOpenOptions type
      const checkoutOptions: CheckoutOpenOptions = {
        items: [{ priceId: priceId, quantity: 1 }], // Simplified from buildItems
        ...(userEmail && { customer: { email: userEmail } }),
        ...(appUserId && { customData: { app_user_id: appUserId } }),
        ...(discountCode ? { discountCode } : discountId ? { discountId } : {}),
      };
      
      // Open or update the checkout
      // We check if checkoutData is null as an indicator if it's the initial open or a subsequent update
      // This is a heuristic; a more robust solution might use a ref for the checkout instance or Paddle's own update mechanism.
      if (checkoutData && paddle.Checkout.updateItems) { 
        paddle.Checkout.updateItems(checkoutOptions);
      } else { 
        paddle.Checkout.open(checkoutOptions);
      }
    }
  }, [isPaddleReady, paddle, priceId, userEmail, appUserId, discountCode, discountId, checkoutData]);

  return { checkoutData };
};