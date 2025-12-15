// MonthCalendar Component - Monthly grid view
import React from 'react';
import { clsx } from 'clsx';
import { AlertTriangle } from 'lucide-react';
import type { Task } from '../../domain/types';
import { CATEGORY_INFO } from '../../domain/types';
import {
    getCalendarDays,
    formatDate,
    isTaskOnDate,
    isToday,
    isSameMonth,
    isSameDay,
    isOverdue,
} from '../../domain/dateUtils';

export interface MonthCalendarProps {
    date: Date;
    tasks: Task[];
    weekStartsOn: 0 | 1;
    selectedDate?: Date | null;
    onDayClick?: (date: Date) => void;
    onTaskClick?: (task: Task) => void;
}

const DAY_NAMES = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
    date,
    tasks,
    weekStartsOn,
    selectedDate,
    onDayClick,
    onTaskClick,
}) => {
    const calendarDays = getCalendarDays(date, weekStartsOn);

    // Reorder day names based on weekStartsOn
    const orderedDayNames = weekStartsOn === 1
        ? [...DAY_NAMES.slice(1), DAY_NAMES[0]]
        : DAY_NAMES;

    const getTasksForDay = (day: Date) => {
        return tasks.filter(task => isTaskOnDate(task, day));
    };

    const getCategoryDotColor = (category: Task['category']) => {
        const info = CATEGORY_INFO[category];
        return info ? info.color.replace('text-', 'bg-').replace('300', '400') : 'bg-indigo-400';
    };

    return (
        <div className="flex flex-col h-full">
            {/* Month header */}
            <div className="px-4 py-3 border-b border-slate-800/60">
                <h2 className="text-lg font-semibold text-slate-100">
                    {formatDate(date, 'MMMM yyyy')}
                </h2>
            </div>

            {/* Day names header */}
            <div className="grid grid-cols-7 border-b border-slate-800/60">
                {orderedDayNames.map((name, index) => (
                    <div
                        key={index}
                        className="px-2 py-2 text-center text-xs font-medium text-slate-500 uppercase"
                    >
                        {name}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
                {calendarDays.map((day) => {
                    const isCurrentMonth = isSameMonth(day, date);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const dayTasks = getTasksForDay(day).sort((a, b) =>
                        (a.startTime || '').localeCompare(b.startTime || '')
                    );
                    const hasOverdue = dayTasks.some(t => isOverdue(t));

                    // Group tasks by category for dots
                    const categories = [...new Set(dayTasks.map(t => t.category))];

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onDayClick?.(day)}
                            className={clsx(
                                'flex flex-col p-1 border-b border-r border-slate-800/40 transition-colors min-h-[80px]',
                                'hover:bg-slate-800/40',
                                !isCurrentMonth && 'opacity-40',
                                isSelected && 'bg-indigo-500/20 ring-1 ring-inset ring-indigo-500/50',
                                isToday(day) && !isSelected && 'bg-cyan-500/10'
                            )}
                        >
                            {/* Day number */}
                            <div className="flex items-center justify-between mb-1">
                                <span
                                    className={clsx(
                                        'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm',
                                        isToday(day)
                                            ? 'bg-indigo-500 text-white font-bold'
                                            : 'text-slate-300'
                                    )}
                                >
                                    {formatDate(day, 'd')}
                                </span>

                                {/* Overdue indicator */}
                                {hasOverdue && (
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                )}
                            </div>

                            {/* Task indicators */}
                            <div className="flex-1 space-y-0.5 overflow-hidden">
                                {dayTasks.slice(0, 3).map((task) => {
                                    const categoryInfo = CATEGORY_INFO[task.category];
                                    return (
                                        <div
                                            key={task.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTaskClick?.(task);
                                            }}
                                            className={clsx(
                                                'px-1.5 py-0.5 rounded text-xs truncate cursor-pointer transition-colors border-l-2',
                                                task.status === 'done'
                                                    ? 'bg-slate-800/50 text-slate-500 line-through border-slate-600'
                                                    : clsx(
                                                        categoryInfo?.bgColor || 'bg-slate-800/80',
                                                        categoryInfo?.color || 'text-slate-300',
                                                        `border-${categoryInfo?.color.replace('text-', '')}/60`
                                                    ),
                                                isOverdue(task) && task.status !== 'done' && '!border-red-500'
                                            )}
                                        >
                                            <div className="flex items-center gap-1 min-w-0">
                                                {task.priority === 2 && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                                                <span className="truncate">{task.title}</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {dayTasks.length > 3 && (
                                    <p className="text-xs text-slate-500 px-1">
                                        +{dayTasks.length - 3} daha
                                    </p>
                                )}
                            </div>

                            {/* Category dots (if no task previews shown) */}
                            {dayTasks.length === 0 && categories.length > 0 && (
                                <div className="flex gap-1 mt-auto">
                                    {categories.slice(0, 4).map((cat, i) => (
                                        <span
                                            key={i}
                                            className={clsx('w-1.5 h-1.5 rounded-full', getCategoryDotColor(cat))}
                                        />
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
