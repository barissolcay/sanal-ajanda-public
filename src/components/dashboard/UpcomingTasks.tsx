// UpcomingTasks - Expandable list with modal, flip effect for overdue, priority effects
import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown, X, AlertTriangle } from 'lucide-react';
import type { Task } from '../../domain/types';
import { startOfDay, endOfDay, differenceInMinutes } from 'date-fns';
import { clsx } from 'clsx';
import { useCategories } from '../../hooks/useCategories';
import { isOverdue } from '../../domain/dateUtils';

interface UpcomingTasksProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
}

// Get minutes until task starts (or deadline for all-day)
const getMinutesUntilStart = (task: Task): number => {
    if (!task.startDate) return 999999;
    const now = new Date();
    const [year, month, day] = task.startDate.split('-').map(Number);
    const [hours, minutes] = task.startTime
        ? task.startTime.split(':').map(Number)
        : [23, 59];
    const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

    return differenceInMinutes(startDate, now);
};

// Format countdown
const formatCountdown = (minutes: number, task: Task): string => {
    if (minutes > 0) {
        if (minutes < 60) return `${minutes} dk`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours < 24) {
            if (mins === 0) return `${hours}s`;
            return `${hours}s ${mins}dk`;
        }
        const days = Math.floor(hours / 24);
        return `${days} gün`;
    }
    // Started earlier today
    if (task.startTime) return task.startTime.substring(0, 5);
    return 'Bugün';
};

// Check if task is today
const isTaskToday = (task: Task): boolean => {
    if (!task.startDate) return false;
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const taskDate = new Date(task.startDate);
    const endDate = task.endDate ? new Date(task.endDate) : taskDate;
    return (taskDate >= todayStart && taskDate <= todayEnd) || (endDate >= todayStart && endDate <= todayEnd);
};

