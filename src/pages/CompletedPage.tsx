// CompletedPage - Completed tasks view
import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { TopBar } from '../components/nav/TopBar';
import { TaskList } from '../components/tasks/TaskList';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../domain/types';
import { subDays, isAfter } from 'date-fns';
import { fromDateString } from '../domain/dateUtils';

type DateFilter = 'all' | 'week' | 'month';

export const CompletedPage: React.FC = () => {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const { tasks, updateTask, deleteTask, updateTaskStatus } = useTasks({
        showCompleted: true,
        status: 'done',
    });

    // Filter completed tasks
    const filteredTasks = useMemo(() => {
        let filtered = tasks.filter(t => t.status === 'done');

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const cutoff = dateFilter === 'week' ? subDays(now, 7) : subDays(now, 30);
            filtered = filtered.filter(t => {
                const taskDate = fromDateString(t.updatedAt.split('T')[0]);
                return isAfter(taskDate, cutoff);
            });
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        // Sort by completion date (updatedAt) descending
        return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }, [tasks, dateFilter, searchQuery]);

    const handleUpdateTask = async (data: TaskFormData) => {
        if (editingTask) {
            await updateTask(editingTask.id, {
                ...data,
                endDate: data.endDate || undefined,
                startTime: data.startTime || undefined,
                endTime: data.endTime || undefined,
            });
            setEditingTask(null);
            setSelectedTask(null);
        }
    };

    const handleDeleteTask = async () => {
        if (selectedTask) {
            await deleteTask(selectedTask.id);
            setSelectedTask(null);
        }
    };

    const handleStatusChange = async (status: Task['status']) => {
        if (selectedTask) {
            await updateTaskStatus(selectedTask.id, status);
            if (status !== 'done') {
                setSelectedTask(null); // Remove from view if unmarking as done
            } else {
                setSelectedTask({ ...selectedTask, status });
            }
        }
    };

    const handleTaskStatusChange = async (taskId: string, status: Task['status']) => {
        await updateTaskStatus(taskId, status);
    };

    const filterOptions = [
        { id: 'all' as const, label: 'Tümü' },
        { id: 'week' as const, label: 'Son 7 Gün' },
        { id: 'month' as const, label: 'Son 30 Gün' },
    ];

    return (
        <div className="flex flex-col h-full">
            <TopBar
                title="Tamamlananlar"
                subtitle={`${filteredTasks.length} görev tamamlandı`}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Main content */}
                <div className="flex-1 flex flex-col overflow-hidden m-2 md:m-4 md:mr-2">
                    {/* Filter buttons */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 md:pb-0 md:flex-wrap no-scrollbar">
                        {filterOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setDateFilter(option.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${dateFilter === option.id
                                    ? 'bg-gradient-to-r from-indigo-500/40 to-cyan-400/30 text-slate-50 shadow-lg border border-indigo-400/40'
                                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-50 border border-transparent'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Task list */}
                    <div className="flex-1 overflow-y-auto glass-panel p-4">
                        <TaskList
                            tasks={filteredTasks}
                            selectedTaskId={selectedTask?.id}
                            onTaskSelect={setSelectedTask}
                            onStatusChange={handleTaskStatusChange}
                            emptyMessage="Tamamlanan görev yok"
                        />
                    </div>
                </div>

                {/* Detail Panel - Mobile: Overlay */}
                <div
                    className={clsx(
                        "transition-all duration-300 ease-in-out z-30",
                        "md:w-80 md:m-4 md:ml-2 md:static block",
                        selectedTask ? "fixed inset-0 bg-slate-950/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none" : "hidden md:block md:w-0 md:m-0 md:opacity-0 md:overflow-hidden"
                    )}
                    onClick={(e) => {
                        if (window.innerWidth < 768 && e.target === e.currentTarget) {
                            setSelectedTask(null);
                        }
                    }}
                >
                    <div className={clsx(
                        "h-full glass-panel overflow-hidden flex flex-col transition-transform duration-300",
                        "w-full h-full md:h-full md:w-80",
                        "p-4 md:p-0"
                    )}>
                        <TaskDetailPanel
                            task={selectedTask}
                            onClose={() => setSelectedTask(null)}
                            onEdit={() => setEditingTask(selectedTask)}
                            onDelete={handleDeleteTask}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
                </div>
            </div>

            <TaskFormModal
                open={!!editingTask}
                task={editingTask}
                onClose={() => setEditingTask(null)}
                onSubmit={handleUpdateTask}
            />
        </div>
    );
};
