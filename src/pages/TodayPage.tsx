// TodayPage - Daily calendar view
import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
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
                onPrev={handlePrev}
                onNext={handleNext}
                onToday={handleToday}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                showCompleted={showCompleted}
                onShowCompletedChange={setShowCompleted}
                onNewTask={() => setIsFormOpen(true)}
            />

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Calendar */}
                <div className="flex-1 overflow-hidden glass-panel m-2 md:m-4 md:mr-2">
                    <DayCalendar
                        date={currentDate}
                        tasks={dayTasks}
                        onTaskClick={setSelectedTask}
                        selectedTaskId={selectedTask?.id}
                    />
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
                            onEdit={() => {
                                setEditingTask(selectedTask);
                            }}
                            onDelete={handleDeleteTask}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
                </div>
            </div>

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
