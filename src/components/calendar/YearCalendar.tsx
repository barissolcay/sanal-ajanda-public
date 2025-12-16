// YearCalendar Component - 12 mini month calendars
import React from 'react';
import { clsx } from 'clsx';
import {
    startOfYear,
    addMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDay,
    format,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Task } from '../../domain/types';
import { useCategories } from '../../hooks/useCategories';
import { isTaskOnDate, isSameMonth, isToday } from '../../domain/dateUtils';

export interface YearCalendarProps {
    date: Date;
    tasks: Task[];
    weekStartsOn: 0 | 1;
    selectedMonth?: Date | null;
    onMonthClick?: (date: Date) => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i);

export const YearCalendar: React.FC<YearCalendarProps> = ({
    date,
    tasks,
    weekStartsOn,
    selectedMonth,
    onMonthClick,
}) => {
    const { getCategoryColor } = useCategories();
    const yearStart = startOfYear(date);

    const getDayStyle = (day: Date): React.CSSProperties | undefined => {
        const dayTasks = tasks.filter(task => isTaskOnDate(task, day));
        if (dayTasks.length === 0) return undefined;

        // Use the first task's category color
        const firstTask = dayTasks[0];
        const color = firstTask.color || getCategoryColor(firstTask.category);

        return {
            backgroundColor: `${color}60`,
            color: '#fff',
        };
    };

    return (
        <div className="flex flex-col h-full">
            {/* Year header */}
            <div className="px-4 py-3 border-b border-slate-800/60">
                <h2 className="text-lg font-semibold text-slate-100">
                    {format(date, 'yyyy')}
                </h2>
            </div>

            {/* Mini calendars grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
                    {MONTHS.map((monthIndex) => {
                        const monthDate = addMonths(yearStart, monthIndex);
                        const monthStart = startOfMonth(monthDate);
                        const monthEnd = endOfMonth(monthDate);
                        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

                        // Get first day offset
                        let firstDayOffset = getDay(monthStart);
                        if (weekStartsOn === 1) {
                            firstDayOffset = firstDayOffset === 0 ? 6 : firstDayOffset - 1;
                        }

                        const isSelected = selectedMonth && isSameMonth(monthDate, selectedMonth);

                        return (
                            <button
                                key={monthIndex}
                                onClick={() => onMonthClick?.(monthDate)}
                                className={clsx(
                                    'p-3 rounded-xl border transition-all text-left',
                                    'bg-slate-900/50 hover:bg-slate-800/60',
                                    isSelected
                                        ? 'border-indigo-500/60 ring-2 ring-indigo-500/30'
                                        : 'border-slate-800/60'
                                )}
                            >
                                {/* Month name */}
                                <h3 className="text-sm font-medium text-slate-200 mb-2">
                                    {format(monthDate, 'MMMM', { locale: tr })}
                                </h3>

                                {/* Mini calendar grid */}
                                <div className="grid grid-cols-7 gap-0.5">
                                    {/* Day name headers */}
                                    {(weekStartsOn === 1
                                        ? ['P', 'S', 'Ç', 'P', 'C', 'C', 'P']
                                        : ['P', 'P', 'S', 'Ç', 'P', 'C', 'C']
                                    ).map((d, i) => (
                                        <div key={i} className="text-[8px] text-slate-600 text-center">
                                            {d}
                                        </div>
                                    ))}

                                    {/* Empty cells for offset */}
                                    {Array.from({ length: firstDayOffset }).map((_, i) => (
                                        <div key={`empty-${i}`} className="w-4 h-4" />
                                    ))}

                                    {/* Day cells */}
                                    {days.map((day) => {
                                        const dayStyle = getDayStyle(day);
                                        return (
                                            <div
                                                key={day.toISOString()}
                                                className={clsx(
                                                    'w-4 h-4 flex items-center justify-center text-[9px] rounded-sm',
                                                    isToday(day)
                                                        ? 'bg-cyan-500 text-white font-bold'
                                                        : !dayStyle && 'text-slate-500'
                                                )}
                                                style={!isToday(day) ? dayStyle : undefined}
                                            >
                                                {format(day, 'd')}
                                            </div>
                                        );
                                    })}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
