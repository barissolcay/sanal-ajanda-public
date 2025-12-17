// TodayPage - Daily calendar view
import React, { useState, useMemo } from 'react';
import { TopBar } from '../components/nav/TopBar';
import { DayCalendar } from '../components/calendar/DayCalendar';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import { useTasks } from '../hooks/useTasks';
import { useSettings } from '../hooks/useSettings';
import { navigation, formatDate, isTaskInRange } from '../domain/dateUtils';
import type { Task } from '../domain/types';

export const TodayPage: React.FC = () => {
    const { settings } = useSettings();
    const [showCompleted, setShowCompleted] = useState(settings.showCompletedByDefault);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const { tasks, createTask, updateTask, deleteTask, updateTaskStatus } = useTasks({
        showCompleted,
    });

    // Filter tasks for current day
    const dayTasks = useMemo(() => {
        // Calculate range for currentDate
        const start = new Date(currentDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(currentDate);
        end.setHours(23, 59, 59, 999);

        let filtered = tasks.filter(task => isTaskInRange(task, start, end));

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [tasks, currentDate, searchQuery]);

    // Update showCompleted when settings load
    React.useEffect(() => {
        setShowCompleted(settings.showCompletedByDefault);
    }, [settings.showCompletedByDefault]);

    const handlePrev = () => setCurrentDate(navigation.prevDay(currentDate));
    const handleNext = () => setCurrentDate(navigation.nextDay(currentDate));
    const handleToday = () => setCurrentDate(new Date());
    const handleYesterday = () => setCurrentDate(navigation.prevDay(new Date()));
    const handleTomorrow = () => setCurrentDate(navigation.nextDay(new Date()));

    const handleCreateTask = async (data: TaskFormData) => {
        await createTask({
            ...data,
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

    return (
        <div className="flex flex-col h-full">
            <TopBar
                title="Bugün"
                subtitle={formatDate(currentDate, 'dd MMMM yyyy, EEEE')}
                showDateNav
                showDailyNav
                onPrev={handlePrev}
                onNext={handleNext}
                onToday={handleToday}
                onYesterday={handleYesterday}
                onTomorrow={handleTomorrow}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                showCompleted={showCompleted}
                onShowCompletedChange={setShowCompleted}
                onNewTask={() => setIsFormOpen(true)}
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Calendar - Full Width */}
                <div className="flex-1 overflow-hidden glass-panel m-2 md:m-4">
                    <DayCalendar
                        date={currentDate}
                        tasks={dayTasks}
                        onTaskClick={setSelectedTask}
                        selectedTaskId={selectedTask?.id}
                    />
                </div>
            </div>

            {/* Task Detail Modal - Only shown when task is selected */}
            {selectedTask && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedTask(null);
                        }
                    }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" />

                    {/* Detail Panel */}
                    <div className="relative w-full max-w-md max-h-[85vh] glass-panel overflow-hidden animate-scaleIn">
                        <TaskDetailPanel
                            task={selectedTask}
                            onClose={() => setSelectedTask(null)}
                            onEdit={() => {
                                setEditingTask(selectedTask);
                            }}
                            onDelete={handleDeleteTask}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
                </div>
            )}

            {/* Form Modal */}
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
