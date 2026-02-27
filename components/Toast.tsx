import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconCheckCircle, IconAlertTriangle, IconX, IconAlertOctagon } from './Icons';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; removeToast: (id: string) => void }> = ({
  toast,
  removeToast,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <motion.div
      layout
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 8, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`relative flex items-start gap-3 p-3 shadow-[-2px_0_16px_rgba(0,0,0,0.06)] border-l-2 min-w-[300px] w-72 bg-white overflow-hidden ${
        toast.type === 'success'
          ? 'border-green-500'
          : toast.type === 'error'
            ? 'border-red-500'
            : toast.type === 'info'
              ? 'border-blue-500'
              : 'border-orange-500'
      }`}
    >
      <div
        className={`${
          toast.type === 'success'
            ? 'text-green-500'
            : toast.type === 'error'
              ? 'text-red-500'
              : toast.type === 'info'
                ? 'text-blue-500'
                : 'text-orange-500'
        } mt-0.5 shrink-0`}
      >
        {toast.type === 'success' ? (
          <IconCheckCircle className="w-4 h-4" />
        ) : toast.type === 'error' ? (
          <IconAlertOctagon className="w-4 h-4" />
        ) : toast.type === 'info' ? (
          <IconCheckCircle className="w-4 h-4" />
        ) : (
          <IconAlertTriangle className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0 pb-1 flex flex-col justify-center">
        <div className="text-sm font-semibold text-gray-900 mt-0.5">{toast.message}</div>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0 rounded hover:bg-gray-50"
      >
        <IconX className="w-4 h-4" />
      </button>

      {/* Progress Bar for Auto Dismiss */}
      <div className="absolute bottom-0 left-0 h-[3px] bg-gray-100 w-full">
        <div
          className="h-full bg-gray-300"
          style={{
            animation: 'shrinkProgressBar 4s linear forwards',
          }}
        />
      </div>
      <style>{`
        @keyframes shrinkProgressBar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </motion.div>
  );
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
