import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6 transform transition-all animate-pop-in">
        <div className="flex items-center gap-3 mb-4 text-amber-500">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {message}
        </p>

        <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onClose}>
                Cancel
            </Button>
            <Button variant="primary" onClick={onConfirm} className="bg-red-600 hover:bg-red-500 shadow-red-600/20">
                Close without Saving
            </Button>
        </div>
      </div>
    </div>
  );
};