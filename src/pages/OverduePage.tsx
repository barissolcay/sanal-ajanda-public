// OverduePage - Sessiz Çığlıklar: Overdue incomplete tasks
import React, { useState, useMemo } from 'react';
import { startOfDay, subDays } from 'date-fns';
import { AlertCircle, Clock } from 'lucide-react';
import { TopBar } from '../components/nav/TopBar';
import { TaskList } from '../components/tasks/TaskList';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { useTasks } from '../hooks/useTasks';
import { isOverdue } from '../domain/dateUtils';
import type { Task } from '../domain/types';

export const OverduePage: React.FC = () => {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { tasks, updateTask, deleteTask, updateTaskStatus } = useTasks({
        showCompleted: false, // Only show incomplete tasks
    });

    // Get today's start (for grouping purposes)
    const today = startOfDay(new Date());

    // Filter overdue tasks using the same isOverdue function as Sidebar
    // This includes tasks whose end time has passed, even on the same day
    const overdueTasks = useMemo(() => {
        return tasks.filter(task => isOverdue(task)).sort((a, b) => {
            // Sort by date, most recent first
            const dateA = new Date(a.endDate || a.startDate || '');
            const dateB = new Date(b.endDate || b.startDate || '');
            return dateB.getTime() - dateA.getTime();
        });
    }, [tasks]);

    // Filter by search
    const filteredTasks = useMemo(() => {
        if (!searchQuery) return overdueTasks;
        const query = searchQuery.toLowerCase();
        return overdueTasks.filter(task =>
            task.title.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query)
        );
    }, [overdueTasks, searchQuery]);

    // Group tasks by how old they are
    const groupedTasks = useMemo(() => {
        const yesterday = subDays(today, 1);
        const lastWeek = subDays(today, 7);
        const lastMonth = subDays(today, 30);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const groups: { label: string; tasks: Task[] }[] = [];

        // Tasks from today (time has passed but date is still today)
        const todayTasks = filteredTasks.filter(t => {
            if (!t.startDate && !t.endDate) return false;
            const taskDate = startOfDay(new Date(t.endDate || t.startDate || ''));
            return taskDate >= today && taskDate < tomorrow;
        });

        const yesterdayTasks = filteredTasks.filter(t => {
            if (!t.startDate && !t.endDate) return false;
            const taskDate = startOfDay(new Date(t.endDate || t.startDate || ''));
            return taskDate >= yesterday && taskDate < today;
        });

        const lastWeekTasks = filteredTasks.filter(t => {
            if (!t.startDate && !t.endDate) return false;
            const taskDate = startOfDay(new Date(t.endDate || t.startDate || ''));
            return taskDate >= lastWeek && taskDate < yesterday;
        });

        const lastMonthTasks = filteredTasks.filter(t => {
            if (!t.startDate && !t.endDate) return false;
            const taskDate = startOfDay(new Date(t.endDate || t.startDate || ''));
            return taskDate >= lastMonth && taskDate < lastWeek;
        });

        const olderTasks = filteredTasks.filter(t => {
            if (!t.startDate && !t.endDate) return false;
            const taskDate = startOfDay(new Date(t.endDate || t.startDate || ''));
            return taskDate < lastMonth;
        });

        if (todayTasks.length > 0) {
            groups.push({ label: 'Bugün', tasks: todayTasks });
        }
        if (yesterdayTasks.length > 0) {
            groups.push({ label: 'Dün', tasks: yesterdayTasks });
        }
        if (lastWeekTasks.length > 0) {
            groups.push({ label: 'Geçen Hafta', tasks: lastWeekTasks });
        }
        if (lastMonthTasks.length > 0) {
            groups.push({ label: 'Geçen Ay', tasks: lastMonthTasks });
        }
        if (olderTasks.length > 0) {
            groups.push({ label: 'Daha Eski', tasks: olderTasks });
        }

        return groups;
    }, [filteredTasks, today]);

    const handleUpdateTask = async (data: TaskFormData) => {
        if (editingTask) {
            await updateTask(editingTask.id, {
                ...data,
                color: (data.color || null) as any,
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
            setSelectedTask(null);
        }
    };

    const handleTaskStatusChange = async (taskId: string, status: Task['status']) => {
        await updateTaskStatus(taskId, status);
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar
                title="Sessiz Çığlıklar"
                subtitle={`${overdueTasks.length} unutulmuş görev`}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-4">
                    {filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <AlertCircle className="w-16 h-16 mb-4 opacity-30" />
                            <p className="text-lg font-medium">Hiç unutulan görev yok!</p>
                            <p className="text-sm mt-1">Tüm görevleriniz güncel görünüyor 🎉</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* Warning banner */}
                            <div className="glass-panel p-4 border-l-4 border-amber-500 bg-amber-500/10">
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm text-slate-200 font-medium">
                                            Bu görevlerin süresi geçmiş
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Tarihini güncelle, tamamla veya artık gerekli değilse sil.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Grouped tasks */}
                            {groupedTasks.map((group) => (
                                <div key={group.label} className="space-y-3">
                                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide px-1">
                                        {group.label}
                                        <span className="ml-2 text-slate-600">({group.tasks.length})</span>
                                    </h3>
                                    <div className="glass-panel p-3">
                                        <TaskList
                                            tasks={group.tasks}
                                            selectedTaskId={selectedTask?.id}
                                            onTaskSelect={setSelectedTask}
                                            onStatusChange={handleTaskStatusChange}
                                            emptyMessage="Görev yok"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedTask(null);
                    }}
                >
                    <div className="w-full max-w-md max-h-[80vh] overflow-y-auto glass-panel p-0 animate-fadeIn">
                        <TaskDetailPanel
                            task={selectedTask}
                            onClose={() => setSelectedTask(null)}
                            onEdit={() => setEditingTask(selectedTask)}
                            onDelete={handleDeleteTask}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
                </div>
            )}

            <TaskFormModal
                open={!!editingTask}
                task={editingTask}
                onClose={() => setEditingTask(null)}
                onSubmit={handleUpdateTask}
            />
        </div>
    );
};
