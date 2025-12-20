// HoldToComplete - Hold button with circular progress to complete
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface HoldToCompleteProps {
    onComplete: () => void;
    disabled?: boolean;
    holdDuration?: number; // ms
}

export const HoldToComplete: React.FC<HoldToCompleteProps> = ({
    onComplete,
    disabled = false,
    holdDuration = 800, // 0.8 seconds to complete (faster)
}) => {
    const [progress, setProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const startTimeRef = useRef<number>(0);
    const animationRef = useRef<number | null>(null);
    const isHoldingRef = useRef(false); // Use ref to avoid closure issues

    const startHold = useCallback(() => {
        if (disabled || isCompleted) return;

        isHoldingRef.current = true;
        setIsHolding(true);
        startTimeRef.current = Date.now();

        const animate = () => {
            if (!isHoldingRef.current) return; // Check ref, not state

            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min(elapsed / holdDuration, 1);
            setProgress(newProgress);

            if (newProgress >= 1) {
                setIsCompleted(true);
                setIsHolding(false);
                isHoldingRef.current = false;
                // Small delay for visual feedback
                setTimeout(() => {
                    onComplete();
                }, 200);
                return;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [disabled, isCompleted, holdDuration, onComplete]);

    const endHold = useCallback(() => {
        if (!isHoldingRef.current || isCompleted) return;

        isHoldingRef.current = false;
        setIsHolding(false);

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        // Animate back to 0
        const startProgress = progress;
        const startTime = Date.now();
        const duration = 300;

        const animateBack = () => {
            const elapsed = Date.now() - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const newProgress = startProgress * (1 - eased);
            setProgress(newProgress);

            if (t < 1) {
                animationRef.current = requestAnimationFrame(animateBack);
            } else {
                setProgress(0);
            }
        };

        animationRef.current = requestAnimationFrame(animateBack);
    }, [isCompleted, progress]);

    // Global mouse/touch up handlers
    useEffect(() => {
        const handleEnd = () => {
            if (isHoldingRef.current) {
                endHold();
            }
        };

        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('touchcancel', handleEnd);

        return () => {
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
            document.removeEventListener('touchcancel', handleEnd);
        };
    }, [endHold]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // SVG circle properties
    const size = 80;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        startHold();
    };

    const handleTouchStart = () => {
        // Don't call preventDefault on touch - let it be passive
        startHold();
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <div
                className={`relative select-none touch-none outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                {/* Background circle */}
                <svg
                    width={size}
                    height={size}
                    className="transform -rotate-90"
                >
                    {/* Track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(100, 116, 139, 0.3)"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={isCompleted ? '#10b981' : '#22c55e'}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{
                            transition: isHolding ? 'none' : 'stroke-dashoffset 0.3s ease-out',
                            filter: progress > 0.5 ? `drop-shadow(0 0 ${8 + progress * 12}px rgba(34, 197, 94, ${progress * 0.8}))` : 'none',
                        }}
                    />
                </svg>

                {/* Center button */}
                <div
                    className={`absolute inset-0 flex items-center justify-center transition-transform duration-150 ${isHolding ? 'scale-95' : 'scale-100'
                        }`}
                >
                    <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${isCompleted
                            ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                            : isHolding
                                ? 'bg-slate-700 shadow-inner'
                                : 'bg-slate-800 hover:bg-slate-700 shadow-lg'
                            }`}
                        style={{
                            boxShadow: isHolding && progress > 0.3
                                ? `0 0 ${20 + progress * 30}px rgba(34, 197, 94, ${progress * 0.5}), inset 0 2px 4px rgba(0,0,0,0.3)`
                                : undefined,
                        }}
                    >
                        <CheckCircle2
                            className={`w-8 h-8 transition-all duration-200 ${isCompleted
                                ? 'text-white scale-110'
                                : progress > 0.5
                                    ? 'text-emerald-400'
                                    : 'text-slate-400'
                                }`}
                        />
                    </div>
                </div>
            </div>

            {/* Label */}
            <span className={`text-sm font-medium transition-colors duration-200 ${isCompleted ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                {isCompleted
                    ? 'Tamamlandı! ✓'
                    : isHolding
                        ? `%${Math.round(progress * 100)}`
                        : 'Tamamlamak için basılı tut'}
            </span>

            {/* Progress bar */}
            {(isHolding || progress > 0) && !isCompleted && (
                <div className="h-1 w-24 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                        style={{
                            width: `${progress * 100}%`,
                            transition: isHolding ? 'none' : 'width 0.3s ease-out'
                        }}
                    />
                </div>
            )}
        </div>
    );
};
