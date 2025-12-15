// TaskCard Component
import React from 'react';
import { clsx } from 'clsx';
import { Clock, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import type { Task } from '../../domain/types';
import { CATEGORY_INFO, PRIORITY_INFO } from '../../domain/types';
import { formatDateRange, formatTimeRange, isOverdue, hasTime } from '../../domain/dateUtils';

export interface TaskCardProps {
    task: Task;
    selected?: boolean;
    onClick?: () => void;
    onStatusChange?: (status: Task['status']) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    selected = false,
    onClick,
    onStatusChange,
}) => {
    const overdue = isOverdue(task);
    const categoryInfo = CATEGORY_INFO[task.category];
    const priorityInfo = PRIORITY_INFO[task.priority];
    const showTime = hasTime(task);

    const handleCheckboxChange = (checked: boolean) => {
        if (onStatusChange) {
            onStatusChange(checked ? 'done' : 'pending');
        }
    };

    const badgeStyle = clsx(
        categoryInfo.bgColor,
        categoryInfo.color,
        `border-${categoryInfo.color.replace('text-', '')}/40`
    );

    return (
        <div
            onClick={onClick}
            className={clsx(
                'relative rounded-xl bg-slate-900/80 border px-4 py-3 flex gap-3 items-start cursor-pointer',
                'shadow-md hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200',
                selected
                    ? 'border-indigo-500/60 ring-2 ring-indigo-500/30'
                    : 'border-slate-700/60 hover:border-slate-600/60',
                task.status === 'done' && 'opacity-60'
            )}
        >
            {/* Overdue indicator */}
            {overdue && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-red-500" />
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
                    <h3
                        className={clsx(
                            'font-medium text-slate-100 truncate',
                            task.status === 'done' && 'line-through text-slate-400'
                        )}
                    >
                        {task.title}
                    </h3>

                    {/* Priority indicator */}
                    {task.priority !== 0 && (
                        <span className={clsx('text-sm flex items-center', priorityInfo.color)}>
                            {task.priority === 2 ? <AlertTriangle className="w-4 h-4" /> : priorityInfo.icon}
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
            <Badge variant="custom" className={badgeStyle}>
                {categoryInfo.label}
            </Badge>
        </div>
    );
};
