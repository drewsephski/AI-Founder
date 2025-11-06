import React from 'react';
import { OrderSummary } from './order-summary';
import { ProductImage } from './product-image';
import { formatBillingCycle, formatCurrency, formatTrialPeriod } from '../lib/format';
// Import CheckoutEventsData directly from paddle-js
import type { CheckoutEventsData } from '@paddle/paddle-js/types/checkout/events';


interface ProductDetailsProps {
  checkoutData: CheckoutEventsData; // Changed type to CheckoutEventsData
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ checkoutData }) => {
  const currency = checkoutData.currency_code;

  // Ensure items array and its properties are accessed safely
  const firstItem = checkoutData.items?.[0];
  const trialPeriod = firstItem?.trial_period;
  const billingCycle = firstItem?.billing_cycle;

  const numberOfPrices = checkoutData.items?.length;

  return (
    <div className="flex flex-col gap-3 px-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {firstItem?.product?.image_url && (
            <ProductImage
              className="-translate-y-1.25" // Tailwind specific, keep as is
              imageUrl={firstItem.product.image_url}
              name={firstItem.product.name}
            />
          )}
          <h2 className="text-lg font-semibold">{firstItem?.product?.name}</h2>
        </div>
        {numberOfPrices > 1 && (
          <p className="pt-1 text-sm text-secondary-foreground/70 whitespace-nowrap"> +{numberOfPrices - 1} more</p>
        )}
      </div>

      <div>
        <div className="flex flex-col">
          <p>{formatCurrency(checkoutData.totals.total, currency)} now</p>
          {checkoutData.recurring_totals && billingCycle && (
            <p className="text-sm text-secondary-foreground/70 mt-1">
              Then {formatCurrency(checkoutData.recurring_totals.total, currency)}/{formatBillingCycle(billingCycle)}
              {trialPeriod && ` after ${formatTrialPeriod(trialPeriod)}`}
            </p>
          )}
        </div>
      </div>

      <div className="hidden lg:flex">
        <OrderSummary checkoutData={checkoutData} expanded />
      </div>

      <div className="lg:hidden">
        <OrderSummary checkoutData={checkoutData} />
      </div>
    </div>
  );
};