'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ImageBlockProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  animation?: 'fadeIn' | 'slideUp' | 'zoom' | 'parallax' | 'none';
  delay?: number;
  overlay?: { color: string; opacity: number };
  caption?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  aspect?: 'square' | 'video' | 'wide' | 'auto';
}


export default function ImageBlock({
    src,
    alt,
    width = 600,
    height = 400,
    className = '',
    animation = 'fadeIn',
    delay = 0,
    overlay,
    caption,
    rounded = 'xl',
    aspect = 'auto',
  }: ImageBlockProps) {
    const roundedClasses = {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      full: 'rounded-full'
    };
  
    const aspectClasses = {
      square: 'aspect-square',
      video: 'aspect-video',
      wide: 'aspect-[21/9]',
      auto: ''
    };
  
    const animations = {
      fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 1, delay }
      },
      slideUp: {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, delay }
      },
      zoom: {
        initial: { opacity: 0, scale: 1.2 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 1, delay }
      },
      parallax: {
        initial: { opacity: 0, y: 100 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 1.2, delay, ease: "easeOut" as const }
      },
      none: {}
    };
  
    const Component = animation !== 'none' ? motion.div : 'div';
    const animationProps = animation !== 'none' ? animations[animation] : {};
  
    return (
      <Component
        {...animationProps}
        className={`
          overflow-hidden 
          ${roundedClasses[rounded]}
          ${aspectClasses[aspect]}
          group
          relative
          ${className}
        `}
      >
        <motion.div
          className="relative w-full h-full"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`
              object-cover w-full 
              ${aspect === 'auto' ? 'h-auto' : 'h-full'}
              transition-transform duration-700
              group-hover:scale-110
            `}
          />
          
          {overlay && (
            <div 
              className={`
                absolute inset-0 
                ${overlay.color}
                transition-opacity duration-300
                group-hover:opacity-0
              `}
              style={{ opacity: overlay.opacity }}
            />
          )}
        </motion.div>
        
        {caption && (
          <motion.div 
            className="
              absolute bottom-0 left-0 right-0
              bg-black/60 text-white p-4
              transform translate-y-full
              group-hover:translate-y-0
              transition-transform duration-300
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
          >
            <p className="text-sm">{caption}</p>
          </motion.div>
        )}
      </Component>
    );
  }