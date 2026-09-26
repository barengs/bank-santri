import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl',
        full: 'max-w-[95%]'
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-md shadow-xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden`}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-800">{title}</h3>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 overflow-y-auto custom-scrollbar flex-1 text-xs text-gray-700">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
