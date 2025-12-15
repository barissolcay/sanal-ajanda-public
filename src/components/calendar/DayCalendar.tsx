// DayCalendar Component - 24-hour timeline view
import React, { useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import type { Task } from '../../domain/types';
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
    const timelineRef = useRef<HTMLDivElement>(null);
    const range = getDayRange(date);
    const filteredTasks = tasks.filter(task => isTaskInRange(task, range.start, range.end));

    // Separate all-day tasks from timed tasks
    const allDayTasks = filteredTasks.filter(task => !hasTime(task));
    const timedTasks = filteredTasks.filter(task => hasTime(task));

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

    const getCategoryColor = (category: Task['category'], taskColor?: string) => {
        // If task has custom color, use it
        if (taskColor) {
            return `border-2`;
        }
        // Otherwise use category colors
        switch (category) {
            case 'reading': return 'bg-emerald-500/30 border-emerald-500/60 hover:bg-emerald-500/40';
            case 'watching': return 'bg-purple-500/30 border-purple-500/60 hover:bg-purple-500/40';
            case 'goal': return 'bg-amber-500/30 border-amber-500/60 hover:bg-amber-500/40';
            default: return 'bg-indigo-500/30 border-indigo-500/60 hover:bg-indigo-500/40';
        }
    };

    const getTaskStyle = (task: Task, top: number, height: number) => {
        const baseStyle: React.CSSProperties = { top, height: Math.max(height, 30) };
        if ((task as any).color) {
            baseStyle.backgroundColor = `${(task as any).color}40`;
            baseStyle.borderColor = (task as any).color;
        }
        return baseStyle;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Date Header */}
            <div className="px-4 py-3 border-b border-slate-800/60">
                <h2 className="text-lg font-semibold text-slate-100">
                    {formatDate(date, 'dd MMMM yyyy, EEEE')}
                </h2>
            </div>

            {/* All-day tasks section */}
            {allDayTasks.length > 0 && (
                <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/30">
                    <h3 className="text-xs font-medium text-slate-500 uppercase mb-2">Tüm Gün</h3>
                    <div className="flex flex-wrap gap-2">
                        {allDayTasks.map(task => (
                            <button
                                key={task.id}
                                onClick={() => onTaskClick?.(task)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                                    getCategoryColor(task.category, (task as any).color),
                                    selectedTaskId === task.id && 'ring-2 ring-indigo-500/50',
                                    task.status === 'done' && 'opacity-50 line-through',
                                    isOverdue(task) && 'border-red-500/60'
                                )}
                                style={(task as any).color ? {
                                    backgroundColor: `${(task as any).color}40`,
                                    borderColor: (task as any).color
                                } : undefined}
                            >
                                {task.title}
                            </button>
                        ))}
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
                            return (
                                <button
                                    key={task.id}
                                    onClick={() => onTaskClick?.(task)}
                                    className={clsx(
                                        'absolute left-0 right-0 mx-1 px-3 py-1 rounded-lg border text-left overflow-hidden transition-all',
                                        getCategoryColor(task.category, (task as any).color),
                                        selectedTaskId === task.id && 'ring-2 ring-indigo-500/50',
                                        task.status === 'done' && 'opacity-50',
                                        isOverdue(task) && 'border-l-4 border-l-red-500'
                                    )}
                                    style={getTaskStyle(task, top, height)}
                                >
                                    <p className={clsx(
                                        'text-sm font-medium text-slate-100 truncate',
                                        task.status === 'done' && 'line-through'
                                    )}>
                                        {task.title}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {task.startTime} - {task.endTime}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Current time indicator
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
                <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
                <div className="flex-1 h-0.5 bg-red-500" />
            </div>
        </div>
    );
};
