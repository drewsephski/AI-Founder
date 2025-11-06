import React, { useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { ChevronDownIcon } from '../icons/Icons'; // Assuming a chevron icon

interface AccordionContextType {
  expandedItem: string | null;
  setExpandedItem: (item: string | null) => void;
  type: 'single' | 'multiple';
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

interface AccordionProps {
  type: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string;
  className?: string;
  children: ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ type, collapsible = false, defaultValue, className, children }) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(defaultValue || null);

  const handleSetExpandedItem = useCallback((item: string | null) => {
    if (type === 'single') {
      setExpandedItem(current => (current === item && collapsible) ? null : item);
    } else {
      // For multiple type, this would need to manage an array of expanded items
      // This example only supports 'single' type for simplicity based on provided usage
      console.warn("Accordion type 'multiple' not fully implemented in this example.");
      setExpandedItem(current => (current === item && collapsible) ? null : item);
    }
  }, [type, collapsible]);

  return (
    <AccordionContext.Provider value={{ expandedItem, setExpandedItem: handleSetExpandedItem, type, collapsible }}>
      <div className={className}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  value: string;
  className?: string;
  children: ReactNode;
}

const AccordionItemContext = createContext<{ value: string } | undefined>(undefined);

export const AccordionItemWithContext: React.FC<AccordionItemProps> = ({ value, children, className }) => (
  <AccordionItemContext.Provider value={{ value }}>
    <div className={`border-b border-border last:border-b-0 ${className}`}>
      {children}
    </div>
  </AccordionItemContext.Provider>
);

interface AccordionTriggerProps {
  className?: string;
  children: ReactNode;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({ className, children }) => {
  const context = useContext(AccordionContext);
  const itemContext = useContext(AccordionItemContext);
  if (!context || !itemContext) {
    throw new Error('AccordionTrigger must be used within an AccordionItem');
  }
  const { expandedItem, setExpandedItem } = context;
  const itemValue = itemContext.value;

  const isExpanded = expandedItem === itemValue;

  const handleClick = () => {
    setExpandedItem(itemValue);
  };

  return (
    <button
      className={`flex flex-1 items-center justify-between py-4 font-medium transition-all [&[data-state=open]>svg]:rotate-180 ${className}`}
      onClick={handleClick}
      aria-expanded={isExpanded}
    >
      {children}
      <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
    </button>
  );
};

interface AccordionContentProps {
  className?: string;
  children: ReactNode;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({ className, children }) => {
  const context = useContext(AccordionContext);
  const itemContext = useContext(AccordionItemContext);
  if (!context || !itemContext) {
    throw new Error('AccordionContent must be used within an AccordionItem');
  }
  const itemValue = itemContext.value;

  const isExpanded = context.expandedItem === itemValue;

  return (
    <div
      className={`overflow-hidden text-sm transition-all ${isExpanded ? 'h-auto max-h-[1000px]' : 'h-0'}`} // max-h for transition
      style={{
        transitionProperty: 'max-height',
        transitionDuration: isExpanded ? '300ms' : '150ms',
        transitionTimingFunction: 'ease-in-out',
      }}
    >
      <div className={`pb-4 pt-0 ${className}`}>
        {children}
      </div>
    </div>
  );
};
