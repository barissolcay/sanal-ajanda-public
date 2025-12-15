// WeekPage - Weekly calendar view
import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/nav/TopBar';
import { WeekCalendar } from '../components/calendar/WeekCalendar';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import { useTasks } from '../hooks/useTasks';
import { useSettings } from '../hooks/useSettings';
import { navigation, formatDate, getWeekRange, isTaskInRange } from '../domain/dateUtils';
import type { Task } from '../domain/types';

export const WeekPage: React.FC = () => {
    const navigate = useNavigate();
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

    const weekRange = useMemo(() =>
        getWeekRange(currentDate, settings.weekStartsOn),
        [currentDate, settings.weekStartsOn]
    );

    // Filter tasks for current week
    const weekTasks = useMemo(() => {
        let filtered = tasks.filter(task =>
            isTaskInRange(task, weekRange.start, weekRange.end)
        );

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [tasks, weekRange, searchQuery]);

    React.useEffect(() => {
        setShowCompleted(settings.showCompletedByDefault);
    }, [settings.showCompletedByDefault]);

    const handlePrev = () => setCurrentDate(navigation.prevWeek(currentDate));
    const handleNext = () => setCurrentDate(navigation.nextWeek(currentDate));
    const handleToday = () => setCurrentDate(new Date());

    const handleDayClick = () => {
        // Navigate to today page
        navigate('/');
    };

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

    const weekSubtitle = `${formatDate(weekRange.start, 'd MMM')} – ${formatDate(weekRange.end, 'd MMM yyyy')}`;

    return (
        <div className="flex flex-col h-full">
            <TopBar
                title="Bu Hafta"
                subtitle={weekSubtitle}
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
                    <WeekCalendar
                        date={currentDate}
                        tasks={weekTasks}
                        weekStartsOn={settings.weekStartsOn}
                        onTaskClick={setSelectedTask}
                        onDayClick={handleDayClick}
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
                            onEdit={() => setEditingTask(selectedTask)}
                            onDelete={handleDeleteTask}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
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
