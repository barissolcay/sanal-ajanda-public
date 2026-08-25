// Sidebar Component - Premium Enhanced
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
    Calendar,
    CalendarDays,
    CalendarRange,
    CalendarClock,
    List,
    BookOpen,
    Film,
    Target,
    MapPin,
    Briefcase,
    Heart,
    Dumbbell,
    Code,
    Music,
    GraduationCap,
    Coffee,
    ShoppingBag,
    DollarSign,
    Inbox,
    Layers,
    CheckCircle2,
    Settings,
    Sparkles,
    LayoutGrid,
    LucideIcon,
    LogOut,
    AlertCircle,
    StickyNote,
} from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useTasks } from '../../hooks/useTasks';
import { useSettings } from '../../hooks/useSettings';
import { supabase } from '../../lib/supabaseClient';
import type { Category } from '../../domain/types';
import { useSidebar } from '../../context/SidebarContext';
import { isOverdue } from '../../domain/dateUtils';

interface NavItem {
    to: string;
    icon: React.ReactNode;
    label: string;
    color?: string;
    showBadge?: boolean;
    badgeCount?: number;
}

const viewItems: NavItem[] = [
    { to: '/', icon: <Sparkles className="w-5 h-5" />, label: 'Anasayfa' },
    { to: '/today', icon: <Calendar className="w-5 h-5" />, label: 'Bugün' },
    { to: '/week', icon: <CalendarDays className="w-5 h-5" />, label: 'Bu Hafta' },
    { to: '/month', icon: <CalendarRange className="w-5 h-5" />, label: 'Bu Ay' },
    { to: '/year', icon: <CalendarClock className="w-5 h-5" />, label: 'Bu Yıl' },
];

// Icon map for dynamic categories
const iconMap: Record<string, LucideIcon> = {
    List,
    BookOpen,
    Film,
    Target,
    MapPin,
    Briefcase,
    Heart,
    Dumbbell,
    Code,
    Music,
    GraduationCap,
    Coffee,
    ShoppingBag,
    DollarSign,
    Sparkles,
    Inbox,
    Layers,
    Calendar,
    CheckCircle2,
    Settings,
};

const getIconComponent = (iconName: string): React.ReactNode => {
    const IconComponent = iconMap[iconName] || List;
    return <IconComponent className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />;
};

const NavItemComponent: React.FC<NavItem> = ({ to, icon, label, color, showBadge, badgeCount }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/' && to !== '/lists' && location.pathname === to);

    return (
        <NavLink
            to={to}
            className={clsx(
                'group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ease-out',
                isActive
                    ? 'bg-gradient-to-r from-indigo-500/40 to-cyan-400/30 text-slate-50 shadow-lg shadow-indigo-500/20 border border-indigo-400/40'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-50 hover:shadow-md'
            )}
        >
            <span className={clsx(
                'transition-all duration-200',
                isActive && 'drop-shadow-[0_0_8px_currentColor]'
            )} style={color ? { color } : undefined}>
                {icon}
            </span>
            <span className="font-medium flex items-center justify-between flex-1 gap-2">
                <span className="truncate">{label}</span>
                {badgeCount !== undefined && badgeCount > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 shadow-sm">
                        {badgeCount}
                    </span>
                )}
                {showBadge && (badgeCount === undefined || badgeCount === 0) && (
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                )}
            </span>
        </NavLink>
    );
};

const NavGroup: React.FC<{ title: string; items: NavItem[] }> = ({ title, items }) => (
    <div className="space-y-1">
        <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
        </h3>
        {items.map((item) => (
            <NavItemComponent key={item.to} {...item} />
        ))}
    </div>
);

interface SidebarProps {
    className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
    const { categories, loading } = useCategories();
    const { tasks } = useTasks({ showCompleted: false });
    const { settings } = useSettings();
    const { isOpen, close } = useSidebar();
    const location = useLocation();

    // Count overdue tasks
    const overdueCount = React.useMemo(() => {
        return tasks.filter(task => task.status !== 'done' && isOverdue(task)).length;
    }, [tasks]);

    // Count undated (backlog plans) tasks
    const undatedCount = React.useMemo(() => {
        return tasks.filter(task => task.status !== 'done' && !task.startDate).length;
    }, [tasks]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // Close sidebar on route change (mobile)
    React.useEffect(() => {
        close();
    }, [location.pathname]);

    // Custom Undated Settings
    const undatedName = settings.undatedViewName || 'Planlar / Süresiz';
    const undatedColor = settings.undatedViewColor || '#06b6d4';
    const undatedIcon = settings.undatedViewIcon || 'Layers';
    const isUndatedVisible = settings.undatedViewVisible !== false;

    // Sorted categories (defaults first, then custom sorted by order)
    const sortedCategories = [...categories].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.order - b.order;
    });

    const listItems: NavItem[] = [
        // Dedicated Planlar / Süresiz entry (if visible)
        ...(isUndatedVisible ? [{
            to: '/lists/undated',
            icon: getIconComponent(undatedIcon),
            label: undatedName,
            color: undatedColor,
            badgeCount: undatedCount > 0 ? undatedCount : undefined,
        }] : []),
        // Category entries
        ...sortedCategories.map((cat: Category) => ({
            to: `/lists/${cat.id}`,
            icon: getIconComponent(cat.icon),
            label: cat.name,
            color: cat.color,
        })),
    ];

    // Dynamic otherItems with overdue badge
    const otherItems: NavItem[] = [
        { to: '/lists', icon: <LayoutGrid className="w-5 h-5" />, label: 'Tüm Listeler' },
        { to: '/notes', icon: <StickyNote className="w-5 h-5" />, label: 'Notlar' },
        { to: '/overdue', icon: <AlertCircle className="w-5 h-5" />, label: 'Sessiz Çığlıklar', badgeCount: overdueCount > 0 ? overdueCount : undefined, showBadge: overdueCount > 0 },
        { to: '/completed', icon: <CheckCircle2 className="w-5 h-5" />, label: 'Tamamlananlar' },
        { to: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Ayarlar' },
    ];

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={close}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={clsx(
                    "flex flex-col h-screen w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800/60 shadow-xl transition-all duration-300 ease-in-out z-50",
                    // Mobile positioning
                    "fixed md:relative top-0 left-0",
                    // Toggle visibility on mobile
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    className
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                                Sanal Ajandam
                            </h1>
                            <p className="text-xs text-slate-500">V2</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                    <NavGroup title="Görünümler" items={viewItems} />
                    <NavGroup title="Listeler" items={loading ? [] : listItems} />
                    <NavGroup title="Diğer" items={otherItems} />
                </nav>

                {/* Footer + Logout */}
                <div className="px-4 py-4 border-t border-slate-800/60 flex flex-col gap-2">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group"
                    >
                        <LogOut size={16} className="group-hover:text-red-400 text-slate-500" />
                        <span className="font-medium text-sm">Çıkış Yap</span>
                    </button>
                    <p className="text-xs text-slate-700 text-center mt-2">
                        © {new Date().getFullYear()} Sanal Ajandam
                    </p>
                </div>
            </aside>
        </>
    );
};
