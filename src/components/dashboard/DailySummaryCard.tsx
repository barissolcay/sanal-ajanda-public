import React from 'react';
import { AlertTriangle, Clock, Calendar, CheckCircle2, Zap } from 'lucide-react';

interface DailySummaryCardProps {
    totalTasks: number;
    completedTasks: number;
    highPriorityCount: number;
    overdueCount: number;
    deadlineTodayCount: number;
    todayOverdueCompleted?: number;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
    totalTasks,
    completedTasks,
    highPriorityCount,
    overdueCount,
    deadlineTodayCount,
    todayOverdueCompleted = 0,
}) => {
    const pending = Math.max(0, totalTasks - completedTasks);

    // Punchy, single motivational status line
    const getStatusMessage = () => {
        if (totalTasks === 0) {
            return "Bugün için henüz görev planlanmadı. Harika bir başlangıç yapabilirsin!";
        }
        if (completedTasks >= totalTasks && totalTasks > 0) {
            return "Tebrikler! Bugünün tüm görevlerini tamamladın. Harika bir iş! 🎉";
        }
        if (pending > 0 && highPriorityCount > 0) {
            return `Bugün tamamlanacak ${pending} görev var (${highPriorityCount} tanesi kritik öncelikli).`;
        }
        if (pending > 0) {
            return `Günü verimli kılmak için kalan ${pending} göreve odaklanma zamanı.`;
        }
        return "Günlük planın hazır.";
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg p-4 md:p-5 backdrop-blur-xl">
            {/* Background ambient accent */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
                        <Zap className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Günün Durumu
                        </h3>
                        <p className="text-sm font-medium text-slate-200 mt-0.5">
                            {getStatusMessage()}
                        </p>
                    </div>
                </div>

                {/* Glanceable Mini Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 w-full sm:w-auto">
                    {/* Today Remaining */}
                    {pending > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-medium">
                            <Calendar className="w-3 h-3 text-indigo-400" />
                            <span>{pending} Kalan</span>
                        </div>
                    )}

                    {/* High Priority */}
                    {highPriorityCount > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-semibold">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            <span>{highPriorityCount} Kritik</span>
                        </div>
                    )}

                    {/* Deadline Today */}
                    {deadlineTodayCount > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 font-medium">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{deadlineTodayCount} Son Gün</span>
                        </div>
                    )}

                    {/* Overdue */}
                    {overdueCount > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-xs text-cyan-300 font-medium">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>{overdueCount} Gecikmiş</span>
                        </div>
                    )}

                    {/* Overdue Completed Today */}
                    {todayOverdueCompleted > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>+{todayOverdueCompleted} Telafi</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
