// ConfirmCompleteModal - Fun confirmation modal for task completion
import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ConfirmCompleteModalProps {
    isOpen: boolean;
    taskTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const fireConfetti = () => {
    // First burst
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ec4899'],
    });

    // Second burst after a small delay
    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#6366f1', '#22d3ee', '#10b981'],
        });
    }, 150);

    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#f59e0b', '#ec4899', '#a855f7'],
        });
    }, 300);
};

export const ConfirmCompleteModal: React.FC<ConfirmCompleteModalProps> = ({
    isOpen,
    taskTitle,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        fireConfetti();
        onConfirm();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" />

            {/* Modal */}
            <div className="relative w-full max-w-sm glass-panel p-6 animate-scaleIn text-center">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Fun emoji */}
                <div className="text-5xl mb-4 animate-bounce">🤫</div>

                {/* Fun text */}
                <h3 className="text-xl font-bold text-slate-100 mb-2">
                    Şşt... Yaptın mı görevi?
                </h3>

                <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                    "{taskTitle}"
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleConfirm}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        Evet, hallettim! ✓
                    </button>

                    <button
                        onClick={onCancel}
                        className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                    >
                        Hayır, daha değil
                    </button>
                </div>
            </div>
        </div>
    );
};

export { fireConfetti };
