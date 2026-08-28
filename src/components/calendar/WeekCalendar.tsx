// WeekCalendar Component - 7-day Adaptive Column View with Date-Specific Collapsible Days
import React, { useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import type { Task } from '../../domain/types';
import { useCategories } from '../../hooks/useCategories';
import {
    AlertTriangle,
    Clock,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Calendar as CalendarIcon,
} from 'lucide-react';
import {
    getWeekDays,
    formatDate,
    isTaskOnDate,
    isToday,
    hasTime,
    isOverdue,
    formatTime,
    sortTasksByPriority,
    toDateString,
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

const STORAGE_KEY = 'sanal_ajandam_collapsed_week_dates';

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
    const weekDays = useMemo(() => getWeekDays(date, weekStartsOn), [date, weekStartsOn]);
    const [dragOverDay, setDragOverDay] = useState<string | null>(null);

    // Collapsed dates (YYYY-MM-DD) with local storage persistence
    const [collapsedDates, setCollapsedDates] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return new Set(parsed);
                }
            }
        } catch (e) {
            console.error('Error loading collapsed week dates from storage:', e);
        }
        return new Set<string>();
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(collapsedDates)));
        } catch (e) {
            console.error('Error saving collapsed week dates to storage:', e);
        }
    }, [collapsedDates]);

    // Map tasks by day
    const tasksByDay = useMemo(() => {
        const map = new Map<string, Task[]>();
        weekDays.forEach(day => {
            map.set(day.toISOString(), tasks.filter(task => isTaskOnDate(task, day)));
        });
        return map;
    }, [tasks, weekDays]);

    const getTasksForDay = (day: Date) => {
        return tasksByDay.get(day.toISOString()) || [];
    };

    // Toggle column collapse / expand for a specific date (Guards: At least 1 day in current week must remain open)
    const toggleDayCollapse = (dateKey: string) => {
        setCollapsedDates(prev => {
            const next = new Set(prev);
            if (next.has(dateKey)) {
                next.delete(dateKey);
            } else {
                // Count how many days in the CURRENT week are already collapsed
                const currentWeekKeys = weekDays.map(d => toDateString(d));
                const currentWeekCollapsedCount = currentWeekKeys.filter(k => next.has(k)).length;
                if (currentWeekCollapsedCount >= 6) {
                    return prev; // Keep at least 1 day open in the current week view
                }
                next.add(dateKey);
            }
            return next;
        });
    };

    // Quick Action: Expand all days in the currently viewed week
    const expandAll = () => {
        setCollapsedDates(prev => {
            const next = new Set(prev);
            weekDays.forEach(d => next.delete(toDateString(d)));
            return next;
        });
    };

    // Quick Action: Collapse weekend days of the current week
    const collapseWeekends = () => {
        setCollapsedDates(prev => {
            const next = new Set(prev);
            const weekendIndices = weekStartsOn === 1 ? [5, 6] : [0, 6];
            weekDays.forEach((d, idx) => {
                const key = toDateString(d);
                if (weekendIndices.includes(idx)) {
                    next.add(key);
                } else {
                    next.delete(key);
                }
            });
            return next;
        });
    };

    // Quick Action: Focus today in current week
    const focusToday = () => {
        const todayIdx = weekDays.findIndex(d => isToday(d));
        if (todayIdx !== -1) {
            const todayKey = toDateString(weekDays[todayIdx]);
            setCollapsedDates(prev => {
                const next = new Set(prev);
                weekDays.forEach(d => {
                    const key = toDateString(d);
                    if (key !== todayKey) {
                        next.add(key);
                    } else {
                        next.delete(key);
                    }
                });
                return next;
            });
        }
    };

    // Quick Action: Collapse empty days in current week
    const collapseEmptyDays = () => {
        setCollapsedDates(prev => {
            const next = new Set(prev);
            const emptyDays = weekDays.filter(d => getTasksForDay(d).length === 0);
            const nonEmptyDays = weekDays.filter(d => getTasksForDay(d).length > 0);

            if (emptyDays.length === 0) return prev;

            if (nonEmptyDays.length === 0) {
                // If all 7 days are empty, keep today or the first day open
                const keepOpen = weekDays.find(d => isToday(d)) || weekDays[0];
                const keepOpenKey = toDateString(keepOpen);
                emptyDays.forEach(d => {
                    const key = toDateString(d);
                    if (key !== keepOpenKey) {
                        next.add(key);
                    } else {
                        next.delete(key);
                    }
                });
            } else {
                emptyDays.forEach(d => next.add(toDateString(d)));
                nonEmptyDays.forEach(d => next.delete(toDateString(d)));
            }
            return next;
        });
    };

    // Style helper for task card category colors
    const getTaskStyle = (task: Task) => {
        const color = task.color || getCategoryColor(task.category);
        return {
            backgroundColor: `${color}30`,
            borderColor: `${color}60`,
        };
    };

    // Drag and drop handlers
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

    // Check if any day in CURRENT week is collapsed
    const currentWeekCollapsedCount = useMemo(() => {
        return weekDays.filter(d => collapsedDates.has(toDateString(d))).length;
    }, [weekDays, collapsedDates]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Quick Action Presets Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 bg-slate-950/50 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Haftalık Görünüm</span>
                </div>

                <div className="flex items-center gap-1.5">
                    {currentWeekCollapsedCount > 0 && (
                        <button
                            type="button"
                            onClick={expandAll}
                            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Tüm daraltılmış günleri aç"
                        >
                            <Maximize2 className="w-3 h-3 text-indigo-400" />
                            <span>Tümünü Aç</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={collapseEmptyDays}
                        className="px-2 py-1 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-colors"
                        title="Görevi olmayan boş günleri daralt"
                    >
                        Boş Günleri Kapat
                    </button>

                    <button
                        type="button"
                        onClick={collapseWeekends}
                        className="px-2 py-1 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-colors"
                        title="Hafta sonu günlerini daraltıp hafta içine odaklan"
                    >
                        Hafta İçi
                    </button>

                    <button
                        type="button"
                        onClick={focusToday}
                        className="px-2 py-1 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-colors"
                        title="Sadece bugünü açık bırakıp diğer günleri daralt"
                    >
                        Bugüne Odaklan
                    </button>
                </div>
            </div>

            {/* Scrollable Adaptive Week Columns Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
                <div className="min-w-[680px] md:min-w-full h-full flex">
                    {weekDays.map((day) => {
                        const dayIso = day.toISOString();
                        const dateKey = toDateString(day);
                        const isDragOver = dragOverDay === dayIso;
                        const dayTasks = getTasksForDay(day);
                        const isCollapsed = collapsedDates.has(dateKey);
                        const activeToday = isToday(day);

                        // If column is collapsed, render slim vertical pill column
                        if (isCollapsed) {
                            const completedCount = dayTasks.filter(t => t.status === 'done').length;
                            const hasOverdue = dayTasks.some(t => isOverdue(t) && t.status !== 'done');
                            const hasHighPriority = dayTasks.some(t => t.priority === 2 && t.status !== 'done');

                            return (
                                <div
                                    key={dayIso}
                                    onDragOver={(e) => handleDragOver(e, dayIso)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, day)}
                                    onClick={() => toggleDayCollapse(dateKey)}
                                    title={`${formatDate(day, 'EEEE d MMMM')}: ${dayTasks.length} görev (Genişletmek için tıkla)`}
                                    className={clsx(
                                        'group relative flex flex-col items-center justify-between py-3 px-1 border-r border-slate-800/60 last:border-r-0 select-none cursor-pointer transition-all duration-300 ease-in-out',
                                        'flex-none w-11 md:w-12 bg-slate-950/70 hover:bg-slate-900/90 hover:border-indigo-500/50',
                                        activeToday && 'bg-indigo-950/20 border-l border-indigo-500/30',
                                        isDragOver && 'bg-indigo-500/30 ring-2 ring-inset ring-indigo-400'
                                    )}
                                >
                                    {/* Top Header in Collapsed Column */}
                                    <div className="flex flex-col items-center gap-1 w-full">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {formatDate(day, 'EEE')}
                                        </span>
                                        <div
                                            className={clsx(
                                                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-transform group-hover:scale-110',
                                                activeToday
                                                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/40'
                                                    : 'bg-slate-800/80 text-slate-200 group-hover:bg-slate-700'
                                            )}
                                        >
                                            {formatDate(day, 'd')}
                                        </div>

                                        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-300 transition-transform group-hover:translate-x-0.5" />
                                    </div>

                                    {/* Middle: Badges, Indicators & Dots */}
                                    <div className="flex-1 flex flex-col items-center justify-center my-2 gap-1.5 w-full overflow-hidden">
                                        {dayTasks.length > 0 ? (
                                            <>
                                                {/* Task count pill badge */}
                                                <div
                                                    className={clsx(
                                                        'px-1.5 py-0.5 rounded-full text-[10px] font-bold border',
                                                        completedCount === dayTasks.length
                                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                                    )}
                                                >
                                                    {completedCount > 0 ? `${completedCount}/${dayTasks.length}` : dayTasks.length}
                                                </div>

                                                {/* High priority or Overdue warning icon */}
                                                {hasOverdue ? (
                                                    <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                                                ) : hasHighPriority ? (
                                                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                                                ) : null}

                                                {/* Micro dots for each task */}
                                                <div className="flex flex-col items-center gap-1 my-1 max-h-36 overflow-hidden">
                                                    {dayTasks.slice(0, 6).map((task) => {
                                                        const color = task.color || getCategoryColor(task.category);
                                                        return (
                                                            <div
                                                                key={task.id}
                                                                className={clsx(
                                                                    'w-2 h-2 rounded-full border border-white/20 transition-transform group-hover:scale-125',
                                                                    task.status === 'done' && 'opacity-40'
                                                                )}
                                                                style={{ backgroundColor: color }}
                                                                title={task.title}
                                                            />
                                                        );
                                                    })}
                                                    {dayTasks.length > 6 && (
                                                        <span className="text-[9px] text-slate-500 leading-none">+</span>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                        )}
                                    </div>

                                    {/* Bottom: Vertical Text Indicator */}
                                    <div className="text-[10px] font-medium text-slate-500 group-hover:text-slate-300 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
                                        {dayTasks.length > 0 ? `${dayTasks.length} Görev` : 'Boş'}
                                    </div>
                                </div>
                            );
                        }

                        // Expanded Column (Normal Full Day Column)
                        const allDayTasks = dayTasks.filter(t => !hasTime(t));
                        const timedTasks = dayTasks
                            .filter(t => hasTime(t))
                            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

                        const sortedAllDay = sortTasksByPriority(allDayTasks);
                        const orderedAllDay = [...sortedAllDay.activeNoTime, ...sortedAllDay.completed];

                        return (
                            <div
                                key={dayIso}
                                onDragOver={(e) => handleDragOver(e, dayIso)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, day)}
                                className={clsx(
                                    'flex-1 min-w-0 flex flex-col border-r border-slate-800/60 last:border-r-0 overflow-hidden transition-all duration-300 ease-in-out',
                                    activeToday && 'bg-indigo-500/[0.03]',
                                    isDragOver && 'bg-indigo-500/20 ring-2 ring-inset ring-indigo-400'
                                )}
                            >
                                {/* Column Header */}
                                <div
                                    className={clsx(
                                        'px-2 py-2.5 border-b border-slate-800/60 flex items-center justify-between transition-colors',
                                        activeToday && 'bg-indigo-500/10'
                                    )}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => onDayClick?.(day)}
                                            className={clsx(
                                                'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-transform hover:scale-105',
                                                activeToday
                                                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/40'
                                                    : 'text-slate-200 bg-slate-800/70 hover:bg-slate-700'
                                            )}
                                            title="Güne git"
                                        >
                                            {formatDate(day, 'd')}
                                        </button>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-tight truncate">
                                                {formatDate(day, 'EEE')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Collapse Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleDayCollapse(dateKey);
                                        }}
                                        className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
                                        title="Bu günü daralt (Diğer günlere yer aç)"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Task list in expanded column */}
                                <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
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
                                                    'hover:scale-[1.01] hover:shadow-md focus-visible:ring-1 focus-visible:ring-indigo-500',
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
                                            <span className="text-[10px] text-slate-500 font-semibold">Saatli</span>
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
                                                    'hover:scale-[1.01] hover:shadow-md focus-visible:ring-1 focus-visible:ring-indigo-500',
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
    );
};
