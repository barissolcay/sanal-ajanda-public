// HeroCard - Today summary with progress ring and streak
import React from 'react';
import { Flame } from 'lucide-react';

interface HeroCardProps {
    todayTotal: number;
    todayCompleted: number;
    upcomingCount: number;
    overdueCount: number;
    currentStreak: number;
    todayHasCompleted: boolean;
}

export const HeroCard: React.FC<HeroCardProps> = ({
    todayTotal,
    todayCompleted,
    upcomingCount,
    overdueCount,
    currentStreak,
    todayHasCompleted,
}) => {
    const progress = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;
    const remaining = todayTotal - todayCompleted;

    // SVG progress ring
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const hasStreak = currentStreak >= 1 || todayHasCompleted;

    return (
        <div className="p-6 rounded-[14px] bg-slate-800/50 border border-slate-600/30">
            <div className="flex items-center gap-6">
                {/* Progress Ring */}
                <div className="relative shrink-0">
                    <svg width="96" height="96" className="-rotate-90">
                        {/* Background circle */}
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            className="text-slate-700"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500"
                        />
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                        </defs>
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-100">{todayCompleted}/{todayTotal}</span>
                        <span className="text-[11px] text-slate-400">tamamlandı</span>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-slate-100 mb-1">
                        Bugün
                    </h2>
                    <p className="text-[13px] text-slate-400 mb-4">
                        {remaining > 0
                            ? `${remaining} görev bekliyor`
                            : todayTotal > 0
                                ? 'Tüm görevler tamamlandı! 🎉'
                                : 'Bugün için görev yok'
                        }
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-[13px]">
                        <span className="text-slate-400">
                            <span className="text-cyan-400 font-medium">{todayTotal}</span> görev
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400">
                            <span className="text-amber-400 font-medium">{upcomingCount}</span> yaklaşan
                        </span>
                        {overdueCount > 0 && (
                            <>
                                <span className="text-slate-600">·</span>
                                <span className="text-slate-400">
                                    <span className="text-red-400 font-medium">{overdueCount}</span> gecikmiş
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Streak Display */}
                <div className={`
                    flex flex-col items-center justify-center shrink-0 p-4 rounded-xl
                    ${hasStreak
                        ? 'bg-gradient-to-br from-orange-900/40 to-amber-900/30 border border-orange-500/30'
                        : 'bg-slate-700/30 border border-slate-600/30'
                    }
                `}>
                    <div className={`p-2 rounded-lg mb-1 ${hasStreak ? 'bg-orange-500/30' : 'bg-slate-600/50'}`}>
                        <Flame className={`w-5 h-5 ${hasStreak ? 'text-orange-400' : 'text-slate-500'}`} />
                    </div>
                    <span className={`text-2xl font-bold ${hasStreak ? 'text-orange-300' : 'text-slate-400'}`}>
                        {currentStreak}
                    </span>
                    <span className="text-[11px] text-slate-400">gün serisi</span>
                </div>
            </div>
        </div>
    );
};
