
import React, { useEffect, useRef } from 'react';
import { IconX } from './Icons';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const WIDTH_CLASSES = {
  'md': 'max-w-md',
  'lg': 'max-w-lg',
  'xl': 'max-w-xl',
  '2xl': 'max-w-2xl',
  'full': 'max-w-full'
};

export const SlideOver: React.FC<SlideOverProps> = ({ isOpen, onClose, title, subtitle, children, width = 'lg' }) => {
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
    <div 
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      
      <div className={`absolute inset-y-0 right-0 flex pl-10 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className={`w-screen ${WIDTH_CLASSES[width]} bg-white shadow-2xl flex flex-col h-full border-l border-slate-200`}>
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/50 sticky top-0 z-10">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 leading-6">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <button 
              onClick={onClose}
              className="rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-1 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <span className="sr-only">Close panel</span>
              <IconX className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
