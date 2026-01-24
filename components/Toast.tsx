import React, { useEffect } from 'react';
import { IconCheckCircle, IconAlertTriangle, IconX } from './Icons';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-md shadow-lg border min-w-[300px] animate-in slide-in-from-right-full duration-300 ${
            toast.type === 'success' ? 'bg-white border-green-100 text-slate-800' :
            toast.type === 'error' ? 'bg-white border-red-100 text-slate-800' :
            toast.type === 'info' ? 'bg-white border-blue-100 text-slate-800' :
            'bg-white border-yellow-100 text-slate-800'
          }`}
        >
          <div className={`${
            toast.type === 'success' ? 'text-green-500' :
            toast.type === 'error' ? 'text-red-500' :
            toast.type === 'info' ? 'text-blue-500' :
            'text-yellow-500'
          }`}>
            {toast.type === 'success' ? <IconCheckCircle className="w-5 h-5" /> :
             toast.type === 'error' ? <IconX className="w-5 h-5" /> :
             toast.type === 'info' ? <IconCheckCircle className="w-5 h-5" /> :
             <IconAlertTriangle className="w-5 h-5" />}
          </div>
          <div className="flex-1 text-sm font-medium">{toast.message}</div>
          <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
            <IconX className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};