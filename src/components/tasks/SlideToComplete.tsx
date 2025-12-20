// SlideToComplete - iPhone-style slide to complete with spring physics
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface SlideToCompleteProps {
    onComplete: () => void;
    disabled?: boolean;
    label?: string;
    resetKey?: number; // Change this to force reset
}

export const SlideToComplete: React.FC<SlideToCompleteProps> = ({
    onComplete,
    disabled = false,
    label = 'Tamamlamak için kaydır',
    resetKey = 0,
}) => {
    const [slideX, setSlideX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const maxSlideRef = useRef(0);
    const animationRef = useRef<number>();

    const THUMB_SIZE = 56;
    const COMPLETE_THRESHOLD = 0.9; // 90%
    const SPRING_STIFFNESS = 0.15;
    const SPRING_DAMPING = 0.7;

    // Reset when resetKey changes
    useEffect(() => {
        setSlideX(0);
        setIsCompleted(false);
    }, [resetKey]);

    // Calculate max slide on mount
    useEffect(() => {
        const updateMaxSlide = () => {
            if (containerRef.current) {
                maxSlideRef.current = containerRef.current.offsetWidth - THUMB_SIZE - 8;
            }
        };
        updateMaxSlide();
        window.addEventListener('resize', updateMaxSlide);
        return () => window.removeEventListener('resize', updateMaxSlide);
    }, []);

    // Spring animation for smooth return
    const animateSpringBack = useCallback((fromX: number) => {
        let currentX = fromX;
        let velocity = 0;
        const targetX = 0;

        const animate = () => {
            const distance = targetX - currentX;
            const springForce = distance * SPRING_STIFFNESS;
            velocity = (velocity + springForce) * SPRING_DAMPING;
            currentX += velocity;

            if (Math.abs(distance) < 0.5 && Math.abs(velocity) < 0.5) {
                setSlideX(0);
                return;
            }

            setSlideX(currentX);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();
    }, []);

    // Spring animation to complete
    const animateToEnd = useCallback(() => {
        let currentX = slideX;
        let velocity = 5;
        const targetX = maxSlideRef.current;

        const animate = () => {
            const distance = targetX - currentX;
            const springForce = distance * 0.2;
            velocity = (velocity + springForce) * 0.85;
            currentX += velocity;

            if (Math.abs(distance) < 1) {
                setSlideX(targetX);
                setIsCompleted(true);
                setTimeout(() => {
                    onComplete();
                }, 150);
                return;
            }

            setSlideX(currentX);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();
    }, [slideX, onComplete]);

    const handleStart = (clientX: number) => {
        if (disabled || isCompleted) return;
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        startXRef.current = clientX - slideX;
        setIsDragging(true);
    };

    const handleMove = (clientX: number) => {
        if (!isDragging || disabled || isCompleted) return;
        const newX = clientX - startXRef.current;
        const clampedX = Math.max(0, Math.min(newX, maxSlideRef.current));
        setSlideX(clampedX);
    };

    const handleEnd = () => {
        if (!isDragging || disabled || isCompleted) return;
        setIsDragging(false);

        const progress = slideX / maxSlideRef.current;
        if (progress >= COMPLETE_THRESHOLD) {
            animateToEnd();
        } else {
            animateSpringBack(slideX);
        }
    };

    // Touch events
    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault();
        handleStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
    };

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handleStart(e.clientX);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
        const handleMouseUp = () => handleEnd();
        const handleTouchEnd = () => handleEnd();

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, slideX, isCompleted]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const progress = maxSlideRef.current > 0 ? slideX / maxSlideRef.current : 0;
    const labelOpacity = Math.max(0, 1 - progress * 2);
    const successOpacity = isCompleted ? 1 : 0;

    return (
        <div
            ref={containerRef}
            className={`relative h-14 rounded-2xl overflow-hidden select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            style={{
                background: isCompleted
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #1e293b, #0f172a)',
                boxShadow: isCompleted
                    ? '0 4px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.05)',
            }}
        >
            {/* Progress glow effect */}
            <div
                className="absolute inset-y-0 left-0 rounded-2xl pointer-events-none"
                style={{
                    width: slideX + THUMB_SIZE,
                    background: `linear-gradient(90deg, 
                        rgba(16, 185, 129, ${0.1 + progress * 0.4}), 
                        rgba(34, 197, 94, ${0.1 + progress * 0.5})
                    )`,
                    boxShadow: progress > 0.3
                        ? `0 0 ${20 + progress * 20}px rgba(16, 185, 129, ${progress * 0.5})`
                        : 'none',
                    transition: isDragging ? 'none' : 'all 0.1s ease-out',
                }}
            />

            {/* Animated chevrons */}
            <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none gap-0"
                style={{
                    opacity: labelOpacity,
                    transform: `translateX(${progress * 20}px)`,
                }}
            >
                <span className="text-sm font-medium text-slate-400 mr-2">{label}</span>
                <div className="flex">
                    <ChevronRight
                        className="w-4 h-4 text-emerald-500/60"
                        style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                    />
                    <ChevronRight
                        className="w-4 h-4 text-emerald-500/40 -ml-2"
                        style={{ animation: 'pulse 1.5s ease-in-out infinite 0.2s' }}
                    />
                    <ChevronRight
                        className="w-4 h-4 text-emerald-500/20 -ml-2"
                        style={{ animation: 'pulse 1.5s ease-in-out infinite 0.4s' }}
                    />
                </div>
            </div>

            {/* Success text */}
            <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                    opacity: successOpacity,
                    transform: `scale(${successOpacity})`,
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                <span className="text-white font-bold text-lg">Tamamlandı! ✓</span>
            </div>

            {/* Slider thumb */}
            <div
                ref={thumbRef}
                className={`absolute top-1 left-1 w-12 h-12 rounded-xl flex items-center justify-center
                    ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}
                    ${!disabled && !isCompleted ? 'hover:scale-105' : ''}
                `}
                style={{
                    transform: `translateX(${slideX}px) ${isDragging ? 'scale(1.05)' : ''}`,
                    background: isCompleted
                        ? 'linear-gradient(135deg, #ffffff, #d1fae5)'
                        : 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                    boxShadow: isDragging
                        ? '0 8px 25px rgba(0,0,0,0.3), 0 0 0 3px rgba(16, 185, 129, 0.3)'
                        : '0 4px 15px rgba(0,0,0,0.2)',
                    transition: isDragging ? 'box-shadow 0.15s ease' : 'all 0.15s ease',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onMouseDown={handleMouseDown}
            >
                <CheckCircle2
                    className={`w-6 h-6 transition-all duration-200 ${isCompleted ? 'text-emerald-600' :
                            progress > 0.5 ? 'text-emerald-500' : 'text-slate-400'
                        }`}
                    style={{
                        transform: `scale(${1 + progress * 0.2})`,
                    }}
                />
            </div>
        </div>
    );
};
