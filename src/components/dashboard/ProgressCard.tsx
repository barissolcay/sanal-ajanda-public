// ProgressCard - Achievements only (simplified)
import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';

interface ProgressCardProps {
    achievementsUnlocked: number;
    achievementsTotal: number;
    onAchievementsClick?: () => void;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
    achievementsUnlocked,
    achievementsTotal,
    onAchievementsClick,
}) => {
    const achievementProgress = (achievementsUnlocked / achievementsTotal) * 100;

    return (
        <button
            onClick={onAchievementsClick}
            className="w-full p-4 rounded-[14px] bg-slate-800/50 border border-slate-600/30 hover:border-slate-500/50 transition-all group"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-[13px] font-medium text-slate-200">Başarılar</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[13px] text-slate-400">
                        {achievementsUnlocked}/{achievementsTotal}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${achievementProgress}%` }}
                />
            </div>
        </button>
    );
};
