import React from 'react';

export const ProductDetailsSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 px-3 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-secondary" />
          <div className="h-6 bg-secondary rounded w-48" />
        </div>
        <div className="h-4 bg-secondary rounded w-20" />
      </div>

      <div>
        <div className="flex flex-col gap-1">
          <div className="h-7 bg-secondary rounded w-32" />
          <div className="h-5 bg-secondary rounded w-48" />
        </div>
      </div>

      <div className="hidden lg:flex flex-col gap-2 mt-8">
        <div className="h-px bg-border w-full mb-1" />
        <div className="flex justify-between">
          <div className="h-4 bg-secondary rounded w-20" />
          <div className="h-4 bg-secondary rounded w-16" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-secondary rounded w-16" />
          <div className="h-4 bg-secondary rounded w-12" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-secondary rounded w-12" />
          <div className="h-4 bg-secondary rounded w-10" />
        </div>
        <div className="h-px bg-border w-full my-1" />
        <div className="flex justify-between">
          <div className="h-4 bg-secondary rounded w-24" />
          <div className="h-4 bg-secondary rounded w-20" />
        </div>
      </div>

      <div className="lg:hidden">
        <div className="w-full mx-auto bg-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-secondary rounded w-40" />
            <div className="h-4 bg-secondary rounded w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
