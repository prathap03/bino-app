'use client';
import { motion } from 'framer-motion';

interface TextSectionProps {
  title: string;
  subtitle?: string;
  text?: string;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  gradient?: string;
  animation?: 'fadeInUp' | 'slideInLeft' | 'slideInRight' | 'typewriter' | 'none';
  delay?: number;
  className?: string;
  maxWidth?: string;
}

export default function TextSection({
  title,
  subtitle,
  text,
  align = 'center',
  size = 'md',
  gradient,
  animation = 'fadeInUp',
  delay = 0,
  className = '',
  maxWidth = 'max-w-4xl',
}: TextSectionProps) {
  const alignment = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const sizes = {
    sm: { title: 'text-xl sm:text-2xl', subtitle: 'text-lg', text: 'text-sm', spacing: 'space-y-2' },
    md: { title: 'text-2xl sm:text-3xl lg:text-4xl', subtitle: 'text-xl', text: 'text-base', spacing: 'space-y-4' },
    lg: { title: 'text-3xl sm:text-4xl lg:text-5xl', subtitle: 'text-2xl', text: 'text-lg', spacing: 'space-y-6' },
    xl: { title: 'text-4xl sm:text-5xl lg:text-6xl', subtitle: 'text-3xl', text: 'text-xl', spacing: 'space-y-8' }
  };

  const animations = {
    fadeInUp: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.8, delay }
    },
    slideInLeft: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.8, delay }
    },
    slideInRight: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.8, delay }
    },
    typewriter: {
      initial: { width: 0 },
      animate: { width: "auto" },
      transition: { duration: 2, delay }
    },
    none: {}
  };

  const Component = animation !== 'none' ? motion.div : 'div';
  const animationProps = animation !== 'none' ? animations[animation] : {};

  return (
    <Component
      {...animationProps}
      className={`
        p-4 sm:p-6 lg:p-8 
        ${alignment[align]} 
        ${maxWidth} 
        mx-auto
        ${sizes[size].spacing}
        ${className}
      `}
    >
      <motion.h2 
        className={`
          ${sizes[size].title} 
          font-bold 
          ${gradient ? `bg-gradient-to-r ${gradient} bg-clip-text text-transparent` : 'text-gray-900 dark:text-white'}
          leading-tight
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: delay + 0.1 }}
      >
        {title}
      </motion.h2>
      
      {subtitle && (
        <motion.h3 
          className={`
            ${sizes[size].subtitle} 
            text-gray-600 dark:text-gray-300
            font-medium
          `}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay + 0.2 }}
        >
          {subtitle}
        </motion.h3>
      )}
      
      {text && (
        <motion.p 
          className={`
            ${sizes[size].text} 
            text-gray-700 dark:text-gray-300
            leading-relaxed
          `}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay + 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </Component>
  );
}