// HeroCard - Today summary with progress ring, streak, and smart greeting
import React from 'react';
import { Flame, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface HeroCardProps {
    todayTotal: number;
    todayCompleted: number;
    todayOverdueCompleted?: number;
    currentStreak: number;
    userName?: string;
}

export const HeroCard: React.FC<HeroCardProps> = ({
    todayTotal,
    todayCompleted,
    todayOverdueCompleted = 0,
    currentStreak,
    userName = 'Barış',
}) => {
    const progress = todayTotal > 0 ? Math.min((todayCompleted / todayTotal) * 100, 100) : (todayCompleted > 0 ? 100 : 0);

    // SVG progress ring
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const hasStreak = currentStreak >= 1;

    // Smart greeting message
    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 6) return 'İyi geceler! Henüz uyumadın mı? 🦉';
        if (hour < 11) return 'Günaydın! Harika bir gün olsun. ☀️';
        if (hour < 18) return 'Tünaydın! Günün nasıl geçiyor? ☕';
        return 'İyi akşamlar! Günü nasıl değerlendirdin? 🌙';
    };

    return (
        <div className="p-5 md:p-6 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-xl backdrop-blur-xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
                {/* Left Section - Greeting & Badges */}
                <div className="text-center sm:text-left flex-1 min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-slate-100 mb-1">
                        Merhaba {userName}! 👋
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400">
                        {getGreeting()}
                    </p>

                    {/* Telafi Edilen Gecikmiş Görevler Rozeti */}
                    {todayOverdueCompleted > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-sm animate-fade-in">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>+{todayOverdueCompleted} Gecikmiş Telafi Edildi 🎉</span>
                        </div>
                    )}
                </div>

                {/* Right Section - Progress Ring & Streak */}
                <div className="flex items-center gap-5 sm:gap-6 shrink-0">
                    {/* Progress Ring */}
                    <div className="relative shrink-0 flex flex-col items-center">
                        <svg width="96" height="96" className="-rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="7"
                                className="text-slate-800"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r={radius}
                                fill="none"
                                stroke="url(#progressGradient)"
                                strokeWidth="7"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-700 ease-out"
                            />
                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#6366f1" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-slate-100 leading-none">
                                {todayCompleted}/{todayTotal}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">Bugün</span>
                        </div>
                    </div>

                    {/* Streak Display */}
                    <div className={clsx(
                        "flex flex-col items-center justify-center px-4 py-3 rounded-2xl border transition-all shrink-0 min-w-[76px]",
                        hasStreak
                            ? "bg-gradient-to-br from-amber-500/20 to-orange-600/10 border-orange-500/40 shadow-lg shadow-orange-500/10"
                            : "bg-slate-950/60 border-slate-800"
                    )}>
                        <div className={clsx(
                            "p-1.5 rounded-xl mb-1",
                            hasStreak ? "bg-orange-500/20 text-orange-400" : "bg-slate-800 text-slate-500"
                        )}>
                            <Flame className="w-5 h-5" />
                        </div>
                        <span className={clsx(
                            "text-xl font-bold leading-none",
                            hasStreak ? "text-orange-300" : "text-slate-400"
                        )}>
                            {currentStreak}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">gün serisi</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
