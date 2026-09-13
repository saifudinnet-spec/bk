import React from 'react';
import { motion } from 'framer-motion';

/**
 * ScrollReveal Component
 * Replicates smooth AOS (Animate On Scroll) fade-up and slide effects
 * using framer-motion, matching the modern institutional aesthetics of UINSSC.
 */
export const ScrollReveal = ({
  children,
  direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'none'
  delay = 0,
  duration = 1.1, // Slower, more pronounced cinematic animation
  distance = 48,  // Clearer travel distance from bottom/side
  className = '',
  threshold = 0.12,
  once = true,
  ...props
}) => {
  const getOffset = () => {
    switch (direction) {
      case 'up':
        return { x: 0, y: distance };
      case 'down':
        return { x: 0, y: -distance };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const offset = getOffset();

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{
        once,
        amount: threshold,
      }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Elegant smooth deceleration
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
