// KPIGrid - Compact 2x2 stat grid
import React from 'react';
import { Calendar, CalendarDays, CalendarRange, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KPIItemProps {
    icon: LucideIcon;
    iconColor: string;
    value: number;
    label: string;
    detail?: string;
    onClick?: () => void;
    highlight?: boolean;
}

const KPIItem: React.FC<KPIItemProps> = ({
    icon: Icon,
    iconColor,
    value,
    label,
    detail,
    onClick,
    highlight,
}) => (
    <button
        onClick={onClick}
        className={`
            p-4 rounded-[10px] border transition-all text-left
            ${onClick ? 'cursor-pointer hover:border-slate-500/50' : 'cursor-default'}
            ${highlight && value > 0
                ? 'bg-red-900/20 border-red-500/30'
                : 'bg-slate-800/50 border-slate-600/30'
            }
        `}
    >
        <div className="flex items-start justify-between mb-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            {highlight && value > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-400" />
            )}
        </div>
        <p className={`text-2xl font-bold ${highlight && value > 0 ? 'text-red-400' : 'text-slate-100'}`}>
            {value}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
        {detail && (
            <p className="text-[11px] text-slate-500 mt-1">{detail}</p>
        )}
    </button>
);

interface KPIGridProps {
    today: number;
    todayDetail?: string;
    week: number;
    weekDetail?: string;
    month: number;
    monthDetail?: string;
    overdue: number;
    onTodayClick?: () => void;
    onWeekClick?: () => void;
    onMonthClick?: () => void;
    onOverdueClick?: () => void;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
    today,
    todayDetail,
    week,
    weekDetail,
    month,
    monthDetail,
    overdue,
    onTodayClick,
    onWeekClick,
    onMonthClick,
    onOverdueClick,
}) => {
    return (
        <div className="grid grid-cols-2 gap-3">
            <KPIItem
                icon={Calendar}
                iconColor="text-cyan-400"
                value={today}
                label="Bugün"
                detail={todayDetail}
                onClick={onTodayClick}
            />
            <KPIItem
                icon={CalendarDays}
                iconColor="text-indigo-400"
                value={week}
                label="Bu Hafta"
                detail={weekDetail}
                onClick={onWeekClick}
            />
            <KPIItem
                icon={CalendarRange}
                iconColor="text-purple-400"
                value={month}
                label="Bu Ay"
                detail={monthDetail}
                onClick={onMonthClick}
            />
            <KPIItem
                icon={AlertCircle}
                iconColor="text-red-400"
                value={overdue}
                label="Gecikmiş"
                onClick={onOverdueClick}
                highlight
            />
        </div>
    );
};
