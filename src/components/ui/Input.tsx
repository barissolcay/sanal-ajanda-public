// Input Component
import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className,
    id,
    ...props
}) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-slate-300"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={clsx(
                    'w-full px-4 py-2.5 rounded-xl',
                    'bg-slate-800/80 border border-slate-700/60',
                    'text-slate-200 placeholder-slate-500',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    error && 'border-red-500/60 focus:ring-red-500/50 focus:border-red-400',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="text-sm text-red-400">{error}</p>
            )}
        </div>
    );
};
