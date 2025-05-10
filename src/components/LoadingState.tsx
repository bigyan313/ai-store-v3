import React from 'react';
import { motion } from 'framer-motion';

const LoadingState: React.FC = () => {
  // Vibrant color palette without opacity for crispness
  const particles = [
    { color: 'rgb(34, 211, 238)', size: 12 }, // Cyan
    { color: 'rgb(129, 140, 248)', size: 16 }, // Indigo
    { color: 'rgb(244, 114, 182)', size: 14 }, // Pink
    { color: 'rgb(52, 211, 153)', size: 18 }, // Green
    { color: 'rgb(251, 146, 60)', size: 10 }, // Orange
    { color: 'rgb(139, 92, 246)', size: 15 }, // Purple
    { color: 'rgb(236, 72, 153)', size: 13 }, // Hot Pink
    { color: 'rgb(45, 212, 191)', size: 17 }, // Teal
    { color: 'rgb(221, 156, 80)', size: 0 }, // Orange
    { color: 'rgb(149, 99, 346)', size: 5 }, // Purple
    { color: 'rgb(216, 73, 113)', size: 3 }, // Hot Pink
    { color: 'rgb(55, 216, 111)', size: 7 }, // Teal
  ];

  return (
    <div className="bg-white p-8 flex flex-col items-center justify-center text-center h-[calc(100vh-8rem)]">
      <div className="relative w-48 h-48 mb-8">
        {/* Crisp particles with sharp edges */}
        {particles.map((particle, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              left: '50%',
              top: '50%',
              x: '-50%',
              y: '-50%',
              clipPath: index % 2 === 0 
                ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' // Diamond
                : 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', // Hexagon
              boxShadow: `0 0 10px ${particle.color}`,
            }}
            animate={{
              x: [
                `${Math.sin(index) * 60}px`,
                `${Math.cos(index) * 40}px`,
                `${Math.sin(index + 2) * 50}px`
              ],
              y: [
                `${Math.cos(index) * 40}px`,
                `${Math.sin(index) * 60}px`,
                `${Math.cos(index + 2) * 50}px`
              ],
              scale: [1, 1.2, 0.9, 1.1, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4 + index,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.25, 0.5, 0.75, 1],
              delay: index * 0.01
            }}
          />
        ))}

        {/* Sharp central glow */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'conic-gradient(from 0deg, #22d3ee, #818cf8, #f472b6, #34d399, #fb923c, #8b5cf6, #ec4899, #2dd4bf, #22d3ee)',
            clipPath: 'circle(40% at center)',
            mixBlendMode: 'screen',
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
      
      <h3 className="text-xl font-light mb-3">
        <motion.span
          className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundSize: '200% auto',
          }}
        >
          Planning your travel wardrobe...
        </motion.span>
      </h3>
      
      <p className="text-gray-600 max-w-md font-light">
      Curating outfits using real-time weather data and trending styles for any occasion, effortlessly.
      </p>
    </div>
  );
};

export default LoadingState;