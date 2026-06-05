// StreakCard - Compact daily streak counter with fire animation
import React from 'react';
import { Flame, Zap } from 'lucide-react';

interface StreakCardProps {
    currentStreak: number;
    todayCompleted: boolean;
}

export const StreakCard: React.FC<StreakCardProps> = ({
    currentStreak,
    todayCompleted,
}) => {
    const hasStreak = currentStreak >= 1 || todayCompleted;
    const isLegendary = currentStreak >= 7;

    return (
        <div className={`
            relative p-4 rounded-xl border overflow-hidden transition-all duration-500
            ${isLegendary
                ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/30 border-purple-500/40'
                : hasStreak
                    ? 'bg-gradient-to-br from-orange-900/40 to-red-900/30 border-orange-500/40'
                    : 'bg-slate-800/50 border-slate-700/50'
            }
        `}>
            {/* Animated fire background for streaks */}
            {hasStreak && (
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-t from-orange-500 to-transparent rounded-full blur-2xl animate-pulse" />
                </div>
            )}

            <div className="relative flex items-center gap-3">
                {/* Fire icon */}
                <div className={`
                    p-2 rounded-lg
                    ${isLegendary
                        ? 'bg-purple-500/30'
                        : hasStreak
                            ? 'bg-orange-500/30'
                            : 'bg-slate-700/50'
                    }
                `}>
                    {isLegendary ? (
                        <Zap className="w-5 h-5 text-purple-300" />
                    ) : (
                        <Flame className={`w-5 h-5 ${hasStreak ? 'text-orange-400' : 'text-slate-500'
                            }`} />
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl font-black ${isLegendary ? 'text-purple-300' : hasStreak ? 'text-orange-300' : 'text-slate-100'
                            }`}>
                            {currentStreak}
                        </span>
                        <span className="text-sm text-slate-400">gün seri</span>
                    </div>

                    {/* Status message */}
                    <div className="flex items-center gap-1 mt-0.5">
                        {todayCompleted ? (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span className="text-xs text-emerald-400">Bugün tamamlandı</span>
                            </>
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span className="text-xs text-amber-400">Seriyi korumak için görev tamamla</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
