// MonthCalendar Component - Monthly grid view (Premium Enhanced)
import React from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, Clock } from 'lucide-react';
import type { Task } from '../../domain/types';
import { useCategories } from '../../hooks/useCategories';
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
    const { getCategoryColor } = useCategories();
    const calendarDays = getCalendarDays(date, weekStartsOn);

    // Reorder day names based on weekStartsOn
    const orderedDayNames = weekStartsOn === 1
        ? [...DAY_NAMES.slice(1), DAY_NAMES[0]]
        : DAY_NAMES;

    const getTasksForDay = (day: Date) => {
        return tasks.filter(task => isTaskOnDate(task, day));
    };

    // Get task style based on category color
    const getTaskStyle = (task: Task) => {
        const color = task.color || getCategoryColor(task.category);
        return {
            backgroundColor: `${color}20`,
            borderLeftColor: color,
            color: color,
        };
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Month header */}
            <div className="px-4 py-3 border-b border-slate-800/60">
                <h2 className="text-lg font-semibold text-slate-100">
                    {formatDate(date, 'MMMM yyyy')}
                </h2>
            </div>

            {/* Scrollable calendar container for mobile */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
                <div className="min-w-[600px] md:min-w-full h-full flex flex-col">
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

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => onDayClick?.(day)}
                                    className={clsx(
                                        'group flex flex-col p-1.5 border-b border-r border-slate-800/40 transition-all min-h-[100px]',
                                        'hover:bg-slate-800/40 hover:shadow-inner',
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
                                            <span className="w-2 h-2 rounded-full bg-cyan-500" />
                                        )}
                                    </div>

                                    {/* Task indicators - scrollable with invisible scrollbar */}
                                    <div className="flex-1 space-y-0.5 overflow-y-auto scrollbar-hide">
                                        {dayTasks.map((task) => {
                                            const taskStyle = getTaskStyle(task);
                                            const isHighPriority = task.priority === 2 && task.status !== 'done';
                                            const overdueTask = isOverdue(task) && task.status !== 'done';
                                            // Flip Card Structure for Overdue Tasks
                                            if (overdueTask) {
                                                return (
                                                    <div
                                                        key={task.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onTaskClick?.(task);
                                                        }}
                                                        className="overdue-flip-container h-6 cursor-pointer"
                                                    >
                                                        <div className="overdue-flip-inner">
                                                            {/* Front Face */}
                                                            <div
                                                                className={clsx(
                                                                    'overdue-flip-front px-1.5 py-0.5 rounded text-xs truncate border-l-4 border-l-cyan-400',
                                                                    task.status === 'done' && 'opacity-50 line-through'
                                                                )}
                                                                style={{
                                                                    backgroundColor: taskStyle.backgroundColor,
                                                                    borderLeftColor: '#22d3ee',
                                                                    color: task.status === 'done' ? '#64748b' : undefined,
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-1 min-w-0">
                                                                    <Clock className="w-3 h-3 text-cyan-400 shrink-0 overdue-icon-sad" />
                                                                    <span className="truncate">{task.title}</span>
                                                                </div>
                                                            </div>

                                                            {/* Back Face */}
                                                            <div className="overdue-flip-back">
                                                                <span>😭 Unuttun mu beni?!</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Standard Task Render
                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onTaskClick?.(task);
                                                    }}
                                                    className={clsx(
                                                        'px-1.5 py-0.5 rounded text-xs cursor-pointer transition-all border-l-2 overflow-x-auto scrollbar-hide',
                                                        'hover:scale-[1.05] hover:shadow-md',
                                                        task.status === 'done' && 'opacity-50 line-through',
                                                        isHighPriority && 'animate-pulse ring-1 ring-red-500/40 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                                                    )}
                                                    style={{
                                                        backgroundColor: task.status === 'done' ? 'rgba(30, 41, 59, 0.5)' : taskStyle.backgroundColor,
                                                        borderLeftColor: taskStyle.borderLeftColor,
                                                        color: task.status === 'done' ? '#64748b' : undefined,
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        {task.priority === 2 && task.status !== 'done' && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                                                        <span>{task.title}</span>
                                                    </div>
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
        </div>
    );
};
