import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-600',
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
    },
    error: {
      bg: 'bg-rose-600',
      icon: <AlertCircle className="w-5 h-5 text-white" />,
    },
    info: {
      bg: 'bg-sky-600',
      icon: <Info className="w-5 h-5 text-white" />,
    },
  };

  const config = typeConfig[toast.type];

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`${config.bg} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-md border border-white/10`}
      >
        {config.icon}
        <span className="text-sm font-medium leading-snug">{toast.message}</span>
        <button
          onClick={onClose}
          className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};
