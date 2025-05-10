import React, { useState } from 'react';
import { OutfitItem } from '../types';
import { ShoppingBag, ChevronDown, ChevronUp, CheckCircle2, RefreshCw } from 'lucide-react';
import ProductCard from './ProductCard';

interface OutfitCardProps {
  outfit: OutfitItem;
  onRefresh: (outfitId: string) => Promise<void>;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);

  const hasProducts = outfit.products && outfit.products.length > 0;

  // Parse the description into individual clothing items
  const clothingItems = outfit.description.split(/[.,]/).filter(item => item.trim());

  const handleRefresh = async () => {
    if (isRefreshing) return;

    // Show popup
    setShowPreviewPopup(true);
    setTimeout(() => setShowPreviewPopup(false), 2000);

    setIsRefreshing(true);
    try {
      await onRefresh(outfit.id);
    } catch (error) {
      console.error('Failed to refresh outfit:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-sm">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex justify-between items-center mb-2 relative">
          <h4 className="font-light text-lg text-black">{outfit.type}</h4>

          <div className="relative">
            <button
              className={`text-sm px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                isRefreshing
                  ? 'bg-white-100 text-white-600 cursor-not-allowed'
                  : 'bg-white-50 hover:bg-white-100 text-green-700 hover:text-green-800 active:bg-green-200'
              }`}
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh outfit suggestions"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''} text-green-600`}
              />
              <span>{isRefreshing ? 'Refreshing...' : ''}</span>
            </button>

            {showPreviewPopup && (
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-1 rounded shadow z-20 whitespace-nowrap">
                Coming soon
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {clothingItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="font-light text-sm">{item.trim()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-gray-600 hover:text-purple-600 transition-colors"
        >
          <span className="flex items-center font-light">
            <ShoppingBag className="h-4 w-4 mr-2" />
            <span>Shop This Look</span>
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expanded && (
          <div className="mt-4">
            {!hasProducts ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-600 font-light">No shopping suggestions available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {outfit.products?.map((product, index) => (
                  <ProductCard key={index} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitCard;
