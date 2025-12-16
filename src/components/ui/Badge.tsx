// Badge Component
import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'amber' | 'custom';
    size?: 'sm' | 'md';
    className?: string;
    style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'sm',
    className,
    style,
}) => {
    const variants = {
        default: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        warning: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        danger: 'bg-red-500/20 text-red-300 border-red-500/40',
        info: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        purple: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        custom: '',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
    };

    return (
        <span
            className={clsx(
                'inline-flex items-center font-medium rounded-full border',
                variants[variant],
                sizes[size],
                className
            )}
            style={style}
        >
            {children}
        </span>
    );
};
