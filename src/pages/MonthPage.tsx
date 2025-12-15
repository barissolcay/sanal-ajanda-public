// MonthPage - Monthly calendar view
import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { TopBar } from '../components/nav/TopBar';
import { MonthCalendar } from '../components/calendar/MonthCalendar';
import { TaskList } from '../components/tasks/TaskList';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import { useTasks } from '../hooks/useTasks';
import { useSettings } from '../hooks/useSettings';
import { navigation, formatDate, getMonthRange, isTaskInRange, isTaskOnDate } from '../domain/dateUtils';
import type { Task } from '../domain/types';

export const MonthPage: React.FC = () => {
    const { settings } = useSettings();
    const [showCompleted, setShowCompleted] = useState(settings.showCompletedByDefault);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const { tasks, createTask, updateTask, deleteTask, updateTaskStatus } = useTasks({
        showCompleted,
    });

    const monthRange = useMemo(() => getMonthRange(currentDate), [currentDate]);

    // Filter tasks for current month
    const monthTasks = useMemo(() => {
        let filtered = tasks.filter(task =>
            isTaskInRange(task, monthRange.start, monthRange.end)
        );

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [tasks, monthRange, searchQuery]);

    // Tasks for selected date
    const selectedDateTasks = useMemo(() => {
        if (!selectedDate) return [];
        return monthTasks.filter(task => isTaskOnDate(task, selectedDate));
    }, [monthTasks, selectedDate]);

    React.useEffect(() => {
        setShowCompleted(settings.showCompletedByDefault);
    }, [settings.showCompletedByDefault]);

    const handlePrev = () => setCurrentDate(navigation.prevMonth(currentDate));
    const handleNext = () => setCurrentDate(navigation.nextMonth(currentDate));
    const handleToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setSelectedTask(null);
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

    const handleTaskStatusChange = async (taskId: string, status: Task['status']) => {
        await updateTaskStatus(taskId, status);
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar
                title="Bu Ay"
                subtitle={formatDate(currentDate, 'MMMM yyyy')}
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
                {/* Calendar and Task List */}
                <div className="flex-1 flex flex-col overflow-hidden m-2 md:m-4 md:mr-2 gap-3">
                    {/* Calendar */}
                    <div className="flex-1 glass-panel overflow-hidden">
                        <MonthCalendar
                            date={currentDate}
                            tasks={monthTasks}
                            weekStartsOn={settings.weekStartsOn}
                            selectedDate={selectedDate}
                            onDayClick={handleDayClick}
                            onTaskClick={setSelectedTask}
                        />
                    </div>

                    {/* Selected date tasks - Mobile: Always visible below calendar if date selected. Desktop: Below calendar */}
                    {selectedDate && (
                        <div className="h-48 glass-panel p-4 overflow-hidden shrink-0">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3">
                                {formatDate(selectedDate, 'd MMMM yyyy, EEEE')} – {selectedDateTasks.length} görev
                            </h3>
                            <div className="overflow-y-auto h-[calc(100%-2rem)]">
                                <TaskList
                                    tasks={selectedDateTasks}
                                    selectedTaskId={selectedTask?.id}
                                    onTaskSelect={setSelectedTask}
                                    onStatusChange={handleTaskStatusChange}
                                    emptyMessage="Bu günde görev yok"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Detail Panel - Mobile: Overlay or Stacked? Stacked might be too tall. Let's make it an overlay/modal style on mobile or just stack if space permits.
                   Actually, user said "design is useful on computer but not on mobile".
                   A side panel on mobile usually pops up as a bottom sheet or full screen.
                   For simplicity and speed, let's use the existing panel styling but position it differently or show it conditionally/overlay on mobile.
                   
                   Let's make it a fixed overlay on mobile when a task is selected.
                */}
                <div
                    className={clsx(
                        "transition-all duration-300 ease-in-out z-30",
                        // Desktop: static width side panel
                        "md:w-80 md:m-4 md:ml-2 md:static",
                        // Mobile: fixed full screen or bottom sheet styling
                        selectedTask ? "fixed inset-0 bg-slate-950/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none" : "hidden md:block md:w-0 md:m-0 md:opacity-0 md:overflow-hidden"
                    )}
                    onClick={(e) => {
                        // Close if clicking backdrop on mobile
                        if (window.innerWidth < 768 && e.target === e.currentTarget) {
                            setSelectedTask(null);
                        }
                    }}
                >
                    <div className={clsx(
                        "h-full glass-panel overflow-hidden flex flex-col transition-transform duration-300",
                        // Mobile: Slide up/center or just standard panel
                        "w-full h-full md:h-full md:w-80",
                        // Mobile Padding/Margin adjustments
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
