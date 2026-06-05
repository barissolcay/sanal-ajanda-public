// Button Component - Premium Enhanced
import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    className,
    children,
    disabled,
    loading,
    ...props
}) => {
    const isDisabled = disabled || loading;

    const baseStyles = clsx(
        'inline-flex items-center justify-center font-medium rounded-xl',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-[0.98]',
        'btn-ripple' // Ripple effect from globals.css
    );

    const variants = {
        primary: clsx(
            'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white',
            'hover:from-indigo-400 hover:to-cyan-400',
            'hover:shadow-lg hover:shadow-indigo-500/30',
            'focus:ring-indigo-500',
            'shadow-md'
        ),
        secondary: clsx(
            'bg-slate-800/80 text-slate-200 border border-slate-700/60',
            'hover:bg-slate-700/80 hover:border-slate-600',
            'hover:shadow-md hover:shadow-slate-900/50',
            'focus:ring-slate-500'
        ),
        ghost: clsx(
            'text-slate-300 hover:text-slate-100',
            'hover:bg-slate-800/60',
            'focus:ring-slate-500'
        ),
        danger: clsx(
            'bg-red-500/20 text-red-400 border border-red-500/40',
            'hover:bg-red-500/30 hover:border-red-400',
            'hover:shadow-md hover:shadow-red-500/20',
            'focus:ring-red-500'
        ),
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2',
    };

    return (
        <button
            className={clsx(baseStyles, variants[variant], sizes[size], className)}
            disabled={isDisabled}
            {...props}
        >
            {loading && (
                <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {children}
        </button>
    );
};
