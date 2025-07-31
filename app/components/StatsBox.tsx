'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface StatsBoxProps {
  label: string;
  value: string;
  icon?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  gradient?: string;
  animation?: 'fadeInUp' | 'slideInLeft' | 'scale' | 'bounce' | 'none';
  delay?: number;
  className?: string;
}

export default function StatsBox({
  label,
  value,
  icon,
  color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  size = 'md',
  gradient,
  animation = 'fadeInUp',
  delay = 0,
  className = '',
}: StatsBoxProps) {
  const sizes = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg',
    xl: 'p-8 text-xl'
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  const animations = {
    fadeInUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, delay }
    },
    slideInLeft: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.6, delay }
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.6, delay, type: "spring" as const }
    },
    bounce: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.8, delay, type: "spring" as const, bounce: 0.4 }
    },
    none: {}
  };

  const Component = animation !== 'none' ? motion.div : 'div';
  const animationProps = animation !== 'none' ? animations[animation] : {};

  return (
    <Component
      {...animationProps}
      className={`
        ${sizes[size]} 
        rounded-xl 
        ${gradient || color} 
        flex items-center space-x-3 sm:space-x-4
        backdrop-blur-sm
        hover:shadow-lg hover:scale-105
        transition-all duration-300
        border border-white/10 dark:border-gray-700/50
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon && (
        <motion.span 
          className={`${iconSizes[size]} opacity-80`}
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ delay: delay + 0.2 }}
        >
          {icon}
        </motion.span>
      )}
      <div className="flex-1 min-w-0">
        <motion.div 
          className="font-bold text-lg sm:text-xl lg:text-2xl truncate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
        >
          {value}
        </motion.div>
        <motion.div 
          className="text-xs sm:text-sm opacity-75 truncate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.4 }}
        >
          {label}
        </motion.div>
      </div>
    </Component>
  );
}