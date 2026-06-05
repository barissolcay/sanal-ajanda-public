// TaskList Component
import React from 'react';
import { TaskCard } from './TaskCard';
import type { Task } from '../../domain/types';
import { ClipboardList } from 'lucide-react';

export interface TaskListProps {
    tasks: Task[];
    selectedTaskId?: string;
    onTaskSelect?: (task: Task) => void;
    onStatusChange?: (taskId: string, status: Task['status']) => void;
    emptyMessage?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
    tasks,
    selectedTaskId,
    onTaskSelect,
    onStatusChange,
    emptyMessage = 'Görev bulunamadı',
}) => {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <ClipboardList className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-1">
            {tasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    selected={task.id === selectedTaskId}
                    onClick={() => onTaskSelect?.(task)}
                    onStatusChange={(status) => onStatusChange?.(task.id, status)}
                />
            ))}
        </div>
    );
};
