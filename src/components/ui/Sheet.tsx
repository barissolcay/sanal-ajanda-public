// Sheet Component - Slide-out panel (Premium Enhanced)
import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

export interface SheetProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    side?: 'left' | 'right';
    className?: string;
}

export const Sheet: React.FC<SheetProps> = ({
    open,
    onClose,
    title,
    children,
    side = 'right',
    className,
}) => {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-overlay"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className={clsx(
                    'fixed top-0 bottom-0 z-50 w-full max-w-md',
                    'bg-slate-900/95 backdrop-blur-2xl border-slate-800/60 shadow-2xl',
                    'flex flex-col',
                    'transition-transform duration-300 ease-out',
                    side === 'right' ? 'right-0 border-l animate-slideInRight' : 'left-0 border-r animate-slideInLeft',
                    className
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
                    {title && (
                        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
                    )}
                    <button
                        onClick={onClose}
                        className={clsx(
                            "p-2 rounded-lg transition-all duration-200",
                            "text-slate-400 hover:text-slate-200",
                            "hover:bg-slate-800/60 hover:shadow-glow-sm",
                            "active:scale-95"
                        )}
                        aria-label="Kapat"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 animate-fadeIn">
                    {children}
                </div>
            </div>
        </>
    );
};
