// WeeklyChart - Compact bar chart showing daily COMPLETED task counts
import React from 'react';
import { BarChart3 } from 'lucide-react';

interface DayData {
    day: string;
    count: number;
    isToday: boolean;
}

interface WeeklyChartProps {
    data: DayData[];
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    const totalCompleted = data.reduce((sum, d) => sum + d.count, 0);

    return (
        <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    <h3 className="text-xs font-medium text-slate-400">Bu Hafta Tamamlanan</h3>
                </div>
                <span className="text-xs font-bold text-indigo-400">{totalCompleted}</span>
            </div>

            {/* Chart */}
            <div className="flex items-end justify-between gap-1.5 h-12">
                {data.map((day, index) => {
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-0.5">
                            {/* Bar */}
                            <div className="relative w-full h-8 flex items-end justify-center">
                                <div
                                    className={`
                                        w-full max-w-[16px] rounded-t transition-all duration-500
                                        ${day.isToday
                                            ? 'bg-gradient-to-t from-cyan-500 to-indigo-500'
                                            : day.count > 0
                                                ? 'bg-slate-500'
                                                : 'bg-slate-700/50'
                                        }
                                    `}
                                    style={{ height: `${Math.max(height, 8)}%` }}
                                />
                            </div>

                            {/* Day label */}
                            <span className={`text-[10px] ${day.isToday ? 'text-cyan-400 font-medium' : 'text-slate-600'
                                }`}>
                                {day.day}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Helper to generate week data from tasks
export const generateWeekData = (tasks: { status: string; updatedAt: string }[]): DayData[] => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const today = new Date();
    const todayDayIndex = (today.getDay() + 6) % 7; // Monday = 0

    // Get start of week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - todayDayIndex);
    startOfWeek.setHours(0, 0, 0, 0);

    return days.map((day, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        const dateStr = date.toISOString().split('T')[0];

        // Count completed tasks for this day
        const count = tasks.filter(task => {
            if (task.status !== 'done') return false;
            const taskDate = task.updatedAt.split('T')[0];
            return taskDate === dateStr;
        }).length;

        return {
            day,
            count,
            isToday: index === todayDayIndex,
        };
    });
};
