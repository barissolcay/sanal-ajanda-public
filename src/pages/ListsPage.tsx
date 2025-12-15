// ListsPage - Category-filtered task lists
import React, { useState, useMemo } from 'react';
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

    const { tasks, createTask, updateTask, deleteTask, updateTaskStatus } = useTasks({
        showCompleted,
    });

    // Filter tasks by category
    const filteredTasks = useMemo(() => {
        let filtered = tasks;

        if (activeTab !== 'all') {
            filtered = filtered.filter(t => t.category === activeTab);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        // Sort by date
        return filtered.sort((a, b) => a.startDate.localeCompare(b.startDate));
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
            category: activeTab === 'all' ? data.category : activeTab,
            color: data.color || undefined,
            endDate: data.endDate || undefined,
            startTime: data.startTime || undefined,
            endTime: data.endTime || undefined,
        });
        setIsFormOpen(false);
    };

    const handleUpdateTask = async (data: TaskFormData) => {
        if (editingTask) {
            await updateTask(editingTask.id, {
                ...data,
                color: data.color || undefined,
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

    // Generate tabs from dynamic categories
    const tabs = [
        { id: 'all', label: 'Tümü', color: '#64748b' },
        ...categories.map(cat => ({
            id: cat.id,
            label: cat.name.replace(' Listesi', '').replace('Okuma', 'Okuma').replace('İzleme', 'İzleme'),
            color: cat.color,
        })),
    ];

    // Get current category name for title
    const currentCategory = categories.find(c => c.id === activeTab);
    const pageTitle = activeTab === 'all' ? 'Tüm Listeler' : (currentCategory?.name || 'Liste');

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

            <div className="flex-1 flex overflow-hidden">
                {/* Main content */}
                <div className="flex-1 flex flex-col overflow-hidden m-4 mr-2">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-indigo-500/40 to-cyan-400/30 text-slate-50 shadow-lg border border-indigo-400/40'
                                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-50 border border-transparent'
                                    }`}
                                style={activeTab !== tab.id ? { borderLeftColor: tab.color, borderLeftWidth: '3px' } : undefined}
                            >
                                {tab.label}
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

                {/* Detail Panel */}
                <div className="w-80 m-4 ml-2">
                    <TaskDetailPanel
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onEdit={() => setEditingTask(selectedTask)}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                    />
                </div>
            </div>

            <TaskFormModal
                open={isFormOpen || !!editingTask}
                task={editingTask}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingTask(null);
                }}
                onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            />
        </div>
    );
};
