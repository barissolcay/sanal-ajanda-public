// Select Component - Premium Enhanced
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label?: string;
    options: SelectOption[];
    error?: string;
    onChange?: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({
    label,
    options,
    error,
    className,
    id,
    onChange,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange?.(e.target.value);
    };

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label
                    htmlFor={selectId}
                    className="text-sm font-medium text-slate-300 transition-colors duration-200"
                >
                    {label}
                </label>
            )}
            <div className="relative group">
                <select
                    id={selectId}
                    className={clsx(
                        'w-full px-4 py-2.5 pr-10 rounded-xl appearance-none cursor-pointer',
                        'bg-slate-800/80 border border-slate-700/60',
                        'text-slate-200',
                        'transition-all duration-300 ease-out',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400',
                        'focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]',
                        'hover:border-slate-600',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        error && 'border-red-500/60 focus:ring-red-500/50 focus:border-red-400',
                        className
                    )}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value} className="bg-slate-900">
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    className={clsx(
                        "absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none",
                        "transition-transform duration-200",
                        isFocused && "rotate-180 text-indigo-400"
                    )}
                />
            </div>
            {error && (
                <p className="text-sm text-red-400 animate-fadeIn">{error}</p>
            )}
        </div>
    );
};
