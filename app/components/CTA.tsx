'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface CTAProps {
  heading: string;
  subheading?: string;
  ctaText: string;
  href: string;
  bg?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animation?: 'fadeInUp' | 'slideIn' | 'zoom' | 'pulse' | 'none';
  delay?: number;
  pattern?: boolean;
  className?: string;
}

export default function CTA({
  heading,
  subheading,
  ctaText,
  href,
  bg = 'bg-gradient-to-r from-blue-500 to-purple-500',
  size = 'md',
  animation = 'fadeInUp',
  delay = 0,
  pattern,
  className = '',
}: CTAProps) {
  const sizes = {
    sm: { padding: 'p-4 sm:p-6', heading: 'text-xl sm:text-2xl', sub: 'text-base', button: 'px-4 py-2 text-sm' },
    md: { padding: 'p-6 sm:p-8', heading: 'text-2xl sm:text-3xl', sub: 'text-lg', button: 'px-6 py-3' },
    lg: { padding: 'p-8 sm:p-12', heading: 'text-3xl sm:text-4xl', sub: 'text-xl', button: 'px-8 py-4 text-lg' },
    xl: { padding: 'p-12 sm:p-16', heading: 'text-4xl sm:text-5xl', sub: 'text-2xl', button: 'px-10 py-5 text-xl' }
  };

  const animations = {
    fadeInUp: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.8, delay }
    },
    slideIn: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.8, delay }
    },
    zoom: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.8, delay, type: "spring" as const }
    },
    pulse: {
      animate: { scale: [1, 1.02, 1] },
      transition: { duration: 2, repeat: Infinity }
    },
    none: {}
  };

  const Component = animation !== 'none' ? motion.div : 'div';
  const animationProps = animation !== 'none' ? animations[animation] : {};

  return (
    <Component
      {...animationProps}
      className={`
        text-white 
        ${sizes[size].padding}
        rounded-xl 
        ${bg}
        text-center 
        relative 
        overflow-hidden
        ${className}
      `}
    >
      {pattern && (
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-y-12"></div>
        </div>
      )}
      
      <div className="relative z-10">
        <motion.h2 
          className={`${sizes[size].heading} font-bold mb-2 sm:mb-4`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay + 0.1 }}
        >
          {heading}
        </motion.h2>
        
        {subheading && (
          <motion.p 
            className={`${sizes[size].sub} mb-4 sm:mb-6 opacity-90`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: delay + 0.2 }}
          >
            {subheading}
          </motion.p>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay + 0.3 }}
        >
          <Link
            href={href}
            className={`
              inline-block 
              bg-white/90 hover:bg-white
              text-gray-900
              ${sizes[size].button}
              rounded-lg
              transition-all duration-300
              hover:shadow-xl hover:scale-105
              focus:ring-2 focus:ring-white/50
              font-semibold
            `}
          >
            {ctaText}
          </Link>
        </motion.div>
      </div>
    </Component>
  );
}