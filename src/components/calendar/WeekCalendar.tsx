// WeekCalendar Component - 7-day grid view
import React from 'react';
import { clsx } from 'clsx';
import type { Task } from '../../domain/types';
import {
    getWeekDays,
    formatDate,
    isTaskOnDate,
    isToday,
    hasTime,
    isOverdue,
} from '../../domain/dateUtils';

export interface WeekCalendarProps {
    date: Date;
    tasks: Task[];
    weekStartsOn: 0 | 1;
    onTaskClick?: (task: Task) => void;
    onDayClick?: (date: Date) => void;
    selectedTaskId?: string;
}

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
    date,
    tasks,
    weekStartsOn,
    onTaskClick,
    onDayClick,
    selectedTaskId,
}) => {
    const weekDays = getWeekDays(date, weekStartsOn);

    const getTasksForDay = (day: Date) => {
        return tasks.filter(task => isTaskOnDate(task, day));
    };

    const getCategoryColor = (category: Task['category']) => {
        switch (category) {
            case 'reading': return 'bg-emerald-500/30 border-emerald-500/60';
            case 'watching': return 'bg-purple-500/30 border-purple-500/60';
            case 'goal': return 'bg-amber-500/30 border-amber-500/60';
            default: return 'bg-indigo-500/30 border-indigo-500/60';
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Week header */}
            <div className="grid grid-cols-7 border-b border-slate-800/60">
                {weekDays.map((day) => (
                    <div
                        key={day.toISOString()}
                        className={clsx(
                            'px-2 py-3 text-center border-r border-slate-800/40 last:border-r-0',
                            isToday(day) && 'bg-indigo-500/10'
                        )}
                    >
                        <p className="text-xs text-slate-500 uppercase">
                            {formatDate(day, 'EEE')}
                        </p>
                        <button
                            onClick={() => onDayClick?.(day)}
                            className={clsx(
                                'inline-flex items-center justify-center w-8 h-8 mt-1 rounded-full text-sm font-medium transition-colors',
                                isToday(day)
                                    ? 'bg-indigo-500 text-white'
                                    : 'text-slate-200 hover:bg-slate-800/60'
                            )}
                        >
                            {formatDate(day, 'd')}
                        </button>
                    </div>
                ))}
            </div>

            {/* Week content */}
            <div className="flex-1 grid grid-cols-7 overflow-hidden">
                {weekDays.map((day) => {
                    const dayTasks = getTasksForDay(day);
                    const allDayTasks = dayTasks.filter(t => !hasTime(t));
                    const timedTasks = dayTasks.filter(t => hasTime(t));

                    return (
                        <div
                            key={day.toISOString()}
                            className={clsx(
                                'flex flex-col border-r border-slate-800/40 last:border-r-0 overflow-hidden',
                                isToday(day) && 'bg-indigo-500/5'
                            )}
                        >
                            {/* All-day tasks */}
                            {allDayTasks.length > 0 && (
                                <div className="p-1 space-y-1 border-b border-slate-800/40 bg-slate-900/30">
                                    {allDayTasks.slice(0, 3).map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => onTaskClick?.(task)}
                                            className={clsx(
                                                'w-full px-2 py-1 rounded text-xs font-medium text-left truncate border transition-all',
                                                getCategoryColor(task.category),
                                                selectedTaskId === task.id && 'ring-1 ring-indigo-500',
                                                task.status === 'done' && 'opacity-50 line-through',
                                                isOverdue(task) && 'border-l-2 border-l-red-500'
                                            )}
                                        >
                                            {task.title}
                                        </button>
                                    ))}
                                    {allDayTasks.length > 3 && (
                                        <p className="text-xs text-slate-500 px-2">
                                            +{allDayTasks.length - 3} daha
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Timed tasks */}
                            <div className="flex-1 overflow-y-auto p-1 space-y-1">
                                {timedTasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => onTaskClick?.(task)}
                                        className={clsx(
                                            'w-full px-2 py-1.5 rounded text-left border transition-all',
                                            getCategoryColor(task.category),
                                            selectedTaskId === task.id && 'ring-1 ring-indigo-500',
                                            task.status === 'done' && 'opacity-50',
                                            isOverdue(task) && 'border-l-2 border-l-red-500'
                                        )}
                                    >
                                        <p className="text-xs text-slate-400">{task.startTime}</p>
                                        <p className={clsx(
                                            'text-xs font-medium text-slate-200 truncate',
                                            task.status === 'done' && 'line-through'
                                        )}>
                                            {task.title}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
