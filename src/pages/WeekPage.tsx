// WeekPage - Weekly calendar view
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/nav/TopBar';
import { WeekCalendar } from '../components/calendar/WeekCalendar';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import { useTasks } from '../hooks/useTasks';
import { useSettings } from '../hooks/useSettings';
import { navigation, formatDate, getWeekRange, isTaskInRange, toDateString, differenceInDays, parseISO, addDays } from '../domain/dateUtils';
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

    const { tasks, createTask, createTasksBatch, updateTask, deleteTask, updateTaskStatus } = useTasks({
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

    // Keep showCompleted in sync with settings default
    useEffect(() => {
        setShowCompleted(settings.showCompletedByDefault);
    }, [settings.showCompletedByDefault]);

    const handlePrev = () => setCurrentDate(navigation.prevWeek(currentDate));
    const handleNext = () => setCurrentDate(navigation.nextWeek(currentDate));
    const handleToday = () => setCurrentDate(new Date());

    const handleDayClick = (day: Date) => {
        // Navigate to today page with the selected date
        navigate('/today', { state: { selectedDate: day.toISOString() } });
    };

    const handleTaskDrop = async (taskId: string, targetDate: Date) => {
        const dateStr = toDateString(targetDate);
        const task = tasks.find(t => t.id === taskId);
        if (task && task.startDate) {
            let newEndDate: string | undefined = undefined;
            if (task.endDate && task.startDate !== task.endDate) {
                const durationDays = differenceInDays(parseISO(task.endDate), parseISO(task.startDate));
                newEndDate = toDateString(addDays(targetDate, durationDays));
            }
            await updateTask(taskId, {
                startDate: dateStr,
                endDate: newEndDate
            });
        }
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

    const handleCreateTasksBatch = async (tasksData: TaskFormData[]) => {
        await createTasksBatch(tasksData.map(d => ({
            ...d,
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

            <div className="flex-1 flex overflow-hidden">
                {/* Calendar - Full Width */}
                <div className="flex-1 overflow-hidden glass-panel m-2 md:m-4">
                    <WeekCalendar
                        date={currentDate}
                        tasks={weekTasks}
                        weekStartsOn={settings.weekStartsOn}
                        onTaskClick={setSelectedTask}
                        onDayClick={handleDayClick}
                        onTaskDrop={handleTaskDrop}
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
                                setSelectedTask(null);
                            }}
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
