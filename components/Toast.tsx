import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const bgColors = {
    success: 'bg-[#0c0c0c] border-green-500/50',
    error: 'bg-[#0c0c0c] border-red-500/50',
    info: 'bg-[#0c0c0c] border-white/20'
  };

  const icons = {
    success: <CheckCircle className="text-green-500" size={18} />,
    error: <AlertCircle className="text-red-500" size={18} />,
    info: <CheckCircle className="text-white/40" size={18} />
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[400] animate-in slide-in-from-bottom-4 duration-300">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border ${bgColors[type]} shadow-2xl backdrop-blur-md min-w-[300px]`}>
        {icons[type]}
        <p className="text-xs font-bold tracking-widest text-white uppercase flex-1">
          {message}
        </p>
        <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
