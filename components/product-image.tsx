import React from 'react';

interface ProductImageProps {
  imageUrl: string;
  name: string;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({ imageUrl, name, className }) => {
  return (
    <div className={`relative w-9 h-9 rounded-lg overflow-hidden shrink-0 ${className}`}>
      <img src={imageUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );
};
