// ListsPage - Category-filtered task lists
import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { useParams } from 'react-router-dom';
import { TopBar } from '../components/nav/TopBar';
import { TaskList } from '../components/tasks/TaskList';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import { useTasks } from '../hooks/useTasks';
import { useSettings } from '../hooks/useSettings';
import { useCategories } from '../hooks/useCategories';
import type { Task } from '../domain/types';

export const ListsPage: React.FC = () => {
    const { category } = useParams<{ category?: string }>();
    const { settings } = useSettings();
    const { categories } = useCategories();
    const [showCompleted, setShowCompleted] = useState(settings.showCompletedByDefault);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [activeTab, setActiveTab] = useState<string>(category || 'all');

    const { tasks, createTask, createTasksBatch, updateTask, deleteTask, updateTaskStatus } = useTasks({
        showCompleted,
        hideOverdue: true, // Hide overdue tasks from lists - they show in 'Sessiz Çığlıklar'
    });

    // Filter tasks by category or undated status
    const filteredTasks = useMemo(() => {
        let filtered = tasks;

        if (activeTab === 'undated') {
            filtered = filtered.filter(t => !t.startDate);
        } else if (activeTab !== 'all') {
            filtered = filtered.filter(t => t.category === activeTab);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        // Sort by date (safe for undefined)
        return filtered.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
    }, [tasks, activeTab, searchQuery]);

    // Update activeTab when route changes
    React.useEffect(() => {
        if (category) {
            setActiveTab(category);
        } else {
            setActiveTab('all');
        }
    }, [category]);

    React.useEffect(() => {
        setShowCompleted(settings.showCompletedByDefault);
    }, [settings.showCompletedByDefault]);

    const handleCreateTask = async (data: TaskFormData) => {
        await createTask({
            ...data,
            category: (activeTab === 'all' || activeTab === 'undated') ? data.category : activeTab,
            startDate: activeTab === 'undated' && !data.startDate ? undefined : data.startDate,
            color: (data.color || null) as any,
            endDate: data.endDate || undefined,
            startTime: data.startTime || undefined,
            endTime: data.endTime || undefined,
        });
        setIsFormOpen(false);
    };

    const handleCreateTasksBatch = async (tasksData: TaskFormData[]) => {
        await createTasksBatch(tasksData.map(d => ({
            ...d,
            category: (activeTab === 'all' || activeTab === 'undated') ? d.category : activeTab,
            startDate: activeTab === 'undated' && !d.startDate ? undefined : d.startDate,
            color: (d.color || null) as any,
            endDate: d.endDate || undefined,
            startTime: d.startTime || undefined,
            endTime: d.endTime || undefined,
        })));
        setIsFormOpen(false);
    };

    const handleUpdateTask = async (data: TaskFormData) => {
        if (editingTask) {
            await updateTask(editingTask.id, {
                ...data,
                color: (data.color || null) as any, // Pass null to clear in DB (not undefined which skips update)
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
            setSelectedTask({ ...selectedTask, status });
        }
    };

    const handleTaskStatusChange = async (taskId: string, status: Task['status']) => {
        await updateTaskStatus(taskId, status);
    };

    // Generate tabs from dynamic categories - sorted like sidebar (defaults first, custom last)
    const sortedCategories = [...categories].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.order - b.order;
    });

    const tabs = [
        { id: 'all', label: 'Tümü', color: '#64748b' },
        { id: 'undated', label: 'Planlar / Süresiz', color: '#06b6d4' },
        ...sortedCategories.map(cat => ({
            id: cat.id,
            label: cat.name.replace(' Listesi', ''),
            color: cat.color,
        })),
    ];

    // Get current category name for title
    const currentCategory = categories.find(c => c.id === activeTab);
    const pageTitle = activeTab === 'all'
        ? 'Tüm Listeler'
        : activeTab === 'undated'
            ? 'Planlar / Süresiz Görevler'
            : (currentCategory?.name || 'Liste');

    return (
        <div className="flex flex-col h-full">
            <TopBar
                title={pageTitle}
                subtitle={`${filteredTasks.length} görev`}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                showCompleted={showCompleted}
                onShowCompletedChange={setShowCompleted}
                onNewTask={() => setIsFormOpen(true)}
            />

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Main content */}
                <div className="flex-1 flex flex-col overflow-hidden m-2 md:m-4 md:mr-2">
                    {/* Tabs - Premium styled */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 md:pb-0 md:flex-wrap scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap',
                                    'hover:scale-[1.02] hover:shadow-md',
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-indigo-500/40 to-cyan-400/30 text-slate-50 shadow-lg border border-indigo-400/40'
                                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-50 border border-slate-700/40'
                                )}
                                style={activeTab !== tab.id ? { borderLeftColor: tab.color, borderLeftWidth: '3px' } : undefined}
                            >
                                <span className="flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: tab.color }}
                                    />
                                    {tab.label}
                                </span>
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
                            emptyMessage="Bu kategoride görev yok"
                        />
                    </div>
                </div>
            </div>

            {/* Task Detail Modal - Full screen overlay like MonthPage */}
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
                open={isFormOpen || !!editingTask}
                task={editingTask}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingTask(null);
                }}
                onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                onSubmitBatch={handleCreateTasksBatch}
            />
        </div>
    );
};
