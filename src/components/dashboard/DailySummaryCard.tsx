import React from 'react';
import { FileText } from 'lucide-react';

interface DailySummaryCardProps {
    totalTasks: number;
    completedTasks: number;
    highPriorityCount: number;
    overdueCount: number;
    deadlineTodayCount: number;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
    totalTasks,
    completedTasks,
    highPriorityCount,
    overdueCount,
    deadlineTodayCount
}) => {
    // Generate the report text
    const getSummaryText = () => {
        const parts: string[] = [];

        // Overall status
        if (totalTasks === 0) {
            return "Bugün için planlanmış herhangi bir göreviniz bulunmuyor. Dilerseniz yeni görevler ekleyerek güne başlayabilirsiniz.";
        }

        // Introduction
        const pending = totalTasks - completedTasks;

        if (completedTasks === totalTasks) {
            return `Tebrikler! Bugünün tüm görevlerini (${totalTasks} görev) başarıyla tamamladınız. Harika bir iş çıkardınız.`;
        }

        // Active task count logic
        let intro = `Bugün toplam ${totalTasks} adet göreviniz var`;
        if (completedTasks > 0) {
            intro += ` ve şu ana kadar ${completedTasks} tanesini tamamladınız.`;
        } else {
            intro += ".";
        }
        parts.push(intro);

        // Details
        const details: string[] = [];

        if (deadlineTodayCount > 0) {
            details.push(`${deadlineTodayCount} tanesinin son günü bugün`);
        }

        if (highPriorityCount > 0) {
            details.push(`${highPriorityCount} tanesi yüksek öncelikli`);
        }

        if (overdueCount > 0) {
            details.push(`${overdueCount} görevin süresi geçmiş durumda`);
        }

        // Combine details
        if (details.length > 0) {
            const detailText = details.join(', ');
            // Capitalize first letter of detail text if needed, but usually it flows after a period or comma
            parts.push(`Bu görevlerden ${detailText}.`);
        }

        // Encouragement / Call to action
        if (pending > 0) {
            parts.push(`Kalan ${pending} görevi tamamlamak için harika bir zaman.`);
        }

        return parts.join(' ');
    };

    return (
        <div className="relative overflow-hidden rounded-[14px] bg-slate-900/50 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            {/* Decoration background */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />

            <div className="relative p-5 flex gap-4 items-start">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                    <FileText className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="space-y-1 pt-0.5">
                    <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide opacity-90">
                        Günün Özeti
                    </h3>
                    <p className="text-[15px] leading-relaxed text-slate-300 font-medium opacity-90">
                        {getSummaryText()}
                    </p>
                </div>
            </div>
        </div>
    );
};
