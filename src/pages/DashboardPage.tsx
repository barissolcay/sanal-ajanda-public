// DashboardPage - Professional personal dashboard
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Plus, Settings, Menu } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { HeroCard } from '../components/dashboard/HeroCard';
import { KPIGrid } from '../components/dashboard/KPIGrid';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { ProgressCard } from '../components/dashboard/ProgressCard';
import { DailySummaryCard } from '../components/dashboard/DailySummaryCard';
import { AchievementsModal, getAchievements } from '../components/dashboard/AchievementBadges';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel';
import { useTasks } from '../hooks/useTasks';
import { isOverdue, isOverdueCompletedToday } from '../domain/dateUtils';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, differenceInMinutes } from 'date-fns';
import type { Task } from '../domain/types';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { open: openSidebar } = useSidebar();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showAchievements, setShowAchievements] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Single source of truth for all tasks (avoids double network calls)
    const {
        tasks: allTasks,
        createTask,
        createTasksBatch,
        updateTask,
        updateTaskStatus,
        deleteTask,
    } = useTasks({ showCompleted: true });

    // Derive pending tasks client-side
    const pendingTasks = useMemo(() => {
        return allTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
    }, [allTasks]);

    // Today's date formatted
    const todayFormatted = format(new Date(), "EEEE, d MMMM yyyy", { locale: tr });

    // Calculate all stats
    const stats = useMemo(() => {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // Helper to check if task is in date range (same as TodayPage)
        const isInRange = (task: Task, rangeStart: Date, rangeEnd: Date): boolean => {
            if (!task.startDate) return false;
            const taskStartDate = new Date(task.startDate);
            taskStartDate.setHours(0, 0, 0, 0);
            const taskEndDate = task.endDate ? new Date(task.endDate) : taskStartDate;
            taskEndDate.setHours(23, 59, 59, 999);
            return taskEndDate >= rangeStart && taskStartDate <= rangeEnd;
        };

        // Today's pending tasks (matching TodayPage logic)
        const todayPendingTasks = pendingTasks.filter(t => isInRange(t, todayStart, todayEnd));
        const todayPendingCount = todayPendingTasks.length;

        // Today's scheduled tasks that are completed (scheduled for today and done)
        const todayScheduledCompletedTasks = allTasks.filter(t => t.status === 'done' && isInRange(t, todayStart, todayEnd));
        const todayScheduledCompleted = todayScheduledCompletedTasks.length;

        // Total scheduled tasks for today (pending + completed)
        const todayTotal = todayPendingCount + todayScheduledCompleted;

        // Priority count (tasks with priority === 2, which is high priority)
        const priorityCount = todayPendingTasks.filter(t => t.priority === 2).length;

        // Deadline today count (tasks whose endDate is today)
        const deadlineTodayCount = todayPendingTasks.filter(t => {
            const endDate = t.endDate ? new Date(t.endDate) : null;
            if (!endDate) return false;
            return endDate >= todayStart && endDate <= todayEnd;
        }).length;

        // Total tasks completed today (for streak / achievements)
        const totalCompletedToday = allTasks.filter(t => {
            if (t.status !== 'done') return false;
            const completedDate = new Date(t.updatedAt);
            return completedDate >= todayStart && completedDate <= todayEnd;
        }).length;

        // Overdue completed today (tasks finished today whose scheduled date was in the past)
        const todayOverdueCompleted = allTasks.filter(t => isOverdueCompletedToday(t, now)).length;

        // Week pending
        const weekPending = pendingTasks.filter(t => isInRange(t, weekStart, weekEnd)).length;

        // Month pending
        const monthPending = pendingTasks.filter(t => isInRange(t, monthStart, monthEnd)).length;

        // Overdue
        const overduePending = pendingTasks.filter(t => isOverdue(t)).length;

        // Upcoming (within 12 hours or deadline today)
        const upcomingCount = pendingTasks.filter(t => {
            if (!t.startDate) return false;
            const deadlineDate = new Date(t.endDate || t.startDate);
            if (t.endTime) {
                const [hours, minutes] = t.endTime.split(':').map(Number);
                deadlineDate.setHours(hours, minutes, 0, 0);
            } else if (t.startTime) {
                const [hours, minutes] = t.startTime.split(':').map(Number);
                deadlineDate.setHours(hours, minutes, 0, 0);
            } else {
                deadlineDate.setHours(23, 59, 59, 999);
            }
            const isToday = deadlineDate >= todayStart && deadlineDate <= todayEnd;
            const minutesLeft = differenceInMinutes(deadlineDate, now);
            return isToday || (minutesLeft >= 0 && minutesLeft <= 720);
        }).length;

        // Total completed all time
        const totalCompleted = allTasks.filter(t => t.status === 'done').length;

        // Calculate current and longest streak across the past 365 days
        let currentStreak = 0;
        let longestStreak = 0;
        let checkDate = new Date(todayStart);

        const todayHasCompleted = totalCompletedToday > 0;
        if (!todayHasCompleted) {
            checkDate = subDays(checkDate, 1);
        }

        let tempStreak = 0;
        let isCurrentStreakCounted = false;

        for (let i = 0; i < 365; i++) {
            const dayStart = startOfDay(checkDate);
            const dayEnd = endOfDay(checkDate);

            const dayHasCompleted = allTasks.some(t => {
                if (t.status !== 'done') return false;
                const completedDate = new Date(t.updatedAt);
                return completedDate >= dayStart && completedDate <= dayEnd;
            });

            if (dayHasCompleted) {
                tempStreak++;
                if (tempStreak > longestStreak) longestStreak = tempStreak;
            } else {
                if (!isCurrentStreakCounted) {
                    currentStreak = tempStreak;
                    isCurrentStreakCounted = true;
                }
                tempStreak = 0;
            }

            checkDate = subDays(checkDate, 1);
        }

        if (!isCurrentStreakCounted) {
            currentStreak = tempStreak;
        }

        return {
            todayTotal,
            todayPendingCount,
            todayScheduledCompleted,
            todayCompleted: totalCompletedToday,
            todayOverdueCompleted,
            priorityCount,
            deadlineTodayCount,
            weekPending,
            monthPending,
            overduePending,
            upcomingCount,
            totalCompleted,
            currentStreak,
            longestStreak,
        };
    }, [allTasks, pendingTasks]);

    // Achievements calculation
    const achievements = useMemo(() => {
        return getAchievements({
            totalCompleted: stats.totalCompleted,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
            todayCompleted: stats.todayCompleted,
        });
    }, [stats]);

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    // Handlers
    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
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
        if (!editingTask) return;
        await updateTask(editingTask.id, {
            ...data,
            endDate: data.endDate || undefined,
            startTime: data.startTime || undefined,
            endTime: data.endTime || undefined,
        });
        setEditingTask(null);
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

    const handleStatusChange = async (status: Task['status']) => {
        if (selectedTask) {
            await updateTaskStatus(selectedTask.id, status);
            setSelectedTask(null);
        }
    };

    const handleDeleteTask = async () => {
        if (selectedTask) {
            await deleteTask(selectedTask.id);
            setSelectedTask(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Top Bar */}
            <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-800/60">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu */}
                    <button
                        onClick={openSidebar}
                        className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-100 transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Date */}
                    <div>
                        <h1 className="text-lg font-semibold text-slate-100 capitalize">{todayFormatted}</h1>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setEditingTask(null);
                            setIsFormOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Yeni Görev</span>
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className="p-2 text-slate-400 hover:text-slate-100 transition-colors rounded-[10px] hover:bg-slate-800/40"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {/* Hero Card */}
                <HeroCard
                    todayTotal={stats.todayTotal}
                    todayCompleted={stats.todayScheduledCompleted}
                    todayOverdueCompleted={stats.todayOverdueCompleted}
                    currentStreak={stats.currentStreak}
                />

                {/* KPI Grid */}
                <KPIGrid
                    today={stats.todayTotal}
                    todayDetail={`${stats.todayScheduledCompleted} tamamlandı`}
                    week={stats.weekPending}
                    month={stats.monthPending}
                    overdue={stats.overduePending}
                    onTodayClick={() => navigate('/today')}
                    onWeekClick={() => navigate('/week')}
                    onMonthClick={() => navigate('/month')}
                    onOverdueClick={() => navigate('/overdue')}
                />

                {/* Main 2-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column: 2/3 */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Upcoming Tasks */}
                        <UpcomingTasks
                            tasks={pendingTasks}
                            onTaskClick={handleTaskClick}
                        />

                        {/* Daily Summary */}
                        <DailySummaryCard
                            totalTasks={stats.todayTotal}
                            completedTasks={stats.todayScheduledCompleted}
                            highPriorityCount={stats.priorityCount}
                            overdueCount={stats.overduePending}
                            deadlineTodayCount={stats.deadlineTodayCount}
                            todayOverdueCompleted={stats.todayOverdueCompleted}
                        />
                    </div>

                    {/* Right Column: 1/3 */}
                    <div className="space-y-4">
                        {/* Progress */}
                        <ProgressCard
                            achievementsUnlocked={unlockedCount}
                            achievementsTotal={achievements.length}
                            onAchievementsClick={() => setShowAchievements(true)}
                        />

                        {/* Quick Stats Panel */}
                        <div className="glass-panel p-4 space-y-3">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Hızlı İpuçları
                            </h3>
                            <div className="space-y-2 text-xs text-slate-400">
                                <p>• <strong>Bugün</strong> sekmesinden günlük görevlerini yönet</p>
                                <p>• <strong>Hafta/Ay</strong> takvimlerinde günlere tıklayarak o güne git</p>
                                <p>• <strong>Notlar</strong> sekmesinden hızlı karalama yap ve göreve çevir</p>
                                <p>• <strong>Gecikmişler</strong> sayfasından ertelenen işleri telafi et</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modals */}
            <AchievementsModal
                open={showAchievements}
                onClose={() => setShowAchievements(false)}
                achievements={achievements}
            />

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
                            onEdit={() => {
                                const t = selectedTask;
                                setSelectedTask(null);
                                setEditingTask(t);
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
