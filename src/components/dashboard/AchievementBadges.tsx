// AchievementsModal - Full achievements page as modal with more badges
import React from 'react';
import {
    Trophy, Flame, Target, Zap, Calendar, Star, Lock, X,
    Rocket, Crown, Medal, Award, Heart, Coffee, Moon, Sun,
    Sparkles, Gift, TrendingUp, Clock
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    color: string;
    unlocked: boolean;
    progress?: number;
    requirement?: number;
    current?: number;
}

// Full achievement definitions
export const getAchievements = (stats: {
    totalCompleted: number;
    currentStreak: number;
    longestStreak: number;
    todayCompleted: number;
}): Achievement[] => [
        // Başlangıç
        {
            id: 'first_step',
            name: 'İlk Adım',
            description: 'İlk görevini tamamla',
            icon: Star,
            color: 'from-yellow-500 to-amber-500',
            unlocked: stats.totalCompleted >= 1,
            progress: Math.min(100, stats.totalCompleted * 100),
            requirement: 1,
            current: stats.totalCompleted,
        },
        {
            id: 'getting_started',
            name: 'Yola Çıktık',
            description: '5 görev tamamla',
            icon: Rocket,
            color: 'from-blue-500 to-cyan-500',
            unlocked: stats.totalCompleted >= 5,
            progress: Math.min(100, (stats.totalCompleted / 5) * 100),
            requirement: 5,
            current: stats.totalCompleted,
        },
        // Görev sayısı
        {
            id: 'target_hunter',
            name: 'Hedef Avcısı',
            description: '10 görev tamamla',
            icon: Target,
            color: 'from-emerald-500 to-teal-500',
            unlocked: stats.totalCompleted >= 10,
            progress: Math.min(100, (stats.totalCompleted / 10) * 100),
            requirement: 10,
            current: stats.totalCompleted,
        },
        {
            id: 'quarter_century',
            name: 'Çeyrek Asır',
            description: '25 görev tamamla',
            icon: Medal,
            color: 'from-orange-500 to-amber-500',
            unlocked: stats.totalCompleted >= 25,
            progress: Math.min(100, (stats.totalCompleted / 25) * 100),
            requirement: 25,
            current: stats.totalCompleted,
        },
        {
            id: 'half_century',
            name: 'Yarım Yüzyıl',
            description: '50 görev tamamla',
            icon: Award,
            color: 'from-pink-500 to-rose-500',
            unlocked: stats.totalCompleted >= 50,
            progress: Math.min(100, (stats.totalCompleted / 50) * 100),
            requirement: 50,
            current: stats.totalCompleted,
        },
        {
            id: 'century',
            name: 'Yüzde Yüz',
            description: '100 görev tamamla',
            icon: Trophy,
            color: 'from-cyan-500 to-blue-500',
            unlocked: stats.totalCompleted >= 100,
            progress: Math.min(100, (stats.totalCompleted / 100) * 100),
            requirement: 100,
            current: stats.totalCompleted,
        },
        {
            id: 'legend',
            name: 'Efsane',
            description: '500 görev tamamla',
            icon: Crown,
            color: 'from-yellow-400 to-amber-600',
            unlocked: stats.totalCompleted >= 500,
            progress: Math.min(100, (stats.totalCompleted / 500) * 100),
            requirement: 500,
            current: stats.totalCompleted,
        },
        // Seri
        {
            id: 'fire_starter',
            name: 'Ateş Başladı',
            description: '3 gün üst üste görev tamamla',
            icon: Flame,
            color: 'from-orange-500 to-red-500',
            unlocked: stats.longestStreak >= 3,
            progress: Math.min(100, (stats.longestStreak / 3) * 100),
            requirement: 3,
            current: stats.longestStreak,
        },
        {
            id: 'unstoppable',
            name: 'Durdurulamaz',
            description: '7 gün üst üste görev tamamla',
            icon: Zap,
            color: 'from-purple-500 to-pink-500',
            unlocked: stats.longestStreak >= 7,
            progress: Math.min(100, (stats.longestStreak / 7) * 100),
            requirement: 7,
            current: stats.longestStreak,
        },
        {
            id: 'two_weeks',
            name: 'İki Hafta',
            description: '14 gün üst üste görev tamamla',
            icon: TrendingUp,
            color: 'from-indigo-500 to-violet-500',
            unlocked: stats.longestStreak >= 14,
            progress: Math.min(100, (stats.longestStreak / 14) * 100),
            requirement: 14,
            current: stats.longestStreak,
        },
        {
            id: 'monthly_warrior',
            name: 'Aylık Savaşçı',
            description: '30 gün üst üste görev tamamla',
            icon: Calendar,
            color: 'from-fuchsia-500 to-purple-500',
            unlocked: stats.longestStreak >= 30,
            progress: Math.min(100, (stats.longestStreak / 30) * 100),
            requirement: 30,
            current: stats.longestStreak,
        },
        // Günlük
        {
            id: 'daily_warrior',
            name: 'Günlük Savaşçı',
            description: 'Bir günde 5+ görev tamamla',
            icon: Sun,
            color: 'from-amber-500 to-yellow-500',
            unlocked: stats.todayCompleted >= 5,
            progress: Math.min(100, (stats.todayCompleted / 5) * 100),
            requirement: 5,
            current: stats.todayCompleted,
        },
        {
            id: 'productivity_king',
            name: 'Verimlilik Kralı',
            description: 'Bir günde 10+ görev tamamla',
            icon: Crown,
            color: 'from-emerald-400 to-green-500',
            unlocked: stats.todayCompleted >= 10,
            progress: Math.min(100, (stats.todayCompleted / 10) * 100),
            requirement: 10,
            current: stats.todayCompleted,
        },
    ];

