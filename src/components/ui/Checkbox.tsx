// Checkbox Component - Premium Enhanced
import React from 'react';
import { clsx } from 'clsx';
import { Check, Minus, Circle } from 'lucide-react';

export interface CheckboxProps {
    checked?: boolean;
    indeterminate?: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    variant?: 'default' | 'task';
    className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    checked = false,
    indeterminate = false,
    onChange,
    label,
    disabled = false,
    variant = 'default',
    className,
}) => {
    const handleClick = () => {
        if (!disabled) {
            onChange?.(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    if (variant === 'task') {
        return (
            <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={clsx(
                    'flex items-center justify-center w-6 h-6 rounded-full',
                    'transition-all duration-300 ease-out',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-slate-900',
                    checked
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-100'
                        : 'border-2 border-slate-600 hover:border-indigo-400 hover:shadow-glow-sm text-transparent hover:text-slate-600 scale-100 hover:scale-105',
                    disabled && 'opacity-50 cursor-not-allowed',
                    className
                )}
            >
                {checked ? (
                    <Check className="w-4 h-4 animate-bounceIn" />
                ) : (
                    <Circle className="w-3 h-3 transition-opacity duration-200" />
                )}
            </button>
        );
    }

    return (
        <label
            className={clsx(
                'flex items-center gap-2 cursor-pointer group',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            <button
                type="button"
                role="checkbox"
                aria-checked={indeterminate ? 'mixed' : checked}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={clsx(
                    'flex items-center justify-center w-5 h-5 rounded-md',
                    'transition-all duration-200 ease-out',
                    'border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-slate-900',
                    checked || indeterminate
                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/30'
                        : 'border-slate-600 hover:border-indigo-400 bg-transparent group-hover:shadow-glow-sm'
                )}
            >
                {checked && <Check className="w-3.5 h-3.5 animate-scaleIn" />}
                {indeterminate && !checked && <Minus className="w-3.5 h-3.5 animate-scaleIn" />}
            </button>
            {label && (
                <span className="text-sm text-slate-300 transition-colors duration-200 group-hover:text-slate-200">
                    {label}
                </span>
            )}
        </label>
    );
};
