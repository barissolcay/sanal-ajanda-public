// SwipeToComplete - Swipe gesture wrapper for task completion
import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2 } from 'lucide-react';

interface SwipeToCompleteProps {
    children: React.ReactNode;
    onSwipeComplete: () => void;
    disabled?: boolean;
    className?: string;
}

const SWIPE_THRESHOLD = 0.4; // 40% of container width triggers completion

export const SwipeToComplete: React.FC<SwipeToCompleteProps> = ({
    children,
    onSwipeComplete,
    disabled = false,
    className,
}) => {
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const containerWidthRef = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (disabled) return;
        startXRef.current = e.touches[0].clientX;
        containerWidthRef.current = containerRef.current?.offsetWidth || 0;
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping || disabled) return;
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startXRef.current;
        // Only allow swiping right (positive direction)
        if (deltaX > 0) {
            setSwipeX(Math.min(deltaX, containerWidthRef.current * 0.6));
        }
    };

    const handleTouchEnd = () => {
        if (!isSwiping || disabled) return;
        const threshold = containerWidthRef.current * SWIPE_THRESHOLD;

        if (swipeX >= threshold) {
            // Trigger completion
            onSwipeComplete();
        }

        // Reset
        setSwipeX(0);
        setIsSwiping(false);
    };

    // Mouse support for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
        if (disabled) return;
        startXRef.current = e.clientX;
        containerWidthRef.current = containerRef.current?.offsetWidth || 0;
        setIsSwiping(true);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startXRef.current;
            if (deltaX > 0) {
                setSwipeX(Math.min(deltaX, containerWidthRef.current * 0.6));
            }
        };

        const handleMouseUp = () => {
            const threshold = containerWidthRef.current * SWIPE_THRESHOLD;
            if (swipeX >= threshold) {
                onSwipeComplete();
            }
            setSwipeX(0);
            setIsSwiping(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const progress = containerWidthRef.current > 0
        ? swipeX / (containerWidthRef.current * SWIPE_THRESHOLD)
        : 0;

    return (
        <div
            ref={containerRef}
            className={clsx('relative overflow-hidden', className)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
        >
            {/* Swipe background indicator */}
            <div
                className={clsx(
                    'absolute inset-y-0 left-0 flex items-center justify-end pr-4 rounded-lg transition-colors',
                    progress > 0.8 ? 'bg-emerald-500/30' : 'bg-emerald-500/10'
                )}
                style={{ width: swipeX > 0 ? Math.max(swipeX, 50) : 0 }}
            >
                <CheckCircle2
                    className={clsx(
                        'w-6 h-6 transition-all',
                        progress > 0.8 ? 'text-emerald-400 scale-110' : 'text-emerald-500/50'
                    )}
                />
            </div>

            {/* Content */}
            <div
                className="relative transition-transform"
                style={{
                    transform: `translateX(${swipeX}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
                }}
            >
                {children}
            </div>
        </div>
    );
};