interface AchievementsModalProps {
    open: boolean;
    onClose: () => void;
    achievements: Achievement[];
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
    open,
    onClose,
    achievements
}) => {
    if (!open) return null;

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-full max-w-lg max-h-[85vh] overflow-hidden glass-panel animate-scaleIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-semibold text-slate-100">Başarılar</h2>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                            {unlockedCount}/{achievements.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Badges Grid */}
                <div className="p-4 overflow-y-auto max-h-[calc(85vh-60px)]">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {achievements.map(achievement => (
                            <div
                                key={achievement.id}
                                className={`
                                    relative group flex flex-col items-center p-3 rounded-xl transition-all
                                    ${achievement.unlocked
                                        ? 'bg-slate-700/50 hover:bg-slate-700/70'
                                        : 'bg-slate-800/50 opacity-60'
                                    }
                                `}
                            >
                                {/* Badge icon */}
                                <div className={`
                                    p-2.5 rounded-xl mb-2
                                    ${achievement.unlocked
                                        ? `bg-gradient-to-br ${achievement.color} shadow-lg`
                                        : 'bg-slate-700'
                                    }
                                `}>
                                    {achievement.unlocked ? (
                                        <achievement.icon className="w-5 h-5 text-white" />
                                    ) : (
                                        <Lock className="w-5 h-5 text-slate-500" />
                                    )}
                                </div>

                                {/* Name */}
                                <span className={`text-xs font-medium text-center leading-tight ${achievement.unlocked ? 'text-slate-200' : 'text-slate-500'
                                    }`}>
                                    {achievement.name}
                                </span>

                                {/* Progress bar for locked */}
                                {!achievement.unlocked && achievement.progress !== undefined && (
                                    <div className="w-full mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-500 transition-all"
                                            style={{ width: `${achievement.progress}%` }}
                                        />
                                    </div>
                                )}

                                {/* Tooltip - shown below to prevent cutoff */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-max max-w-[200px] text-center shadow-xl">
                                    <p className="text-xs text-slate-200 font-medium">{achievement.description}</p>
                                    {!achievement.unlocked && achievement.current !== undefined && (
                                        <p className="text-xs text-slate-400 mt-1">
                                            {achievement.current}/{achievement.requirement}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mini achievement preview for dashboard
interface AchievementPreviewProps {
    achievements: Achievement[];
    onClick: () => void;
}

export const AchievementPreview: React.FC<AchievementPreviewProps> = ({ achievements, onClick }) => {
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const recentUnlocked = achievements.filter(a => a.unlocked).slice(-3);

    return (
        <button
            onClick={onClick}
            className="w-full p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-all group"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-slate-300">Başarılar</span>
                    <span className="text-xs text-slate-500">{unlockedCount}/{achievements.length}</span>
                </div>

                <div className="flex -space-x-2">
                    {recentUnlocked.map(a => (
                        <div
                            key={a.id}
                            className={`w-6 h-6 rounded-full bg-gradient-to-br ${a.color} flex items-center justify-center border-2 border-slate-800`}
                        >
                            <a.icon className="w-3 h-3 text-white" />
                        </div>
                    ))}
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-800 text-[10px] text-slate-400 group-hover:bg-slate-600 transition-colors">
                        +{achievements.length - recentUnlocked.length}
                    </div>
                </div>
            </div>
        </button>
    );
};
