import React, { useState, useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmptyStateProps {
  onChatOpen: () => void;
  hasInteracted: boolean;
}

const rawSuggestions = [
  "Rave party",
  "Baby shower outfit",
  "Eminem Not Afraid outfit",
  "One Piece anime outfit",
  "I'm heading to Paris next week",
  "Planning a Miami beach in July",
  "Titanic movie outfits",
  "Tokyo in winter",
];

const brandLogos = [
  { name: "ARMANI EXCHANGE", color: "#000000" },
  { name: "AMERICAN EAGLE", color: "#02205C" },
  { name: "H&M", color: "#FF0000" },
  { name: "TARGET", color: "#CC0000" },
  { name: "FOREVER 21", color: "#FFF100" },
  { name: "SHEIN", color: "#000000" },
  { name: "UNIQLO", color: "#FF0000" },
  { name: "ZARA", color: "#000000" },
  { name: "NORDSTROM", color: "#000000" },
  { name: "ASOS", color: "#000000" },
  { name: "FASHION NOVA", color: "#FF1493" },
  { name: "COACH", color: "#000000" },
];

const EmptyState: React.FC<EmptyStateProps> = ({ onChatOpen, hasInteracted }) => {
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const suggestions = useMemo(
    () => [...rawSuggestions].sort((a, b) => a.length - b.length),
    []
  );

  const handleChatClick = () => {
    setSuggestionsVisible(false);
    onChatOpen();
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20 relative overflow-hidden">
      {/* Brand Logos Background Grid */}
      <div className="absolute inset-0">
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 p-4">
          {Array.from({ length: 80 }).map((_, index) => {
            const logo = brandLogos[index % brandLogos.length];
            return (
              <div
                key={index}
                className="aspect-square flex items-center justify-center group"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0 }}
                  whileHover={{ opacity: 0.35, scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex items-center justify-center cursor-default"
                >
                  <span
                    className="text-xl md:text-2xl font-bold whitespace-nowrap"
                    style={{ color: logo.color }}
                  >
                    {logo.name}
                  </span>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl w-full text-center space-y-10 z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 leading-tight tracking-tight">
            ADHIKARI AI
          </h1>
          <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
            Fashion powered by AI — inspired by travel, music, anime, and moments that define you.
          </p>
        </motion.div>

        {/* Suggestions Section */}
        <AnimatePresence>
          {suggestionsVisible && (
            <>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-gray-500 text-sm font-light tracking-wide uppercase"
              >
                Try something like
              </motion.p>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto px-4"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.1 }
                  }
                }}
              >
                {suggestions.map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <p className="text-gray-600 text-sm font-light">{text}</p>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Start Button */}
        {!hasInteracted && (
          <motion.button
            onClick={handleChatClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-full hover:bg-gray-900 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            Start Styling with AI
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;