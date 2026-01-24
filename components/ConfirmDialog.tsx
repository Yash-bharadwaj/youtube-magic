import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Delete",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-[340px] bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-lg font-bold tracking-tight uppercase">{title}</h3>
          </div>
          
          <p className="text-sm text-white/40 leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full py-3.5 rounded-xl bg-red-600 text-white font-bold text-xs tracking-widest uppercase transition-all active:scale-[0.98] hover:bg-red-500"
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3.5 rounded-xl bg-white/5 text-white/40 font-bold text-xs tracking-widest uppercase transition-all active:scale-[0.98] hover:bg-white/10 hover:text-white"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
