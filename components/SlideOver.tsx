import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX } from './Icons';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const WIDTH_CLASSES = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = '2xl',
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            ref={overlayRef}
            className="absolute inset-0 bg-black/20"
            onClick={handleBackdropClick}
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute inset-y-0 right-0 flex max-w-full`}
          >
            <div
              className={`w-screen ${WIDTH_CLASSES[width]} bg-white  flex flex-col h-full border-l border-gray-100`}
            >
              <header className="h-14 px-5 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 leading-tight tracking-tight">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-[11px] text-gray-500 font-medium leading-none mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 transition-colors rounded hover:bg-gray-50 -mr-1"
                >
                  <span className="sr-only">Close panel</span>
                  <IconX className="h-4 w-4" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-4 bg-white scrollbar-hide">
                {children}
              </div>

              {footer && (
                <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0 bg-white">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
