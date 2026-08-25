// YearPage - Yearly overview
import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/nav/TopBar';
import { YearCalendar } from '../components/calendar/YearCalendar';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { useTasks } from '../hooks/useTasks';
import { useSettings } from '../hooks/useSettings';
import { useCategories } from '../hooks/useCategories';
import { navigation, formatDate, getYearRange, getMonthRange, isTaskInRange, isSameMonth, isTaskOnDate, getMonthDays, sortTasksByPriority, isToday, isOverdue } from '../domain/dateUtils';
import type { Task } from '../domain/types';

export const YearPage: React.FC = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const [showCompleted, setShowCompleted] = useState(settings.showCompletedByDefault);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const { tasks, createTask, createTasksBatch, updateTask, deleteTask, updateTaskStatus } = useTasks({
        showCompleted,
    });
    const { getCategoryColor } = useCategories();

    // Get task style based on category color
    const getTaskStyle = (task: Task) => {
        const color = task.color || getCategoryColor(task.category);
        return {
            backgroundColor: `${color}30`,
            borderColor: `${color}60`,
        };
    };

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

    // Tasks for selected month - grouped by day with smart sorting
    const tasksByDay = useMemo(() => {
        if (!selectedMonth) return [];
        const monthRange = getMonthRange(selectedMonth);
        const monthTasks = yearTasks.filter(task => isTaskInRange(task, monthRange.start, monthRange.end));

        // Get all days in the month that have tasks
        const daysInMonth = getMonthDays(selectedMonth);
        const groupedDays: { date: Date; tasks: Task[]; sorted: ReturnType<typeof sortTasksByPriority> }[] = [];

        for (const day of daysInMonth) {
            const dayTasks = monthTasks.filter(task => isTaskOnDate(task, day));

            if (dayTasks.length > 0) {
                const sorted = sortTasksByPriority(dayTasks);
                groupedDays.push({ date: day, tasks: dayTasks, sorted });
            }
        }

        return groupedDays;
    }, [yearTasks, selectedMonth]);

    // Total task count
    const totalTaskCount = useMemo(() => {
        return tasksByDay.reduce((sum, day) => sum + day.tasks.length, 0);
    }, [tasksByDay]);

    React.useEffect(() => {
        setShowCompleted(settings.showCompletedByDefault);
    }, [settings.showCompletedByDefault]);

    const handlePrev = () => setCurrentDate(navigation.prevYear(currentDate));
    const handleNext = () => setCurrentDate(navigation.nextYear(currentDate));
    const handleToday = () => setCurrentDate(new Date());

    const handleMonthClick = (date: Date) => {
        if (selectedMonth && isSameMonth(date, selectedMonth)) {
            setSelectedMonth(null);
        } else {
            setSelectedMonth(date);
        }
    };

    const handleGoToMonth = () => {
        if (selectedMonth) {
            navigate('/month', { state: { selectedMonth: selectedMonth.toISOString() } });
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

    const handleTaskStatusChange = async (taskId: string, status: Task['status']) => {
        await updateTaskStatus(taskId, status);
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
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

            <div className="flex-1 flex overflow-hidden">
                {/* Year Calendar - Full Width */}
                <div className="flex-1 overflow-hidden glass-panel m-2 md:m-4">
                    <YearCalendar
                        date={currentDate}
                        tasks={yearTasks}
                        weekStartsOn={settings.weekStartsOn}
                        selectedMonth={selectedMonth}
                        onMonthClick={handleMonthClick}
                    />
                </div>
            </div>

            {/* Selected Month Modal - Only shown when month is selected */}
            {selectedMonth && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedMonth(null);
                        }
                    }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" />

                    {/* Month Tasks Panel */}
                    <div className="relative w-full max-w-md max-h-[85vh] glass-panel overflow-hidden flex flex-col animate-scaleIn">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
                            <div>
                                <h3 className="font-semibold text-slate-100">
                                    {formatDate(selectedMonth, 'MMMM yyyy')}
                                </h3>
                                <p className="text-sm text-slate-400">
                                    {totalTaskCount} görev, {tasksByDay.length} gün
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleGoToMonth}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                                >
                                    Aya Git
                                </button>
                                <button
                                    onClick={() => setSelectedMonth(null)}
                                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {tasksByDay.length === 0 ? (
                                <div className="flex items-center justify-center h-32 text-slate-500">
                                    Bu ayda görev yok
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/40">
                                    {tasksByDay.map(({ date, tasks: dayTasks, sorted }) => (
                                        <div key={date.toISOString()} className="p-3">
                                            {/* Day Header */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-semibold text-sm ${isToday(date)
                                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50'
                                                    : 'bg-slate-800/60 text-slate-300'
                                                    }`}>
                                                    {formatDate(date, 'd')}
                                                </div>
                                                <div>
                                                    <span className={`text-sm font-medium ${isToday(date) ? 'text-indigo-400' : 'text-slate-300'
                                                        }`}>
                                                        {formatDate(date, 'EEEE')}
                                                        {isToday(date) && <span className="ml-1 text-xs">(Bugün)</span>}
                                                    </span>
                                                    <span className="text-xs text-slate-500 ml-2">
                                                        {dayTasks.length} görev
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Day Tasks - Grouped by type */}
                                            <div className="ml-10 space-y-1">
                                                {/* Active tasks without time (all-day) */}
                                                {sorted.activeNoTime.map(task => {
                                                    const isHighPriority = task.priority === 2;
                                                    const taskStyle = getTaskStyle(task);
                                                    const overdueTask = isOverdue(task);

                                                    if (overdueTask) {
                                                        return (
                                                            <div
                                                                key={task.id}
                                                                onClick={() => handleTaskClick(task)}
                                                                className="overdue-flip-container cursor-pointer mb-2 outline-none min-h-[3rem]"
                                                                tabIndex={0}
                                                                role="button"
                                                            >
                                                                <div className="overdue-flip-inner">
                                                                    {/* Front */}
                                                                    <div
                                                                        className={clsx(
                                                                            'overdue-flip-front flex items-center gap-2 p-2 rounded-lg border border-l-4 border-l-cyan-400 bg-slate-900/80',
                                                                            isHighPriority && 'animate-pulse ring-1 ring-red-500/50'
                                                                        )}
                                                                        style={{
                                                                            backgroundColor: taskStyle.backgroundColor,
                                                                            borderColor: '#22d3ee',
                                                                            position: 'relative',
                                                                            height: 'auto',
                                                                            minHeight: '100%'
                                                                        }}
                                                                    >
                                                                        <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex items-center justify-center shrink-0" />
                                                                        <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                            <Clock className="w-3 h-3 text-cyan-400 shrink-0 overdue-icon-sad" />
                                                                            <span className="text-sm text-slate-200 break-words leading-tight">{task.title}</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Back */}
                                                                    <div className="overdue-flip-back rounded-lg text-sm font-bold">
                                                                        <span>😭 Unuttun mu beni?!</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={task.id}
                                                            className={clsx(
                                                                'flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer hover:scale-[1.01]',
                                                                isHighPriority && 'animate-pulse ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                            )}
                                                            style={taskStyle}
                                                            onClick={() => handleTaskClick(task)}
                                                        >
                                                            <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex items-center justify-center" />
                                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                <span className="text-sm text-slate-200 break-words">{task.title}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Separator for timed tasks */}
                                                {sorted.activeWithTime.length > 0 && sorted.activeNoTime.length > 0 && (
                                                    <div className="flex items-center gap-2 py-1">
                                                        <div className="flex-1 h-px bg-slate-700/50" />
                                                        <span className="text-xs text-slate-600">Saatli</span>
                                                        <div className="flex-1 h-px bg-slate-700/50" />
                                                    </div>
                                                )}

                                                {/* Active tasks with time */}
                                                {sorted.activeWithTime.map(task => {
                                                    const isHighPriority = task.priority === 2;
                                                    const taskStyle = getTaskStyle(task);
                                                    const overdueTask = isOverdue(task);

                                                    if (overdueTask) {
                                                        return (
                                                            <div
                                                                key={task.id}
                                                                onClick={() => handleTaskClick(task)}
                                                                className="overdue-flip-container cursor-pointer mb-2 outline-none min-h-[3.5rem]"
                                                                tabIndex={0}
                                                                role="button"
                                                            >
                                                                <div className="overdue-flip-inner">
                                                                    {/* Front */}
                                                                    <div
                                                                        className={clsx(
                                                                            'overdue-flip-front flex items-center gap-2 p-2 rounded-lg border border-l-4 border-l-cyan-400 bg-slate-900/80',
                                                                            isHighPriority && 'animate-pulse ring-1 ring-red-500/50'
                                                                        )}
                                                                        style={{
                                                                            backgroundColor: taskStyle.backgroundColor,
                                                                            borderColor: '#22d3ee',
                                                                            position: 'relative',
                                                                            height: 'auto',
                                                                            minHeight: '100%'
                                                                        }}
                                                                    >
                                                                        <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex items-center justify-center shrink-0" />
                                                                        <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                            <Clock className="w-3 h-3 text-cyan-400 shrink-0 overdue-icon-sad" />
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className="text-sm text-slate-200 break-words leading-tight">{task.title}</span>
                                                                                <span className="text-xs text-slate-400">{task.startTime?.substring(0, 5)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Back */}
                                                                    <div className="overdue-flip-back rounded-lg text-sm font-bold flex-col gap-1">
                                                                        <span>😭 Unuttun mu beni?!</span>
                                                                        <span className="text-[10px] opacity-75 font-normal">{task.startTime?.substring(0, 5)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={task.id}
                                                            className={clsx(
                                                                'flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer hover:scale-[1.01]',
                                                                isHighPriority && 'animate-pulse ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                                            )}
                                                            style={taskStyle}
                                                            onClick={() => handleTaskClick(task)}
                                                        >
                                                            <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex items-center justify-center" />
                                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                                {task.priority === 2 && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                                                                <span className="text-sm text-slate-200 break-words">{task.title}</span>
                                                            </div>
                                                            <span className="text-xs text-slate-400">{task.startTime?.substring(0, 5)}</span>
                                                        </div>
                                                    );
                                                })}

                                                {/* Separator for completed */}
                                                {sorted.completed.length > 0 && (sorted.activeNoTime.length > 0 || sorted.activeWithTime.length > 0) && (
                                                    <div className="flex items-center gap-2 py-1">
                                                        <div className="flex-1 h-px bg-slate-700/50" />
                                                        <span className="text-xs text-slate-600">Tamamlanan</span>
                                                        <div className="flex-1 h-px bg-slate-700/50" />
                                                    </div>
                                                )}

                                                {/* Completed tasks */}
                                                {sorted.completed.map(task => (
                                                    <div
                                                        key={task.id}
                                                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/20 hover:bg-slate-800/40 transition-colors cursor-pointer opacity-60"
                                                        onClick={() => handleTaskStatusChange(task.id, 'pending')}
                                                    >
                                                        <div className="w-4 h-4 rounded-full border-2 bg-emerald-500 border-emerald-500 flex items-center justify-center">
                                                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                                                <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2.5 2.5a1 1 0 001.414 0l5.5-5.5a1 1 0 00-1.414-1.414L5.5 7.086 3.707 5.293z" />
                                                            </svg>
                                                        </div>
                                                        <span className="flex-1 text-sm truncate text-slate-500 line-through">{task.title}</span>
                                                        {task.startTime && <span className="text-xs text-slate-600">{task.startTime.substring(0, 5)}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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

            {/* Task Detail Modal */}
            {selectedTask && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedTask(null);
                        }
                    }}
                >
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" />
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
        </div>
    );
};
