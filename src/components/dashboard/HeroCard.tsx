// HeroCard - Today summary with progress ring, streak, and smart greeting
import React from 'react';
import { Flame } from 'lucide-react';

interface HeroCardProps {
    todayTotal: number;
    todayCompleted: number;
    currentStreak: number;
    userName?: string;
}

export const HeroCard: React.FC<HeroCardProps> = ({
    todayTotal,
    todayCompleted,
    currentStreak,
    userName = 'Barış',
}) => {
    const progress = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;
    const remaining = todayTotal - todayCompleted;

    // SVG progress ring
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const hasStreak = currentStreak >= 1;

    // Smart greeting message (Simplified)
    const getGreeting = (): string => {
        const hour = new Date().getHours();

        if (hour < 6) return 'İyi geceler! Henüz uyumadın mı? 🦉';
        if (hour < 11) return 'Günaydın! Verimli bir gün olsun. ☀️';
        if (hour < 18) return 'Tünaydın! Günün nasıl geçiyor? ☕';
        return 'İyi akşamlar! Günü nasıl değerlendirdin? 🌙';
    };

    return (
        <div className="p-6 rounded-[14px] bg-slate-800/50 border border-slate-600/30">
            {/* 3-Column Layout: Greeting | Progress | Streak */}
            <div className="grid grid-cols-3 items-center gap-4">
                {/* Left Column - Greeting */}
                <div className="text-left">
                    <h2 className="text-xl font-semibold text-slate-100 mb-1">
                        Merhaba {userName}! 👋
                    </h2>
                    <p className="text-[14px] text-slate-400 leading-relaxed">
                        {getGreeting()}
                    </p>
                </div>

                {/* Center Column - Progress Ring */}
                <div className="flex justify-center">
                    <div className="relative shrink-0">
                        <svg width="100" height="100" className="-rotate-90">
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="7"
                                className="text-slate-700"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="none"
                                stroke="url(#progressGradient)"
                                strokeWidth="7"
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-slate-100">{todayCompleted}/{todayTotal}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Streak Display */}
                <div className="flex justify-end">
                    <div className={`
                        flex flex-col items-center justify-center shrink-0 px-5 py-3 rounded-xl
                        ${hasStreak
                            ? 'bg-gradient-to-br from-orange-900/40 to-amber-900/30 border border-orange-500/30'
                            : 'bg-slate-700/30 border border-slate-600/30'
                        }
                    `}>
                        <div className={`p-2 rounded-lg mb-1 ${hasStreak ? 'bg-orange-500/30' : 'bg-slate-600/50'}`}>
                            <Flame className={`w-7 h-7 ${hasStreak ? 'text-orange-400' : 'text-slate-500'}`} />
                        </div>
                        <span className={`text-2xl font-bold ${hasStreak ? 'text-orange-300' : 'text-slate-400'}`}>
                            {currentStreak}
                        </span>
                        <span className="text-[11px] text-slate-400">gün serisi</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
