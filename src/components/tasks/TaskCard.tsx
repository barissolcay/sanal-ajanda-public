// TaskCard Component - Premium Enhanced
import React from 'react';
import { clsx } from 'clsx';
import { Clock, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import type { Task } from '../../domain/types';
import { PRIORITY_INFO } from '../../domain/types';
import { formatDateRange, formatTimeRange, isOverdue, hasTime } from '../../domain/dateUtils';

export interface TaskCardProps {
    task: Task;
    selected?: boolean;
    onClick?: () => void;
    onStatusChange?: (status: Task['status']) => void;
    getCategoryById?: (id: string) => any;
    getCategoryColor?: (id: string) => string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    selected = false,
    onClick,
    onStatusChange,
    getCategoryById,
    getCategoryColor,
}) => {
    const overdue = isOverdue(task);

    // Dinamik kategorilerden bilgi al
    const category = getCategoryById?.(task.category);
    const categoryLabel = category?.name || task.category;
    const categoryColor = task.color || getCategoryColor?.(task.category) || '#64748b';

    const priorityInfo = PRIORITY_INFO[task.priority];
    const showTime = hasTime(task);
    const isHighPriority = task.priority === 2 && task.status !== 'done';

    const handleCheckboxChange = (checked: boolean) => {
        if (onStatusChange) {
            onStatusChange(checked ? 'done' : 'pending');
        }
    };

    const badgeStyle: React.CSSProperties = {
        backgroundColor: `${categoryColor}20`,
        borderColor: `${categoryColor}40`,
        color: categoryColor,
    };

    // Standard render function for the card content
    const renderCardContent = () => (
        <div
            className={clsx(
                'group relative rounded-xl bg-slate-900/80 border px-4 py-3 flex gap-3 items-start',
                'transition-all duration-300 ease-out h-full',
                !overdue && 'hover:-translate-y-1 hover:shadow-xl cursor-pointer',
                selected
                    ? 'border-indigo-500/60 ring-2 ring-indigo-500/30 shadow-glow-sm'
                    : 'border-slate-700/60 hover:border-slate-600/60 hover:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)]',
                task.status === 'done' && 'opacity-60',
                isHighPriority && 'animate-pulse ring-1 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-500/30'
            )}
            style={{
                boxShadow: isHighPriority && !selected
                    ? '0 0 20px rgba(239, 68, 68, 0.3)'
                    : overdue && task.status !== 'done'
                        ? '0 0 20px rgba(34, 211, 238, 0.4)'
                        : selected
                            ? `0 0 20px ${categoryColor}20`
                            : undefined
            }}
        >
            {/* Overdue indicator bar */}
            {overdue && (
                <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-600" />
            )}

            {/* Status checkbox */}
            <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    variant="task"
                    checked={task.status === 'done'}
                    onChange={handleCheckboxChange}
                />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {/* Overdue clock icon */}
                        {overdue && task.status !== 'done' && (
                            <Clock className="w-4 h-4 text-cyan-400 shrink-0 overdue-icon-sad" />
                        )}
                        {/* High priority icon */}
                        {task.priority === 2 && task.status !== 'done' && (
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                        )}
                        <h3
                            className={clsx(
                                'font-medium text-slate-100 truncate',
                                task.status === 'done' && 'line-through text-slate-400'
                            )}
                        >
                            {task.title}
                        </h3>
                    </div>

                    {/* Priority indicator (low priority only) */}
                    {task.priority === 1 && (
                        <span className={clsx('text-sm flex items-center', priorityInfo.color)}>
                            {priorityInfo.icon}
                        </span>
                    )}
                </div>

                {/* Description preview */}
                {task.description && (
                    <p className="text-sm text-slate-400 truncate mt-1">
                        {task.description}
                    </p>
                )}

                {/* Date and time */}
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <div className={clsx('flex items-center gap-1', overdue && 'text-red-400')}>
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{formatDateRange(task.startDate, task.endDate)}</span>
                    </div>

                    {showTime && (
                        <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTimeRange(task.startTime, task.endTime)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Category badge */}
            <Badge variant="custom" className="border" style={badgeStyle}>
                {categoryLabel}
            </Badge>
        </div>
    );

    if (overdue && task.status !== 'done') {
        return (
            <div
                onClick={onClick}
                className="overdue-flip-container cursor-pointer h-24 w-full outline-none"
                tabIndex={0}
                role="button"
            >
                <div className="overdue-flip-inner">
                    {/* Front */}
                    <div className="overdue-flip-front">
                        {renderCardContent()}
                    </div>

                    {/* Back */}
                    <div className="overdue-flip-back rounded-xl bg-slate-900 border border-cyan-500/50 flex items-center justify-center p-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                        <span className="text-lg font-bold text-cyan-400 animate-pulse">😭 Unuttun mu beni?!</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div onClick={onClick}>
            {renderCardContent()}
        </div>
    );
};
