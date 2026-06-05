// MotivationCard - Random motivational messages
import React, { useMemo } from 'react';
import { Sparkles, Heart, Rocket, Coffee, Sun, Moon, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Quote {
    text: string;
    emoji: string;
    icon: LucideIcon;
    gradient: string;
}

const quotes: Quote[] = [
    {
        text: 'Bugün harika işler başaracaksın!',
        emoji: '🚀',
        icon: Rocket,
        gradient: 'from-indigo-500/20 to-purple-500/10'
    },
    {
        text: 'Her küçük adım büyük başarılara götürür.',
        emoji: '✨',
        icon: Sparkles,
        gradient: 'from-amber-500/20 to-orange-500/10'
    },
    {
        text: 'İnandığın şeyleri yapmaya devam et!',
        emoji: '💪',
        icon: Flame,
        gradient: 'from-red-500/20 to-pink-500/10'
    },
    {
        text: 'Kendine güven, her şey mümkün.',
        emoji: '🌟',
        icon: Sun,
        gradient: 'from-yellow-500/20 to-amber-500/10'
    },
    {
        text: 'Bugün dünden daha iyi ol.',
        emoji: '📈',
        icon: Sparkles,
        gradient: 'from-emerald-500/20 to-teal-500/10'
    },
    {
        text: 'Sen bunu yapabilirsin!',
        emoji: '🎯',
        icon: Heart,
        gradient: 'from-pink-500/20 to-rose-500/10'
    },
    {
        text: 'Önce kahve, sonra dünya fethi.',
        emoji: '☕',
        icon: Coffee,
        gradient: 'from-amber-600/20 to-orange-600/10'
    },
    {
        text: 'Gece çalışanlar için: Sen harikasın!',
        emoji: '🌙',
        icon: Moon,
        gradient: 'from-slate-500/20 to-indigo-500/10'
    },
];

// Get greeting based on time of day
const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 6) return 'İyi geceler';
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
};

interface MotivationCardProps {
    userName?: string;
}

export const MotivationCard: React.FC<MotivationCardProps> = ({ userName }) => {
    // Pick a random quote based on the day (so it stays consistent for the day)
    const quote = useMemo(() => {
        const today = new Date().getDate();
        return quotes[today % quotes.length];
    }, []);

    const greeting = getGreeting();
    const Icon = quote.icon;

    return (
        <div className={`
            relative p-5 rounded-2xl border border-slate-700/50 overflow-hidden
            bg-gradient-to-br ${quote.gradient}
        `}>
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <Icon className="w-full h-full" />
            </div>

            <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{quote.emoji}</span>
                    <span className="text-slate-400 text-sm">{greeting}{userName ? `, ${userName}` : ''}!</span>
                </div>

                <p className="text-lg font-medium text-slate-100">
                    {quote.text}
                </p>
            </div>
        </div>
    );
};
