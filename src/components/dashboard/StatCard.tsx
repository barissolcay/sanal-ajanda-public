// StatCard - Reusable dashboard stat card
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    iconColor: string;
    label: string;
    value: number;
    trend?: number; // percentage change
    onClick?: () => void;
    highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
    icon: Icon,
    iconColor,
    label,
    value,
    trend,
    onClick,
    highlight = false,
}) => {
    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={`
                relative group p-4 rounded-2xl border transition-all duration-300
                ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl' : 'cursor-default'}
                ${highlight
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                }
            `}
        >
            {/* Glow effect on hover */}
            <div className={`
                absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                bg-gradient-to-br ${highlight ? 'from-amber-500/5 to-orange-500/5' : 'from-indigo-500/5 to-cyan-500/5'}
            `} />

            <div className="relative flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                        {label}
                    </span>
                    <span className={`text-3xl font-bold ${highlight ? 'text-amber-400' : 'text-slate-100'}`}>
                        {value}
                    </span>

                    {trend !== undefined && trend !== 0 && (
                        <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{Math.abs(trend)}%</span>
                        </div>
                    )}
                </div>

                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${iconColor}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </button>
    );
};
