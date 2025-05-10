import React from 'react';
import { Product } from '../types';
import { ExternalLink, Tag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <a 
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all duration-200"
    >
      <div className="aspect-square bg-gray-50 overflow-hidden relative">
        <img 
          src={product.image} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.store)}`;
          }}
        />
        <div className="absolute bottom-2 right-2">
          <span className="text-[10px] px-2 py-1 bg-black/70 text-white rounded-full font-light">
            {product.store}
          </span>
        </div>
      </div>
      
      <div className="p-3 flex flex-col flex-1">
        <h5 className="text-sm font-light text-black mb-2 line-clamp-2 flex-1">
          {product.title}
        </h5>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <Tag className="h-3 w-3 text-gray-400" />
            <span className="text-xs font-light text-black">{product.price}</span>
          </div>
          <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-purple-600 transition-colors" />
        </div>
      </div>
    </a>
  );
};

export default ProductCard;