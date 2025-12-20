// UpcomingTasks - Minimal 3-item list with empty state
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import type { Task } from '../../domain/types';
import { startOfDay, endOfDay, differenceInMinutes } from 'date-fns';

interface UpcomingTasksProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
    maxItems?: number;
}

// Get minutes until task deadline
const getMinutesUntilDeadline = (task: Task): number => {
    const now = new Date();
    const deadlineDate = new Date(task.endDate || task.startDate);

    if (task.endTime) {
        const [hours, minutes] = task.endTime.split(':').map(Number);
        deadlineDate.setHours(hours, minutes, 0, 0);
    } else if (task.startTime) {
        const [hours, minutes] = task.startTime.split(':').map(Number);
        deadlineDate.setHours(hours, minutes, 0, 0);
    } else {
        deadlineDate.setHours(23, 59, 59, 999);
    }

    return differenceInMinutes(deadlineDate, now);
};

// Format countdown with hours and minutes
const formatCountdown = (minutes: number): string => {
    if (minutes < 0) return 'Geçti!';
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) {
        if (mins === 0) return `${hours}s`;
        return `${hours}s ${mins}dk`;
    }
    const days = Math.floor(hours / 24);
    return `${days} gün`;
};

// Check if task deadline is today
const isDeadlineToday = (task: Task): boolean => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const deadlineDate = new Date(task.endDate || task.startDate);
    return deadlineDate >= todayStart && deadlineDate <= todayEnd;
};

export const UpcomingTasks: React.FC<UpcomingTasksProps> = ({
    tasks,
    onTaskClick,
    maxItems = 3
}) => {
    const [, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    // Filter and sort
    const upcomingTasks = tasks
        .filter(task => {
            if (task.status === 'done') return false;
            const minutes = getMinutesUntilDeadline(task);
            const deadlineToday = isDeadlineToday(task);
            const lessThan12Hours = minutes >= -60 && minutes <= 720;
            return deadlineToday || lessThan12Hours;
        })
        .sort((a, b) => getMinutesUntilDeadline(a) - getMinutesUntilDeadline(b))
        .slice(0, maxItems);

    return (
        <div className="p-4 rounded-[14px] bg-slate-800/50 border border-slate-600/30">
            <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-[13px] font-medium text-slate-200">Yaklaşanlar</h3>
            </div>

            {upcomingTasks.length === 0 ? (
                <div className="py-6 text-center">
                    <p className="text-[13px] text-slate-500">Bugün yaklaşan görev yok</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {upcomingTasks.map(task => {
                        const minutes = getMinutesUntilDeadline(task);
                        const isUrgent = minutes <= 60 && minutes >= 0;
                        const isPast = minutes < 0;

                        return (
                            <button
                                key={task.id}
                                onClick={() => onTaskClick?.(task)}
                                className={`
                                    w-full flex items-center gap-3 p-3 rounded-[10px] transition-all text-left
                                    ${isPast
                                        ? 'bg-red-900/20 border border-red-500/30'
                                        : isUrgent
                                            ? 'bg-amber-900/20 border border-amber-500/30'
                                            : 'bg-slate-700/30 border border-slate-600/30 hover:border-slate-500/50'
                                    }
                                `}
                            >
                                <div className={`
                                    min-w-[52px] px-2 py-1 rounded-md text-center text-[11px] font-bold
                                    ${isPast
                                        ? 'bg-red-500/20 text-red-400'
                                        : isUrgent
                                            ? 'bg-amber-500/20 text-amber-400'
                                            : 'bg-slate-600/50 text-slate-400'
                                    }
                                `}>
                                    {formatCountdown(minutes)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] text-slate-200 truncate">{task.title}</p>
                                </div>
                                {(isUrgent || isPast) && (
                                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isPast ? 'text-red-400' : 'text-amber-400'}`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