// Normal task item (non-overdue)
const TaskItem: React.FC<{
    task: Task;
    getCategoryColor: (id: string) => string;
    onClick?: () => void;
}> = ({ task, getCategoryColor, onClick }) => {
    const minutes = getMinutesUntilStart(task);
    const isUrgent = minutes <= 60 && minutes >= 0;
    const isHighPriority = task.priority === 2;
    // Get category color using the hook function
    const categoryColor = task.color || getCategoryColor(task.category);

    return (
        <button
            onClick={onClick}
            className={clsx(
                "w-full flex items-center gap-3 p-3 rounded-[10px] transition-all text-left group relative overflow-hidden border",
                // High Priority styling overrides category styling with red effects
                isHighPriority
                    ? 'animate-pulse ring-1 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    : 'hover:shadow-md'
            )}
            style={{
                // Apply category color to background and border like WeekCalendar
                backgroundColor: isHighPriority ? 'rgba(15, 23, 42, 0.8)' : `${categoryColor}20`,
                borderColor: isHighPriority ? 'rgba(239, 68, 68, 0.3)' : `${categoryColor}50`,
                boxShadow: isHighPriority ? '0 0 20px rgba(239, 68, 68, 0.3)' : undefined
            }}
        >
            {/* Left border indicator like WeekCalendar */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[10px]"
                style={{ backgroundColor: isHighPriority ? '#ef4444' : categoryColor }}
            />

            <div className={clsx(
                "min-w-[52px] px-2 py-1 rounded-md text-center text-[11px] font-bold z-10 shrink-0",
                isUrgent && !isHighPriority
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-800/50 text-slate-400'
            )}>
                {formatCountdown(minutes, task)}
            </div>

            <div className="flex-1 min-w-0 z-10 flex items-center gap-2">
                {isHighPriority && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <p className={clsx(
                    "text-[13px] truncate transition-colors flex-1",
                    isHighPriority ? 'text-slate-100 font-medium' : 'text-slate-200 group-hover:text-slate-100'
                )}>
                    {task.title}
                </p>
                {task.startTime && (
                    <span className="text-[11px] text-slate-400 shrink-0">
                        {task.startTime.substring(0, 5)}
                    </span>
                )}
            </div>
        </button>
    );
};

// Overdue task item with flip effect (Cyan Glow Style)
const OverdueTaskItem: React.FC<{
    task: Task;
    getCategoryColor: (id: string) => string;
    onClick?: () => void;
}> = ({ task, getCategoryColor, onClick }) => {
    // Get category color using the hook function
    const categoryColor = task.color || getCategoryColor(task.category);

    return (
        <div
            onClick={onClick}
            className="overdue-flip-container cursor-pointer h-12 w-full outline-none group"
            tabIndex={0}
        >
            <div className="overdue-flip-inner h-full">
                {/* Front side - Cyan/Blue Glow with category background */}
                <div
                    className="overdue-flip-front w-full h-full flex items-center gap-3 p-3 rounded-[10px] border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.15)] relative overflow-hidden"
                    style={{ backgroundColor: `${categoryColor}20` }}
                >
                    {/* Glowing bar - Cyan for overdue */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-l-[10px]" />

                    <div className="min-w-[52px] px-2 py-1 rounded-md text-center text-[11px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/20 shrink-0">
                        Geçti
                    </div>

                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 overdue-icon-sad" />
                        <p className="text-[13px] truncate text-slate-200 font-medium flex-1">
                            {task.title}
                        </p>
                    </div>
                </div>

                {/* Back side - Flip Message */}
                <div className="overdue-flip-back w-full h-full flex items-center justify-center p-3 rounded-[10px] bg-slate-900 border border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <p className="text-sm text-cyan-400 font-bold">Beni unuttun mu? 😢</p>
                </div>
            </div>
        </div>
    );
};

export const UpcomingTasks: React.FC<UpcomingTasksProps> = ({
    tasks,
    onTaskClick,
}) => {
    const [, setTick] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Use the hook to get category colors
    const { getCategoryColor } = useCategories();

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    // Filter and sort - priority first, then by time
    const upcomingTasks = tasks
        .filter(task => {
            if (task.status === 'done' || task.status === 'cancelled' || !task.startDate) return false;
            const minutes = getMinutesUntilStart(task);
            const todayTask = isTaskToday(task);
            const isUpcomingWithin12h = minutes >= 0 && minutes <= 720;
            return todayTask || isUpcomingWithin12h;
        })
        .sort((a, b) => {
            // Priority first (High ID:2 > Low ID:1 > Normal ID:0)
            if (a.priority !== b.priority) {
                return (b.priority || 0) - (a.priority || 0);
            }
            // Then by start time
            return getMinutesUntilStart(a) - getMinutesUntilStart(b);
        });

    const visibleTasks = upcomingTasks.slice(0, 3);
    const hasMore = upcomingTasks.length > 3;

    // Render task
    const renderTask = (task: Task, onClick?: () => void) => {
        const isTaskOverdue = isOverdue(task);

        if (isTaskOverdue) {
            return <OverdueTaskItem key={task.id} task={task} getCategoryColor={getCategoryColor} onClick={onClick} />;
        }
        return <TaskItem key={task.id} task={task} getCategoryColor={getCategoryColor} onClick={onClick} />;
    };

    return (
        <>
            <div className="p-4 rounded-[14px] bg-slate-800/50 border border-slate-600/30">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-[13px] font-medium text-slate-200">Yaklaşanlar</h3>
                        {upcomingTasks.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 text-[11px] font-medium">
                                {upcomingTasks.length}
                            </span>
                        )}
                    </div>
                    {hasMore && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                            title="Tümünü Gör"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {upcomingTasks.length === 0 ? (
                    <div className="py-6 text-center">
                        <p className="text-[13px] text-slate-500">Bugün yaklaşan görev yok</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {visibleTasks.map(task => renderTask(task, () => onTaskClick?.(task)))}
                    </div>
                )}
            </div>

            {/* Modal for all upcoming tasks */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsModalOpen(false);
                    }}
                >
                    <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-fadeIn max-h-[80vh] flex flex-col overflow-hidden">
                        {/* Sticky Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 shrink-0">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-cyan-400" />
                                <h2 className="text-lg font-semibold text-slate-100">Yaklaşanlar</h2>
                                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 text-[12px] font-medium">
                                    {upcomingTasks.length} tanesinin son günü bugün
                                </span>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-4 overflow-y-auto min-h-0 space-y-2">
                            {upcomingTasks.map(task => renderTask(task, () => {
                                setIsModalOpen(false);
                                onTaskClick?.(task);
                            }))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
