// MonthPage - Monthly calendar view
import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { TopBar } from '../components/nav/TopBar';
import { MonthCalendar } from '../components/calendar/MonthCalendar';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import { useTasks } from '../hooks/useTasks';
import { useSettings } from '../hooks/useSettings';
import { useCategories } from '../hooks/useCategories';
import { navigation, formatDate, getMonthRange, isTaskInRange, isTaskOnDate, isSameDay, sortTasksByPriority, isOverdue } from '../domain/dateUtils';
import type { Task } from '../domain/types';

export const MonthPage: React.FC = () => {
    const navigate = useNavigate();
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
    const { getCategoryColor } = useCategories();

    // Get task style based on category color
    const getTaskStyle = (task: Task) => {
        const color = task.color || getCategoryColor(task.category);
        return {
            backgroundColor: `${color}30`,
            borderColor: `${color}60`,
        };
    };

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

    // Tasks for selected date with smart sorting
    const selectedDateTasks = useMemo(() => {
        if (!selectedDate) return { all: [], sorted: { activeNoTime: [], activeWithTime: [], completed: [] } };
        const dayTasks = monthTasks.filter(task => isTaskOnDate(task, selectedDate));
        const sorted = sortTasksByPriority(dayTasks);
        return { all: dayTasks, sorted };
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
        if (selectedDate && isSameDay(date, selectedDate)) {
            setSelectedDate(null);
        } else {
            setSelectedDate(date);
        }
        setSelectedTask(null);
    };

    const handleGoToDay = () => {
        // Navigate to Today page (which shows day view)
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

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Calendar - Full Height */}
                <div className="flex-1 flex flex-col overflow-hidden m-2 md:m-4">
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
                </div>
            </div>

            {/* Selected Date Modal - Shown when a day is clicked */}
            {selectedDate && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center p-4 md:p-8"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedDate(null);
                        }
                    }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" />

                    {/* Date Tasks Panel */}
                    <div className="relative w-full max-w-md max-h-[85vh] glass-panel overflow-hidden flex flex-col animate-scaleIn">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-cyan-500/20 text-slate-100 font-bold text-xl">
                                    {formatDate(selectedDate, 'd')}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-100">
                                        {formatDate(selectedDate, 'MMMM yyyy')}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        {formatDate(selectedDate, 'EEEE')} – {selectedDateTasks.all.length} görev
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleGoToDay}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                                >
                                    Güne Git
                                </button>
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {selectedDateTasks.all.length === 0 ? (
                                <div className="flex items-center justify-center h-32 text-slate-500">
                                    Bu günde görev yok
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {/* Active tasks without time */}
                                    {selectedDateTasks.sorted.activeNoTime.map(task => {
                                        const isHighPriority = task.priority === 2;
                                        const taskStyle = getTaskStyle(task);
                                        const overdueTask = isOverdue(task);
                                        // Flip Card Structure for Overdue Tasks
                                        if (overdueTask) {
                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => handleTaskStatusChange(task.id, 'done')}
                                                    className="overdue-flip-container h-12 cursor-pointer"
                                                >
                                                    <div className="overdue-flip-inner">
                                                        {/* Front Face */}
                                                        <div
                                                            className={clsx(
                                                                'overdue-flip-front flex items-center gap-3 p-3 rounded-lg border border-l-4 border-l-cyan-400 bg-slate-900/80',
                                                                task.status === 'done' && 'opacity-50 line-through'
                                                            )}
                                                            style={{
                                                                backgroundColor: taskStyle.backgroundColor,
                                                                borderColor: taskStyle.borderColor,
                                                                borderLeftColor: '#22d3ee',
                                                            }}
                                                        >
                                                            <div className="w-5 h-5 rounded-full border-2 border-slate-500 flex items-center justify-center shrink-0" />
                                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                                <Clock className="w-4 h-4 text-cyan-400 shrink-0 overdue-icon-sad" />
                                                                {task.priority === 2 && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                                                                <span className="text-sm text-slate-200 break-words line-clamp-1">{task.title}</span>
                                                            </div>
                                                        </div>

                                                        {/* Back Face */}
                                                        <div className="overdue-flip-back rounded-lg text-sm">
                                                            <span>😭 Unuttun mu beni?!</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Standard Task Render
                                        return (
                                            <div
                                                key={task.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:scale-[1.01] ${isHighPriority ? 'animate-pulse ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : ''
                                                    }`}
                                                style={taskStyle}
                                                onClick={() => handleTaskStatusChange(task.id, 'done')}
                                            >
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-500" />
                                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                    {task.priority === 2 && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                                                    <span className="text-sm text-slate-200 break-words">{task.title}</span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Separator for timed tasks */}
                                    {selectedDateTasks.sorted.activeWithTime.length > 0 && selectedDateTasks.sorted.activeNoTime.length > 0 && (
                                        <div className="flex items-center gap-2 py-2">
                                            <div className="flex-1 h-px bg-slate-700/50" />
                                            <span className="text-xs text-slate-600">Saatli</span>
                                            <div className="flex-1 h-px bg-slate-700/50" />
                                        </div>
                                    )}

                                    {/* Active tasks with time */}
                                    {selectedDateTasks.sorted.activeWithTime.map(task => {
                                        const isHighPriority = task.priority === 2;
                                        const taskStyle = getTaskStyle(task);
                                        const overdueTask = isOverdue(task);
                                        // Flip Card Structure for Overdue Tasks (Timed)
                                        if (overdueTask) {
                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => handleTaskStatusChange(task.id, 'done')}
                                                    className="overdue-flip-container h-16 cursor-pointer"
                                                >
                                                    <div className="overdue-flip-inner">
                                                        {/* Front Face */}
                                                        <div
                                                            className={clsx(
                                                                'overdue-flip-front flex items-center gap-3 p-3 rounded-lg border border-l-4 border-l-cyan-400 bg-slate-900/80',
                                                                task.status === 'done' && 'opacity-50 line-through'
                                                            )}
                                                            style={{
                                                                backgroundColor: taskStyle.backgroundColor,
                                                                borderColor: taskStyle.borderColor,
                                                                borderLeftColor: '#22d3ee',
                                                            }}
                                                        >
                                                            <div className="w-5 h-5 rounded-full border-2 border-slate-500 flex items-center justify-center shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock className="w-4 h-4 text-cyan-400 shrink-0 overdue-icon-sad" />
                                                                    {task.priority === 2 && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                                                                    <span className="text-sm text-slate-200 break-words line-clamp-1">{task.title}</span>
                                                                </div>
                                                                <span className="text-xs text-slate-400">
                                                                    {task.startTime?.substring(0, 5)}{task.endTime ? ` – ${task.endTime.substring(0, 5)}` : ''}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Back Face */}
                                                        <div className="overdue-flip-back rounded-lg text-sm flex-col gap-1">
                                                            <span>😭 Unuttun mu beni?!</span>
                                                            <span className="text-[10px] opacity-80 font-normal">
                                                                {task.startTime?.substring(0, 5)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Standard Render
                                        return (
                                            <div
                                                key={task.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:scale-[1.01] ${isHighPriority ? 'animate-pulse ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : ''
                                                    }`}
                                                style={taskStyle}
                                                onClick={() => handleTaskStatusChange(task.id, 'done')}
                                            >
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-500" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        {task.priority === 2 && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                                                        <span className="text-sm text-slate-200 break-words">{task.title}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-400">
                                                        {task.startTime?.substring(0, 5)}{task.endTime ? ` – ${task.endTime.substring(0, 5)}` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Separator for completed */}
                                    {selectedDateTasks.sorted.completed.length > 0 && (selectedDateTasks.sorted.activeNoTime.length > 0 || selectedDateTasks.sorted.activeWithTime.length > 0) && (
                                        <div className="flex items-center gap-2 py-2">
                                            <div className="flex-1 h-px bg-slate-700/50" />
                                            <span className="text-xs text-slate-600">Tamamlanan</span>
                                            <div className="flex-1 h-px bg-slate-700/50" />
                                        </div>
                                    )}

                                    {/* Completed tasks */}
                                    {selectedDateTasks.sorted.completed.map(task => (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/20 hover:bg-slate-800/40 transition-colors cursor-pointer opacity-60"
                                            onClick={() => handleTaskStatusChange(task.id, 'pending')}
                                        >
                                            <div className="w-5 h-5 rounded-full border-2 bg-emerald-500 border-emerald-500 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                                    <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2.5 2.5a1 1 0 001.414 0l5.5-5.5a1 1 0 00-1.414-1.414L5.5 7.086 3.707 5.293z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="block text-sm truncate text-slate-500 line-through">{task.title}</span>
                                                {task.startTime && (
                                                    <span className="text-xs text-slate-600">
                                                        {task.startTime.substring(0, 5)}{task.endTime ? ` – ${task.endTime.substring(0, 5)}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }

            {/* Task Detail Modal - Only shown when task is selected */}
            {
                selectedTask && (
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
                                onEdit={() => setEditingTask(selectedTask)}
                                onDelete={handleDeleteTask}
                                onStatusChange={handleStatusChange}
                            />
                        </div>
                    </div>
                )
            }

            <TaskFormModal
                open={isFormOpen || !!editingTask}
                task={editingTask}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingTask(null);
                }}
                onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            />
        </div >
    );
};
