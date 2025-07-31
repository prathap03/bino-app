'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface CardProps {
  title: string;
  description?: string;
  image?: string;
  buttonLabel?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'glass' | 'minimal' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  animation?: 'hover' | 'float' | 'tilt' | 'none';
  delay?: number;
  gradient?: string;
  className?: string;
}

export default function Card({
  title,
  description,
  image,
  buttonLabel,
  onClick,
  href,
  variant = 'default',
  size = 'md',
  animation = 'hover',
  delay = 0,
  gradient,
  className = '',
}: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700',
    glass: 'bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border border-white/20 dark:border-gray-700/30',
    minimal: 'bg-transparent border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50',
    gradient: gradient || 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
  };

  const sizes = {
    sm: { padding: 'p-4', title: 'text-lg', desc: 'text-sm', button: 'px-3 py-1.5 text-sm', image: 'h-32' },
    md: { padding: 'p-6', title: 'text-xl', desc: 'text-base', button: 'px-4 py-2', image: 'h-40' },
    lg: { padding: 'p-8', title: 'text-2xl', desc: 'text-lg', button: 'px-6 py-3 text-lg', image: 'h-48' }
  };

  const animations = {
    hover: {
      whileHover: { scale: 1.05, y: -5 },
      transition: { type: "spring" as const, stiffness: 300 }
    },
    float: {
      animate: { y: [-5, 5, -5] },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const }
    },
    tilt: {
      whileHover: { rotateY: 5, rotateX: 5 },
      transition: { type: "spring" as const, stiffness: 300 }
    },
    none: {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      {...(animation !== 'none' ? animations[animation] : {})}
      className={`
        ${sizes[size].padding}
        ${variants[variant]}
        rounded-xl
        transition-all duration-300
        hover:shadow-xl
        cursor-pointer
        group
        ${className}
      `}
      onClick={onClick}
    >
      {image && (
        <motion.div 
          className={`w-full ${sizes[size].image} mb-4 overflow-hidden rounded-lg`}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={image}
            alt={title}
            width={400}
            height={200}
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}
      
      <motion.h3 
        className={`
          ${sizes[size].title} 
          font-semibold mb-2
          ${variant === 'gradient' ? 'text-white' : 'text-gray-900 dark:text-white'}
          group-hover:text-blue-600 dark:group-hover:text-blue-400
          transition-colors duration-300
        `}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.1 }}
      >
        {title}
      </motion.h3>
      
      {description && (
        <motion.p 
          className={`
            ${sizes[size].desc}
            ${variant === 'gradient' ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}
            mb-4 leading-relaxed
          `}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          {description}
        </motion.p>
      )}
      
      {buttonLabel && (
        <motion.button
          className={`
            ${sizes[size].button}
            bg-blue-500 hover:bg-blue-600 
            dark:bg-blue-600 dark:hover:bg-blue-700
            text-white rounded-lg
            transition-all duration-300
            hover:shadow-lg hover:scale-105
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-800
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.3 }}
        >
          {buttonLabel}
        </motion.button>
      )}
    </motion.div>
  );
}