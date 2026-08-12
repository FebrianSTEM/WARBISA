import React, { useEffect, useState } from 'react';
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
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!toast || isPaused) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, isPaused, onClose]);

  if (!toast) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-600',
      icon: <CheckCircle2 className="w-5 h-5 text-white shrink-0" />,
    },
    error: {
      bg: 'bg-rose-600',
      icon: <AlertCircle className="w-5 h-5 text-white shrink-0" />,
    },
    info: {
      bg: 'bg-slate-900',
      icon: <Info className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
  };

  const config = typeConfig[toast.type];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed bottom-5 right-5 z-50 animate-fade-in"
    >
      <div
        className={`${config.bg} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 max-w-md border border-white/10`}
      >
        {config.icon}
        <span className="text-xs font-semibold leading-snug">{toast.message}</span>
        <button
          onClick={onClose}
          className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

