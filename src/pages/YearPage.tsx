// YearPage - Yearly overview
import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/nav/TopBar';
import { YearCalendar } from '../components/calendar/YearCalendar';
import { TaskList } from '../components/tasks/TaskList';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import { useTasks } from '../hooks/useTasks';
import { useSettings } from '../hooks/useSettings';
import { navigation, formatDate, getYearRange, getMonthRange, isTaskInRange } from '../domain/dateUtils';
import type { Task } from '../domain/types';

export const YearPage: React.FC = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [showCompleted, setShowCompleted] = useState(settings.showCompletedByDefault);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const { tasks, createTask, updateTaskStatus } = useTasks({
        showCompleted,
    });

    const yearRange = useMemo(() => getYearRange(currentDate), [currentDate]);

    // Filter tasks for current year
    const yearTasks = useMemo(() => {
        let filtered = tasks.filter(task =>
            isTaskInRange(task, yearRange.start, yearRange.end)
        );

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [tasks, yearRange, searchQuery]);

    // Tasks for selected month
    const selectedMonthTasks = useMemo(() => {
        if (!selectedMonth) return [];
        const monthRange = getMonthRange(selectedMonth);
        return yearTasks.filter(task => isTaskInRange(task, monthRange.start, monthRange.end));
    }, [yearTasks, selectedMonth]);

    React.useEffect(() => {
        setShowCompleted(settings.showCompletedByDefault);
    }, [settings.showCompletedByDefault]);

    const handlePrev = () => setCurrentDate(navigation.prevYear(currentDate));
    const handleNext = () => setCurrentDate(navigation.nextYear(currentDate));
    const handleToday = () => setCurrentDate(new Date());

    const handleMonthClick = (date: Date) => {
        setSelectedMonth(date);
    };

    const handleGoToMonth = () => {
        if (selectedMonth) {
            navigate('/month');
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

    const handleTaskStatusChange = async (taskId: string, status: Task['status']) => {
        await updateTaskStatus(taskId, status);
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar
                title="Bu Yıl"
                subtitle={formatDate(currentDate, 'yyyy')}
                showDateNav
                onPrev={handlePrev}
                onNext={handleNext}
                onToday={handleToday}
                showTodayButton={false}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                showCompleted={showCompleted}
                onShowCompletedChange={setShowCompleted}
                onNewTask={() => setIsFormOpen(true)}
            />

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Year Calendar */}
                <div className="flex-1 overflow-hidden glass-panel m-2 md:m-4 md:mr-2">
                    <YearCalendar
                        date={currentDate}
                        tasks={tasks}
                        weekStartsOn={settings.weekStartsOn}
                        selectedMonth={selectedMonth}
                        onMonthClick={handleMonthClick}
                    />
                </div>

                {/* Selected month tasks - Mobile: Overlay/Drawer style when selected */}
                <div
                    className={clsx(
                        "transition-all duration-300 ease-in-out z-30",
                        "md:w-80 md:m-4 md:ml-2 md:static glass-panel flex flex-col overflow-hidden",
                        selectedMonth ? "fixed inset-0 bg-slate-950/95 md:bg-transparent z-50 md:z-auto" : "hidden md:flex md:w-0 md:m-0 md:opacity-0"
                    )}
                >
                    {/* Mobile Close Button (only visible on mobile when open) */}
                    <div className="md:hidden p-4 border-b border-slate-800/60 flex justify-end">
                        <button
                            onClick={() => setSelectedMonth(null)}
                            className="text-slate-400 hover:text-white"
                        >
                            Kapat
                        </button>
                    </div>

                    {selectedMonth ? (
                        <>
                            <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
                                <div>
                                    <h3 className="font-semibold text-slate-100">
                                        {formatDate(selectedMonth, 'MMMM yyyy')}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        {selectedMonthTasks.length} görev
                                    </p>
                                </div>
                                <button
                                    onClick={handleGoToMonth}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                                >
                                    Aya Git
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <TaskList
                                    tasks={selectedMonthTasks}
                                    onTaskSelect={() => { }}
                                    onStatusChange={handleTaskStatusChange}
                                    emptyMessage="Bu ayda görev yok"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-center p-4">
                            <p className="text-sm">Görevleri görmek için bir ay seçin</p>
                        </div>
                    )}
                </div>
            </div>

            <TaskFormModal
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleCreateTask}
            />
        </div>
    );
};
