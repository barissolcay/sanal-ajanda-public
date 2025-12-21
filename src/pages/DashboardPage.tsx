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
import { createTask } from '../data/taskRepository';
import { isOverdue } from '../domain/dateUtils';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, differenceInMinutes } from 'date-fns';
import type { Task } from '../domain/types';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { open: openSidebar } = useSidebar();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showAchievements, setShowAchievements] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const { tasks: allTasks, updateTaskStatus, deleteTask, refreshTasks: refreshAllTasks } = useTasks({ showCompleted: true });
    const { tasks: pendingTasks, refreshTasks: refreshPendingTasks } = useTasks({ showCompleted: false });

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
            const taskStartDate = new Date(task.startDate);
            taskStartDate.setHours(0, 0, 0, 0);
            const taskEndDate = task.endDate ? new Date(task.endDate) : taskStartDate;
            taskEndDate.setHours(23, 59, 59, 999);
            return taskEndDate >= rangeStart && taskStartDate <= rangeEnd;
        };

        // Today's pending tasks (matching TodayPage logic)
        const todayPendingTasks = pendingTasks.filter(t => isInRange(t, todayStart, todayEnd));
        const todayTotal = todayPendingTasks.length;

        // Priority count (tasks with priority === 2, which is high priority)
        const priorityCount = todayPendingTasks.filter(t => t.priority === 2).length;

        // Deadline today count (tasks whose endDate is today)
        const deadlineTodayCount = todayPendingTasks.filter(t => {
            const endDate = t.endDate ? new Date(t.endDate) : null;
            if (!endDate) return false;
            return endDate >= todayStart && endDate <= todayEnd;
        }).length;

        // Completed today (based on updatedAt)
        const todayCompleted = allTasks.filter(t => {
            if (t.status !== 'done') return false;
            const completedDate = new Date(t.updatedAt);
            return completedDate >= todayStart && completedDate <= todayEnd;
        }).length;

        // Week pending
        const weekPending = pendingTasks.filter(t => isInRange(t, weekStart, weekEnd)).length;

        // Month pending
        const monthPending = pendingTasks.filter(t => isInRange(t, monthStart, monthEnd)).length;

        // Overdue
        const overduePending = pendingTasks.filter(t => isOverdue(t)).length;

        // Upcoming (within 12 hours or deadline today)
        const upcomingCount = pendingTasks.filter(t => {
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

        // Calculate streak
        let currentStreak = 0;
        let longestStreak = 0;
        let checkDate = new Date(todayStart);

        const todayHasCompleted = todayCompleted > 0;
        if (!todayHasCompleted) {
            checkDate = subDays(checkDate, 1);
        }

        let tempStreak = 0;
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
                if (tempStreak > 0 && currentStreak === 0) {
                    currentStreak = tempStreak;
                }
                break;
            }

            checkDate = subDays(checkDate, 1);
        }

        if (currentStreak === 0 && tempStreak > 0) {
            currentStreak = tempStreak;
        }

        return {
            todayTotal,
            todayCompleted,
            todayPending: todayTotal,
            weekPending,
            monthPending,
            overduePending,
            upcomingCount,
            totalCompleted,
            currentStreak,
            longestStreak,
            todayHasCompleted,
            priorityCount,
            deadlineTodayCount,
        };
    }, [allTasks, pendingTasks]);

    // Achievements
    const achievements = useMemo(() => getAchievements({
        totalCompleted: stats.totalCompleted,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        todayCompleted: stats.todayCompleted,
    }), [stats]);

    // Handlers
    const handleCreateTask = async (data: TaskFormData) => {
        await createTask({
            ...data,
            endDate: data.endDate || undefined,
            startTime: data.startTime || undefined,
            endTime: data.endTime || undefined,
        });
        setIsFormOpen(false);
    };

    const handleStatusChange = async (status: Task['status']) => {
        if (selectedTask) {
            await updateTaskStatus(selectedTask.id, status);
            // Refresh both task lists to ensure UI is in sync
            await Promise.all([refreshAllTasks(), refreshPendingTasks()]);
            setSelectedTask(null);
        }
    };

    const handleDeleteTask = async () => {
        if (selectedTask) {
            await deleteTask(selectedTask.id);
            // Refresh both task lists to ensure UI is in sync
            await Promise.all([refreshAllTasks(), refreshPendingTasks()]);
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
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Yeni Görev</span>
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">

                    <HeroCard
                        todayTotal={stats.todayPending + stats.todayCompleted}
                        todayCompleted={stats.todayCompleted}
                        currentStreak={stats.currentStreak}
                    />

                    {/* Daily Summary Card */}
                    <DailySummaryCard
                        totalTasks={stats.todayPending + stats.todayCompleted}
                        completedTasks={stats.todayCompleted}
                        highPriorityCount={stats.priorityCount}
                        deadlineTodayCount={stats.deadlineTodayCount}
                        overdueCount={stats.overduePending}
                    />


                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* Left Column - 3/5 */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* KPI Grid */}
                            <KPIGrid
                                today={stats.todayPending}
                                todayDetail={stats.todayCompleted > 0 ? `${stats.todayCompleted} tamamlandı` : undefined}
                                week={stats.weekPending}
                                month={stats.monthPending}
                                overdue={stats.overduePending}
                                onTodayClick={() => navigate('/today')}
                                onWeekClick={() => navigate('/week')}
                                onMonthClick={() => navigate('/month')}
                                onOverdueClick={() => navigate('/overdue')}
                            />
                        </div>

                        {/* Right Column - 2/5 */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Upcoming Tasks */}
                            <UpcomingTasks
                                tasks={pendingTasks}
                                onTaskClick={setSelectedTask}
                            />

                            {/* Progress Card */}
                            <ProgressCard
                                achievementsUnlocked={achievements.filter(a => a.unlocked).length}
                                achievementsTotal={achievements.length}
                                onAchievementsClick={() => setShowAchievements(true)}
                            />
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
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleCreateTask}
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
                            onDelete={handleDeleteTask}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
