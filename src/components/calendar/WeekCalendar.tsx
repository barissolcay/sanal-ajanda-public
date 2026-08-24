// WeekCalendar Component - 7-day grid view (Premium Enhanced)
import React from 'react';
import { clsx } from 'clsx';
import type { Task } from '../../domain/types';
import { useCategories } from '../../hooks/useCategories';
import { AlertTriangle, Clock } from 'lucide-react';
import {
    getWeekDays,
    formatDate,
    isTaskOnDate,
    isToday,
    hasTime,
    isOverdue,
    formatTime,
    sortTasksByPriority,
} from '../../domain/dateUtils';

export interface WeekCalendarProps {
    date: Date;
    tasks: Task[];
    weekStartsOn: 0 | 1;
    onTaskClick?: (task: Task) => void;
    onDayClick?: (date: Date) => void;
    onTaskDrop?: (taskId: string, targetDate: Date) => void;
    selectedTaskId?: string;
}

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
    date,
    tasks,
    weekStartsOn,
    onTaskClick,
    onDayClick,
    onTaskDrop,
    selectedTaskId,
}) => {
    const { getCategoryColor } = useCategories();
    const weekDays = getWeekDays(date, weekStartsOn);
    const [dragOverDay, setDragOverDay] = React.useState<string | null>(null);

    const tasksByDay = React.useMemo(() => {
        const map = new Map<string, Task[]>();
        weekDays.forEach(day => {
            map.set(day.toISOString(), tasks.filter(task => isTaskOnDate(task, day)));
        });
        return map;
    }, [tasks, weekDays]);

    const getTasksForDay = (day: Date) => {
        return tasksByDay.get(day.toISOString()) || [];
    };

    // Get task style based on category color
    const getTaskStyle = (task: Task) => {
        const color = task.color || getCategoryColor(task.category);
        return {
            backgroundColor: `${color}30`,
            borderColor: `${color}60`,
        };
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('text/plain', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, dayIso: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverDay !== dayIso) {
            setDragOverDay(dayIso);
        }
    };

    const handleDragLeave = () => {
        setDragOverDay(null);
    };

    const handleDrop = (e: React.DragEvent, targetDate: Date) => {
        e.preventDefault();
        setDragOverDay(null);
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId && onTaskDrop) {
            onTaskDrop(taskId, targetDate);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Scrollable week container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
                <div className="min-w-[700px] md:min-w-full h-full flex flex-col">
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
                                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/40'
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
                            const dayIso = day.toISOString();
                            const isDragOver = dragOverDay === dayIso;
                            const dayTasks = getTasksForDay(day);
                            const allDayTasks = dayTasks.filter(t => !hasTime(t));
                            const timedTasks = dayTasks
                                .filter(t => hasTime(t))
                                .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

                            // Sort all-day tasks: active first, completed last
                            const sortedAllDay = sortTasksByPriority(allDayTasks);
                            const orderedAllDay = [...sortedAllDay.activeNoTime, ...sortedAllDay.completed];

                            return (
                                <div
                                    key={dayIso}
                                    onDragOver={(e) => handleDragOver(e, dayIso)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, day)}
                                    className={clsx(
                                        'flex flex-col border-r border-slate-800/40 last:border-r-0 overflow-hidden transition-colors duration-150',
                                        isToday(day) && 'bg-indigo-500/5',
                                        isDragOver && 'bg-indigo-500/20 ring-2 ring-inset ring-indigo-400'
                                    )}
                                >
                                    {/* All tasks in a single scrollable container - dynamic height */}
                                    <div className="flex-1 overflow-y-auto p-1 space-y-1">
                                        {/* All-day tasks first */}
                                        {orderedAllDay.map(task => {
                                            const taskStyle = getTaskStyle(task);
                                            const isHighPriority = task.priority === 2 && task.status !== 'done';
                                            const overdueTask = isOverdue(task) && task.status !== 'done';

                                            if (overdueTask) {
                                                return (
                                                    <div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                                        onClick={() => onTaskClick?.(task)}
                                                        className="overdue-flip-container cursor-grab active:cursor-grabbing outline-none min-h-[2rem]"
                                                        tabIndex={0}
                                                        role="button"
                                                    >
                                                        <div className="overdue-flip-inner">
                                                            {/* Front */}
                                                            <div
                                                                className={clsx(
                                                                    'overdue-flip-front w-full px-2 py-1.5 rounded text-left border border-l-4 border-l-cyan-400 bg-slate-900/80',
                                                                    isHighPriority && 'animate-pulse ring-1 ring-red-500/50'
                                                                )}
                                                                style={{
                                                                    backgroundColor: `${taskStyle.backgroundColor}`,
                                                                    borderColor: '#22d3ee',
                                                                    position: 'relative',
                                                                    height: 'auto',
                                                                    minHeight: '100%'
                                                                }}
                                                            >
                                                                <div className="flex items-start gap-1 min-w-0">
                                                                    <Clock className="w-3 h-3 text-cyan-400 shrink-0 overdue-icon-sad mt-0.5" />
                                                                    <span className="text-xs font-medium text-slate-200 break-words line-clamp-2 leading-tight flex-1 min-w-0">{task.title}</span>
                                                                </div>
                                                            </div>

                                                            {/* Back */}
                                                            <div className="overdue-flip-back rounded text-xs font-bold">
                                                                <span>😭 Unuttun mu beni?!</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={task.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                                    onClick={() => onTaskClick?.(task)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            onTaskClick?.(task);
                                                        }
                                                    }}
                                                    className={clsx(
                                                        'w-full px-2 py-1.5 rounded text-xs font-medium text-left border transition-all cursor-grab active:cursor-grabbing outline-none',
                                                        'hover:scale-[1.02] hover:shadow-md focus-visible:ring-1 focus-visible:ring-indigo-500',
                                                        selectedTaskId === task.id && 'ring-1 ring-indigo-500',
                                                        task.status === 'done' && 'opacity-50 line-through',
                                                        isHighPriority && 'animate-pulse ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                    )}
                                                    style={taskStyle}
                                                >
                                                    <div className="flex items-start gap-1.5 min-w-0">
                                                        {task.priority === 2 && task.status !== 'done' && (
                                                            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                                                        )}
                                                        <span className="break-words line-clamp-2 leading-tight flex-1 min-w-0 text-slate-200">
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Separator if both types exist */}
                                        {orderedAllDay.length > 0 && timedTasks.length > 0 && (
                                            <div className="flex items-center gap-2 py-1">
                                                <div className="flex-1 h-px bg-slate-700/50" />
                                                <span className="text-[10px] text-slate-600">Saatli</span>
                                                <div className="flex-1 h-px bg-slate-700/50" />
                                            </div>
                                        )}

                                        {/* Timed tasks */}
                                        {timedTasks.map(task => {
                                            const taskStyle = getTaskStyle(task);
                                            const isHighPriority = task.priority === 2 && task.status !== 'done';
                                            const overdueTask = isOverdue(task) && task.status !== 'done';

                                            if (overdueTask) {
                                                return (
                                                    <div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                                        onClick={() => onTaskClick?.(task)}
                                                        className="overdue-flip-container cursor-grab active:cursor-grabbing mb-1 outline-none min-h-[3rem]"
                                                        tabIndex={0}
                                                        role="button"
                                                    >
                                                        <div className="overdue-flip-inner">
                                                            {/* Front */}
                                                            <div
                                                                className={clsx(
                                                                    'overdue-flip-front w-full px-2 py-1.5 rounded text-left border border-l-4 border-l-cyan-400 bg-slate-900/80',
                                                                    isHighPriority && 'animate-pulse ring-1 ring-red-500/50'
                                                                )}
                                                                style={{
                                                                    backgroundColor: `${taskStyle.backgroundColor}`,
                                                                    borderColor: '#22d3ee',
                                                                    position: 'relative',
                                                                    height: 'auto',
                                                                    minHeight: '100%'
                                                                }}
                                                            >
                                                                <p className="text-[10px] text-zinc-400">{formatTime(task.startTime!)}</p>
                                                                <div className="flex items-start gap-1 min-w-0">
                                                                    <Clock className="w-3 h-3 text-cyan-400 shrink-0 overdue-icon-sad mt-0.5" />
                                                                    <span className="text-xs font-medium text-slate-200 break-words line-clamp-2 leading-tight flex-1 min-w-0">{task.title}</span>
                                                                </div>
                                                            </div>

                                                            {/* Back */}
                                                            <div className="overdue-flip-back rounded text-xs font-bold flex-col gap-0.5 leading-tight p-0.5">
                                                                <span>😭 Unuttun mu beni?!</span>
                                                                <span className="font-normal opacity-70">{formatTime(task.startTime!)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={task.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                                    onClick={() => onTaskClick?.(task)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            onTaskClick?.(task);
                                                        }
                                                    }}
                                                    className={clsx(
                                                        'w-full px-2 py-1.5 rounded text-left border transition-all cursor-grab active:cursor-grabbing outline-none',
                                                        'hover:scale-[1.02] hover:shadow-md focus-visible:ring-1 focus-visible:ring-indigo-500',
                                                        selectedTaskId === task.id && 'ring-1 ring-indigo-500',
                                                        task.status === 'done' && 'opacity-50',
                                                        isHighPriority && 'animate-pulse ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                    )}
                                                    style={taskStyle}
                                                >
                                                    <p className="text-xs text-slate-400">{formatTime(task.startTime!)}</p>
                                                    <div className="flex items-start gap-1.5 min-w-0">
                                                        {task.priority === 2 && task.status !== 'done' && (
                                                            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                                                        )}
                                                        <p className={clsx(
                                                            'text-xs font-medium text-slate-200 break-words line-clamp-2 leading-tight flex-1 min-w-0',
                                                            task.status === 'done' && 'line-through text-slate-500'
                                                        )}>
                                                            {task.title}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
