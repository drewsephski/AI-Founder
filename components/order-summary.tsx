import React from 'react';
import { ProductImage } from './product-image';
import { Separator } from './ui/separator';
import { Accordion, AccordionItemWithContext, AccordionTrigger, AccordionContent } from './ui/accordion';
import { formatCurrency } from '../lib/format';
// Import CheckoutEventsData directly from paddle-js
import type { CheckoutEventsData } from '@paddle/paddle-js/types/checkout/events';


interface OrderSummaryProps {
  checkoutData: CheckoutEventsData; // Changed type to CheckoutEventsData
  expanded?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ checkoutData, expanded }) => {
  const currencyCode = checkoutData.currency_code;
  const hasImage = checkoutData.items.some((item) => item.product.image_url);

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full mx-auto bg-card rounded-lg lg:bg-background"
      defaultValue={expanded ? "order-summary" : undefined}
    >
      <AccordionItemWithContext value="order-summary">
        <AccordionTrigger className="text-md hover:no-underline cursor-pointer px-4">
          <h3 className="text-md">Show order summary</h3>
        </AccordionTrigger>

        <AccordionContent className="px-4">
          <div className="mt-4">
            <div className="space-y-3">
              {checkoutData.items.map((item) => (
                <div key={item.price_id} className="flex items-center gap-3 text-sm">
                  {hasImage && (
                    <>
                      {item.product.image_url ? (
                        <ProductImage imageUrl={item.product.image_url || ""} name={item.product.name} className="w-9 h-9" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground text-xl">
                          {item.product.name.charAt(0)}
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex-1 min-w-0 w-0">
                    <p className="font-medium truncate notranslate">{item.product.name}</p>

                    <div className="flex items-center justify-between">
                      <p className="text-secondary-foreground/70 notranslate">
                        {formatCurrency(item.totals.total, currencyCode, undefined)}
                      </p>
                      <span className="text-secondary-foreground/70 notranslate">x{item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 mt-8">
              <Separator className="w-full mb-1" />
              <div className="flex justify-between">
                <p className="text-secondary-foreground/70">Subtotal</p>
                <p className="notranslate">{formatCurrency(checkoutData.totals.subtotal, currencyCode, undefined)}</p>
              </div>

              {checkoutData.totals.discount > 0 && (
                <div className="flex justify-between">
                  <p className="text-secondary-foreground/70">Discount</p>
                  <p className="notranslate">
                    - {formatCurrency(checkoutData.totals.discount, currencyCode, undefined)}
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <p className="text-secondary-foreground/70">Tax</p>
                <p className="notranslate">{formatCurrency(checkoutData.totals.tax, currencyCode, undefined)}</p>
              </div>
              <Separator className="w-full my-1" />
              <div className="flex justify-between">
                <p className="text-secondary-foreground/70">Total</p>
                <p className="notranslate">{formatCurrency(checkoutData.totals.total, currencyCode, undefined)}</p>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItemWithContext>
    </Accordion>
  );
};