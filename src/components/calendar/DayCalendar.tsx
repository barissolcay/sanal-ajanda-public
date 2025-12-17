// DayCalendar Component - 24-hour timeline view (Premium Enhanced)
import React, { useRef, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, ChevronDown, Clock } from 'lucide-react';
import type { Task } from '../../domain/types';
import { useCategories } from '../../hooks/useCategories';
import {
    HOURS,
    formatHour,
    getTimeSlotPosition,
    getTimeSlotHeight,
    hasTime,
    isTaskInRange,
    getDayRange,
    formatDate,
    isOverdue,
    isToday,
    sortTasksByPriority,
} from '../../domain/dateUtils';

export interface DayCalendarProps {
    date: Date;
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
    selectedTaskId?: string;
}

const HOUR_HEIGHT = 60; // pixels per hour

export const DayCalendar: React.FC<DayCalendarProps> = ({
    date,
    tasks,
    onTaskClick,
    selectedTaskId,
}) => {
    const { getCategoryColor } = useCategories();
    const timelineRef = useRef<HTMLDivElement>(null);
    const range = getDayRange(date);
    const filteredTasks = tasks.filter(task => isTaskInRange(task, range.start, range.end));

    // Separate all-day tasks from timed tasks and sort them
    const allDayTasks = filteredTasks.filter(task => !hasTime(task));
    const timedTasks = filteredTasks.filter(task => hasTime(task));
    const sortedAllDay = sortTasksByPriority(allDayTasks);

    // Collapsible state for all-day section (start collapsed on mobile if many tasks)
    const [allDayExpanded, setAllDayExpanded] = useState(() => {
        // Start collapsed if on mobile-like viewport or if there are more than 3 tasks
        return typeof window !== 'undefined' && window.innerWidth >= 768;
    });

    // Auto-scroll to current time on mount (only for today)
    useEffect(() => {
        if (timelineRef.current && isToday(date)) {
            const now = new Date();
            const currentHour = now.getHours();
            // Scroll to 2 hours before current time, but min 0
            const scrollToHour = Math.max(0, currentHour - 2);
            const scrollPosition = scrollToHour * HOUR_HEIGHT;
            timelineRef.current.scrollTop = scrollPosition;
        }
    }, [date]);

    const getTaskPosition = (task: Task) => {
        const startTime = task.startTime || '00:00';
        const endTime = task.endTime || '23:59';
        return {
            top: getTimeSlotPosition(startTime, HOUR_HEIGHT),
            height: getTimeSlotHeight(startTime, endTime, HOUR_HEIGHT),
        };
    };

    // Get task style with proper color handling
    const getTaskStyle = (task: Task, top: number, height: number): React.CSSProperties => {
        const color = task.color || getCategoryColor(task.category);
        return {
            top,
            height: Math.max(height, 30),
            backgroundColor: `${color}40`,
            borderColor: color,
        };
    };

    return (
        <div className="flex flex-col h-full">
            {/* Date Header */}
            <div className="px-4 py-3 border-b border-slate-800/60">
                <h2 className="text-lg font-semibold text-slate-100">
                    {formatDate(date, 'dd MMMM yyyy, EEEE')}
                </h2>
            </div>

            {/* All-day tasks section - Collapsible */}
            {allDayTasks.length > 0 && (
                <div className="border-b border-slate-800/60 bg-slate-900/30">
                    {/* Header with toggle */}
                    <button
                        onClick={() => setAllDayExpanded(!allDayExpanded)}
                        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-medium text-slate-500 uppercase">Tüm Gün</h3>
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-slate-700/50 text-slate-400 rounded-full">
                                {allDayTasks.length}
                            </span>
                        </div>
                        <ChevronDown
                            className={clsx(
                                "w-4 h-4 text-slate-500 transition-transform duration-200",
                                allDayExpanded && "rotate-180"
                            )}
                        />
                    </button>

                    <div className="overflow-hidden transition-all duration-300 ease-out"
                        style={{ maxHeight: allDayExpanded ? '384px' : '0px', opacity: allDayExpanded ? 1 : 0 }}
                    >
                        <div className="px-4 pb-3 flex flex-col gap-2">
                            {/* Active tasks first */}
                            {sortedAllDay.activeNoTime.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {sortedAllDay.activeNoTime.map(task => {
                                        const color = task.color || getCategoryColor(task.category);
                                        const isHighPriority = task.priority === 2;
                                        const overdueTask = isOverdue(task);

                                        // Flip Card for Overdue (All-Day)
                                        if (overdueTask) {
                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => onTaskClick?.(task)}
                                                    className="overdue-flip-container h-10 cursor-pointer outline-none"
                                                    tabIndex={0}
                                                    role="button"
                                                >
                                                    <div className="overdue-flip-inner">
                                                        {/* Front */}
                                                        <div
                                                            className={clsx(
                                                                'overdue-flip-front px-3 py-1.5 rounded-lg text-sm font-medium border-l-4 border-l-cyan-400 bg-slate-900/80',
                                                                isHighPriority && 'animate-pulse ring-1 ring-red-500/50'
                                                            )}
                                                            style={{
                                                                backgroundColor: `${color}40`,
                                                                borderColor: overdueTask ? '#22d3ee' : color,
                                                                position: 'relative',
                                                                width: 'auto'
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3 text-cyan-400 shrink-0 overdue-icon-sad" />
                                                                <span>{task.title}</span>
                                                            </div>
                                                        </div>

                                                        {/* Back */}
                                                        <div className="overdue-flip-back rounded-lg text-sm font-bold">
                                                            <span>😭 Unuttun mu beni?!</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Standard All-Day Task
                                        return (
                                            <button
                                                key={task.id}
                                                onClick={() => onTaskClick?.(task)}
                                                className={clsx(
                                                    'px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all duration-300',
                                                    'hover:scale-105 hover:shadow-lg',
                                                    selectedTaskId === task.id && 'ring-2 ring-indigo-500/50',
                                                    isHighPriority && 'animate-pulse ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                )}
                                                style={{
                                                    backgroundColor: `${color}40`,
                                                    borderColor: color
                                                }}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {task.priority === 2 && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                                                    <span>{task.title}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Completed tasks with separator */}
                            {sortedAllDay.completed.length > 0 && (
                                <>
                                    {sortedAllDay.activeNoTime.length > 0 && (
                                        <div className="flex items-center gap-2 py-1">
                                            <div className="flex-1 h-px bg-slate-700/50" />
                                            <span className="text-xs text-slate-600">Tamamlanan</span>
                                            <div className="flex-1 h-px bg-slate-700/50" />
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {sortedAllDay.completed.map(task => {
                                            const color = task.color || getCategoryColor(task.category);
                                            return (
                                                <button
                                                    key={task.id}
                                                    onClick={() => onTaskClick?.(task)}
                                                    className={clsx(
                                                        'px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all duration-300',
                                                        'hover:scale-105 opacity-50 line-through',
                                                        selectedTaskId === task.id && 'ring-2 ring-indigo-500/50'
                                                    )}
                                                    style={{
                                                        backgroundColor: `${color}20`,
                                                        borderColor: `${color}80`
                                                    }}
                                                >
                                                    <span>{task.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div ref={timelineRef} className="flex-1 overflow-y-auto">
                <div className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
                    {/* Hour lines */}
                    {HOURS.map(hour => (
                        <div
                            key={hour}
                            className="absolute left-0 right-0 border-t border-slate-800/40 flex"
                            style={{ top: hour * HOUR_HEIGHT }}
                        >
                            <div className="w-16 px-2 py-1 text-xs text-slate-500 bg-slate-900/50">
                                {formatHour(hour)}
                            </div>
                            <div className="flex-1" />
                        </div>
                    ))}

                    {/* Current time indicator */}
                    {isToday(date) && <CurrentTimeIndicator />}

                    {/* Timed tasks */}
                    <div className="absolute left-16 right-4 top-0 bottom-0">
                        {timedTasks.map(task => {
                            const { top, height } = getTaskPosition(task);
                            const isHighPriority = task.priority === 2 && task.status !== 'done';
                            const overdueTask = isOverdue(task) && task.status !== 'done';

                            // Flip Card for Overdue (Timed)
                            if (overdueTask) {
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => onTaskClick?.(task)}
                                        className={clsx(
                                            "overdue-flip-container absolute left-0 right-0 mx-1 cursor-pointer overflow-visible z-20 outline-none",
                                            selectedTaskId === task.id && 'z-30'
                                        )}
                                        style={getTaskStyle(task, top, height)}
                                        tabIndex={0}
                                        role="button"
                                    >
                                        <div className="overdue-flip-inner h-full w-full">
                                            {/* Front */}
                                            <div
                                                className={clsx(
                                                    'overdue-flip-front px-3 py-1 rounded-lg border-l-4 border-l-cyan-400 bg-slate-900/90 text-left overflow-hidden',
                                                    isHighPriority && 'animate-pulse ring-1 ring-red-500/50'
                                                )}
                                                style={{ borderLeftColor: '#22d3ee' }}
                                            >
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <Clock className="w-3 h-3 text-cyan-400 shrink-0 overdue-icon-sad" />
                                                    <span className="truncate">{task.title}</span>
                                                </div>
                                                <p className="text-xs text-slate-400">
                                                    {task.startTime} - {task.endTime}
                                                </p>
                                            </div>

                                            {/* Back */}
                                            <div className="overdue-flip-back rounded-lg text-xs font-bold flex-col gap-1 items-center justify-center">
                                                <span className="text-center px-1">😭 Unuttun?!</span>
                                                <span className="text-[10px] opacity-80 font-normal">
                                                    {task.startTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // Standard Timed Task
                            return (
                                <button
                                    key={task.id}
                                    onClick={() => onTaskClick?.(task)}
                                    className={clsx(
                                        'absolute left-0 right-0 mx-1 px-3 py-1 rounded-lg border-2 text-left overflow-hidden',
                                        'transition-all duration-300 ease-out',
                                        'hover:shadow-lg hover:scale-[1.02] hover:z-20',
                                        selectedTaskId === task.id && 'ring-2 ring-indigo-500/50 z-10',
                                        task.status === 'done' && 'opacity-50',
                                        isHighPriority && 'animate-pulse ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)] z-5'
                                    )}
                                    style={getTaskStyle(task, top, height)}
                                >
                                    <div className="flex items-center gap-1 min-w-0">
                                        {task.priority === 2 && task.status !== 'done' && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                                        <span className={clsx(
                                            'truncate',
                                            task.status === 'done' && 'line-through'
                                        )}>
                                            {task.title}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {task.startTime} - {task.endTime}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div >
    );
};

// Current time indicator - Premium Enhanced with glow effect
const CurrentTimeIndicator: React.FC = () => {
    const [position, setPosition] = React.useState(0);

    React.useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            setPosition((hours * 60 + minutes) / 60 * HOUR_HEIGHT);
        };

        updatePosition();
        const interval = setInterval(updatePosition, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ top: position }}
        >
            <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-lg shadow-red-500/50 animate-pulse" />
                <div className="flex-1 h-0.5 bg-gradient-to-r from-red-500 to-red-500/30" />
            </div>
        </div>
    );
};
