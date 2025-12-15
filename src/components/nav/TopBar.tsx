import React from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { useSidebar } from '../../context/SidebarContext';

export interface TopBarProps {
    title: string;
    subtitle?: string;
    showDateNav?: boolean;
    onPrev?: () => void;
    onNext?: () => void;
    onToday?: () => void;
    showTodayButton?: boolean;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    showCompleted?: boolean;
    onShowCompletedChange?: (show: boolean) => void;
    onNewTask?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
    title,
    subtitle,
    showDateNav = false,
    onPrev,
    onNext,
    onToday,
    showTodayButton = true,
    searchQuery = '',
    onSearchChange,
    showCompleted = false,
    onShowCompletedChange,
    onNewTask,
}) => {
    const { open } = useSidebar();
    return (
        <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-slate-900/70 border-b border-slate-800/60 backdrop-blur-xl">
            {/* Left: Title and Navigation */}
            <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={open}
                    className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-100 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div>
                    <h1 className="text-xl font-bold text-slate-100">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-slate-400 hidden sm:block">{subtitle}</p>
                    )}
                </div>

                {showDateNav && (
                    <div className="flex items-center gap-1 ml-2 md:ml-4">
                        <button
                            onClick={onPrev}
                            className="p-1.5 md:p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                            aria-label="Önceki"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onNext}
                            className="p-1.5 md:p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                            aria-label="Sonraki"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        {showTodayButton && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToday}
                                className="ml-2 hidden sm:flex"
                            >
                                Bugün
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Search, Toggle, New Task */}
            <div className="flex items-center gap-4">
                {/* Search */}
                {onSearchChange && (
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Ara..."
                            className="w-32 md:w-64 pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all"
                        />
                    </div>
                )}

                {/* Show Completed Toggle */}
                {onShowCompletedChange && (
                    <div className="hidden md:block">
                        <Checkbox
                            checked={showCompleted}
                            onChange={onShowCompletedChange}
                            label="Tamamlananları göster"
                        />
                    </div>
                )}

                {/* New Task Button */}
                {onNewTask && (
                    <Button variant="primary" size="md" onClick={onNewTask}>
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Yeni Görev</span>
                    </Button>
                )}
            </div>
        </header>
    );
};
