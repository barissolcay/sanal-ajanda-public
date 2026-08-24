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
import { isSameMonth, isToday } from '../../domain/dateUtils';

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

    // Index tasks by date string (YYYY-MM-DD) for O(1) lookup
    const taskDayMap = React.useMemo(() => {
        const map = new Map<string, Task[]>();
        for (const task of tasks) {
            if (!task.startDate) continue;
            try {
                const [y1, m1, d1] = task.startDate.split('-').map(Number);
                const start = new Date(y1, m1 - 1, d1);
                const [y2, m2, d2] = (task.endDate || task.startDate).split('-').map(Number);
                const end = new Date(y2, m2 - 1, d2);
                if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) continue;

                const daysInRange = eachDayOfInterval({ start, end });
                for (const d of daysInRange) {
                    const key = format(d, 'yyyy-MM-dd');
                    const list = map.get(key);
                    if (list) {
                        list.push(task);
                    } else {
                        map.set(key, [task]);
                    }
                }
            } catch {
                // Ignore invalid dates defensively
            }
        }
        return map;
    }, [tasks]);

    const getDayStyle = (day: Date): React.CSSProperties | undefined => {
        const key = format(day, 'yyyy-MM-dd');
        const dayTasks = taskDayMap.get(key);
        if (!dayTasks || dayTasks.length === 0) return undefined;

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

            {/* Mini calendars grid - responsive: 2 cols mobile, 3 tablet, 4 desktop */}
            <div className="flex-1 overflow-y-auto p-2 md:p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
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
                                    'p-4 rounded-xl border transition-all text-left hover:scale-[1.02]',
                                    'bg-slate-900/50 hover:bg-slate-800/60 hover:shadow-lg',
                                    isSelected
                                        ? 'border-indigo-500/60 ring-2 ring-indigo-500/30'
                                        : 'border-slate-800/60'
                                )}
                            >
                                {/* Month name */}
                                <h3 className="text-base font-semibold text-slate-200 mb-3">
                                    {format(monthDate, 'MMMM', { locale: tr })}
                                </h3>

                                {/* Mini calendar grid - larger cells */}
                                <div className="grid grid-cols-7 gap-1">
                                    {/* Day name headers */}
                                    {(weekStartsOn === 1
                                        ? ['P', 'S', 'Ç', 'P', 'C', 'C', 'P']
                                        : ['P', 'P', 'S', 'Ç', 'P', 'C', 'C']
                                    ).map((d, i) => (
                                        <div key={i} className="text-[10px] text-slate-500 text-center font-medium">
                                            {d}
                                        </div>
                                    ))}

                                    {/* Empty cells for offset */}
                                    {Array.from({ length: firstDayOffset }).map((_, i) => (
                                        <div key={`empty-${i}`} className="w-6 h-6" />
                                    ))}

                                    {/* Day cells - larger */}
                                    {days.map((day) => {
                                        const dayStyle = getDayStyle(day);
                                        return (
                                            <div
                                                key={day.toISOString()}
                                                className={clsx(
                                                    'w-6 h-6 flex items-center justify-center text-xs rounded',
                                                    isToday(day)
                                                        ? 'bg-cyan-500 text-white font-bold'
                                                        : !dayStyle && 'text-slate-400'
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
