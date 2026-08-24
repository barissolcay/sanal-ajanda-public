// Domain Types for Sanal Ajandam V2

// Default category IDs (system categories)
export type DefaultCategoryId = 'general' | 'reading' | 'watching' | 'goal' | 'travel';

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 0 | 1 | 2; // 0=normal, 1=low, 2=high

// Custom category interface
export interface Category {
    id: string;
    name: string;
    icon: string;      // Lucide icon name
    color: string;     // Hex color (e.g., '#6366f1')
    isDefault: boolean; // System category (cannot be deleted)
    order: number;      // Display order
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    category: string;      // Category ID (can be default or custom)
    status: TaskStatus;
    priority: TaskPriority;
    color?: string;        // Custom color override (hex)
    startDate?: string;    // 'YYYY-MM-DD' (optional for undated/backlog tasks)
    endDate?: string;      // 'YYYY-MM-DD' (optional, falls back to startDate)
    startTime?: string;    // 'HH:mm'
    endTime?: string;      // 'HH:mm'
    createdAt: string;     // ISO datetime
    updatedAt: string;     // ISO datetime
}

export interface Note {
    id: string;
    title: string;
    content: string;
    color?: string;        // Hex color
    isPinned: boolean;
    tags: string[];
    createdAt: string;     // ISO datetime
    updatedAt: string;     // ISO datetime
}

export interface Settings {
    id: number;                    // always 1
    showCompletedByDefault: boolean;
    weekStartsOn: 0 | 1;           // 0=Sunday, 1=Monday (date-fns compatible)
}

// Default categories with colors
export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'general', name: 'Genel', icon: 'List', color: '#64748b', isDefault: true, order: 0 },
    { id: 'reading', name: 'Okuma Listesi', icon: 'BookOpen', color: '#10b981', isDefault: true, order: 1 },
    { id: 'watching', name: 'İzleme Listesi', icon: 'Film', color: '#a855f7', isDefault: true, order: 2 },
    { id: 'goal', name: 'Hedefler', icon: 'Target', color: '#f59e0b', isDefault: true, order: 3 },
    { id: 'travel', name: 'Gezme Listesi', icon: 'MapPin', color: '#06b6d4', isDefault: true, order: 4 },
];

export const AVAILABLE_CATEGORY_ICONS = [
    { name: 'List', label: 'Liste' },
    { name: 'BookOpen', label: 'Kitap / Okuma' },
    { name: 'Film', label: 'Film / Dizi' },
    { name: 'Target', label: 'Hedef' },
    { name: 'MapPin', label: 'Gezi / Seyahat' },
    { name: 'Briefcase', label: 'İş / Proje' },
    { name: 'GraduationCap', label: 'Ders / Eğitim' },
    { name: 'Code', label: 'Yazılım / Kod' },
    { name: 'Heart', label: 'Sağlık / Yaşam' },
    { name: 'Dumbbell', label: 'Spor / Egzersiz' },
    { name: 'Music', label: 'Müzik / Sanat' },
    { name: 'ShoppingBag', label: 'Alışveriş' },
    { name: 'Coffee', label: 'Kişisel / Mola' },
    { name: 'DollarSign', label: 'Finans / Bütçe' },
    { name: 'Sparkles', label: 'Özel / Fikir' },
    { name: 'Inbox', label: 'Gelen / Havuz' },
    { name: 'Layers', label: 'Planlar / Katmanlar' },
] as const;

// Status display info
export const STATUS_INFO: Record<TaskStatus, { label: string; color: string }> = {
    pending: { label: 'Bekliyor', color: 'text-slate-400' },
    in_progress: { label: 'Devam Ediyor', color: 'text-cyan-400' },
    done: { label: 'Tamamlandı', color: 'text-green-400' },
    cancelled: { label: 'İptal Edildi', color: 'text-red-400' },
};

// Priority display info
export const PRIORITY_INFO: Record<TaskPriority, { label: string; color: string; icon: string }> = {
    0: { label: 'Normal', color: 'text-slate-400', icon: '●' },
    1: { label: 'Düşük', color: 'text-blue-400', icon: '▽' },
    2: { label: 'Yüksek', color: 'text-red-400', icon: '▲' },
};

// Default settings
export const DEFAULT_SETTINGS: Settings = {
    id: 1,
    showCompletedByDefault: false,
    weekStartsOn: 1, // Monday
};

// Predefined color palette for custom colors
export const COLOR_PALETTE = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#a855f7', // Purple
    '#d946ef', // Fuchsia
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#eab308', // Yellow
    '#84cc16', // Lime
    '#22c55e', // Green
    '#10b981', // Emerald
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#0ea5e9', // Sky
    '#3b82f6', // Blue
    '#64748b', // Slate
];

// Helper to get category by ID (with fallback)
export function getCategoryById(categories: Category[], id: string): Category | undefined {
    return categories.find(c => c.id === id);
}

// Helper to get category color
export function getCategoryColor(categories: Category[], categoryId: string): string {
    const category = getCategoryById(categories, categoryId);
    return category?.color || '#64748b'; // Default slate if not found
}

// Legacy support - keep for backward compatibility during migration
export type TaskCategory = DefaultCategoryId | string;
