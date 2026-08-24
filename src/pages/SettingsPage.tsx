// SettingsPage - User preferences and category management
import React, { useState } from 'react';
import { TopBar } from '../components/nav/TopBar';
import { Checkbox } from '../components/ui/Checkbox';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useSettings } from '../hooks/useSettings';
import { useCategories } from '../hooks/useCategories';
import {
    RotateCcw,
    Plus,
    Trash2,
    Check,
    X,
    Edit2,
    ArrowUp,
    ArrowDown,
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
    LucideIcon,
} from 'lucide-react';
import { COLOR_PALETTE, AVAILABLE_CATEGORY_ICONS } from '../domain/types';
import type { Category } from '../domain/types';

// Map icon names to Lucide icon components
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
};

const getCategoryIcon = (iconName: string): LucideIcon => {
    return iconMap[iconName] || List;
};

export const SettingsPage: React.FC = () => {
    const { settings, updateSettings, resetSettings } = useSettings();
    const { categories, createCategory, updateCategory, deleteCategory, moveCategory } = useCategories();

    // New category form state
    const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(COLOR_PALETTE[0]);
    const [newCategoryIcon, setNewCategoryIcon] = useState<string>('List');

    // Edit state
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryColor, setEditCategoryColor] = useState('');
    const [editCategoryIcon, setEditCategoryIcon] = useState<string>('List');

    const handleShowCompletedChange = (checked: boolean) => {
        updateSettings({ showCompletedByDefault: checked });
    };

    const handleWeekStartChange = (weekStartsOn: 0 | 1) => {
        updateSettings({ weekStartsOn });
    };

    const handleCreateCategory = async () => {
        if (newCategoryName.trim()) {
            await createCategory({
                name: newCategoryName.trim(),
                color: newCategoryColor,
                icon: newCategoryIcon,
                isDefault: false,
            });
            setNewCategoryName('');
            setNewCategoryColor(COLOR_PALETTE[0]);
            setNewCategoryIcon('List');
            setShowNewCategoryForm(false);
        }
    };

    const handleStartEdit = (category: Category) => {
        setEditingCategoryId(category.id);
        setEditCategoryName(category.name);
        setEditCategoryColor(category.color);
        setEditCategoryIcon(category.icon || 'List');
    };

    const handleSaveEdit = async () => {
        if (editingCategoryId && editCategoryName.trim()) {
            await updateCategory(editingCategoryId, {
                name: editCategoryName.trim(),
                color: editCategoryColor,
                icon: editCategoryIcon,
            });
            setEditingCategoryId(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingCategoryId(null);
    };

    const handleDeleteCategory = async (id: string) => {
        if (confirm('Bu listeyi silmek istediğinize emin misiniz? Listedeki görevler "Genel" kategorisine taşınacak.')) {
            await deleteCategory(id);
        }
    };

    // Sort categories (defaults first, then custom sorted by order)
    const sortedCategories = [...categories].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.order - b.order;
    });

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Ayarlar" />

            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Categories Management */}
                    <div className="glass-panel p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-100">
                                    Listeler / Kategoriler & Yan Bar
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Yan bardaki listelerin sırasını, renklerini ve simgelerini özelleştirin.
                                </p>
                            </div>
                            {!showNewCategoryForm && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowNewCategoryForm(true)}
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Yeni Liste</span>
                                </Button>
                            )}
                        </div>

                        {/* New category form */}
                        {showNewCategoryForm && (
                            <div className="mb-5 p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 shadow-lg space-y-4">
                                <h3 className="text-sm font-semibold text-slate-200">Yeni Liste Oluştur</h3>
                                <div className="space-y-3">
                                    <Input
                                        label="Liste Adı"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Örn: Alışveriş Listesi"
                                    />

                                    {/* Icon Picker */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Simge</label>
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1.5 bg-slate-900/60 rounded-lg border border-slate-700/50">
                                            {AVAILABLE_CATEGORY_ICONS.map((iconItem) => {
                                                const IconComp = getCategoryIcon(iconItem.name);
                                                const isSelected = newCategoryIcon === iconItem.name;
                                                return (
                                                    <button
                                                        key={iconItem.name}
                                                        type="button"
                                                        onClick={() => setNewCategoryIcon(iconItem.name)}
                                                        title={iconItem.label}
                                                        className={`p-2 rounded-lg flex items-center justify-center border transition-all ${
                                                            isSelected
                                                                ? 'bg-indigo-500/30 border-indigo-400 text-cyan-300 ring-2 ring-indigo-500/40 shadow-sm'
                                                                : 'border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                        }`}
                                                    >
                                                        <IconComp className="w-4 h-4" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Color Picker */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1.5">Renk</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COLOR_PALETTE.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setNewCategoryColor(color)}
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all ${
                                                        newCategoryColor === color ? 'border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {newCategoryColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button variant="primary" size="sm" onClick={handleCreateCategory}>
                                            Oluştur
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setShowNewCategoryForm(false)}>
                                            İptal
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Category list */}
                        <div className="space-y-2">
                            {/* Dedicated Planlar / Süresiz System View Item */}
                            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-cyan-500/30 shadow-sm">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                                    style={{ backgroundColor: '#06b6d4' }}
                                >
                                    <Layers className="w-4 h-4" />
                                </div>

                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                    <span className="text-slate-200 font-semibold truncate">Planlar / Süresiz</span>
                                    <span className="text-[10px] text-cyan-300 px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/30 rounded-full font-medium">
                                        Sistem Havuzu
                                    </span>
                                </div>

                                <span className="text-xs text-slate-400 hidden sm:inline">
                                    Tarihsiz planlar havuzu
                                </span>
                            </div>

                            {sortedCategories.map((category, index) => {
                                const IconComponent = getCategoryIcon(category.icon);
                                const isFirst = index === 0;
                                const isLast = index === sortedCategories.length - 1;

                                return (
                                    <div
                                        key={category.id}
                                        className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-slate-600/60 transition-all"
                                    >
                                        {editingCategoryId === category.id ? (
                                            // Edit mode
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editCategoryName}
                                                        onChange={(e) => setEditCategoryName(e.target.value)}
                                                        className="flex-1 px-3 py-1.5 bg-slate-900/80 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-400"
                                                    />
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                                        title="Kaydet"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-2 text-slate-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                                                        title="İptal"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Icon Selection in Edit */}
                                                <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-900/60 rounded-lg border border-slate-700/50 max-h-24 overflow-y-auto">
                                                    {AVAILABLE_CATEGORY_ICONS.map((iconItem) => {
                                                        const IconComp = getCategoryIcon(iconItem.name);
                                                        const isSelected = editCategoryIcon === iconItem.name;
                                                        return (
                                                            <button
                                                                key={iconItem.name}
                                                                type="button"
                                                                onClick={() => setEditCategoryIcon(iconItem.name)}
                                                                title={iconItem.label}
                                                                className={`p-1.5 rounded flex items-center justify-center border transition-all ${
                                                                    isSelected
                                                                        ? 'bg-indigo-500/30 border-indigo-400 text-cyan-300'
                                                                        : 'border-transparent text-slate-400 hover:text-slate-200'
                                                                }`}
                                                            >
                                                                <IconComp className="w-3.5 h-3.5" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Color Selection in Edit */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {COLOR_PALETTE.map((color) => (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            onClick={() => setEditCategoryColor(color)}
                                                            className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
                                                                editCategoryColor === color ? 'border-white scale-110 shadow-sm' : 'border-transparent'
                                                            }`}
                                                            style={{ backgroundColor: color }}
                                                        >
                                                            {editCategoryColor === color && <Check className="w-3 h-3 text-white" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            // View mode
                                            <>
                                                {/* Reorder Buttons */}
                                                <div className="flex flex-col gap-0.5">
                                                    <button
                                                        onClick={() => moveCategory(category.id, 'up')}
                                                        disabled={isFirst}
                                                        className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-500 rounded transition-colors"
                                                        title="Yukarı Taşı"
                                                    >
                                                        <ArrowUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => moveCategory(category.id, 'down')}
                                                        disabled={isLast}
                                                        className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-500 rounded transition-colors"
                                                        title="Aşağı Taşı"
                                                    >
                                                        <ArrowDown className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Icon Badge */}
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                                                    style={{ backgroundColor: category.color }}
                                                >
                                                    <IconComponent className="w-4 h-4" />
                                                </div>

                                                {/* Category Name & Tags */}
                                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                                    <span className="text-slate-200 font-medium truncate">{category.name}</span>
                                                    {category.isDefault && (
                                                        <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-700/60 rounded">
                                                            Varsayılan
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleStartEdit(category)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-lg transition-colors"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {!category.isDefault && (
                                                        <button
                                                            onClick={() => handleDeleteCategory(category.id)}
                                                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                                                            title="Sil"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <p className="text-xs text-slate-500 mt-4">
                            💡 <strong>İpucu:</strong> Ok butonlarını (⬆️/⬇️) kullanarak listelerinizin yan bardaki sırasını anında değiştirebilir, simgelerini ve renklerini dilediğiniz gibi düzenleyebilirsiniz.
                        </p>
                    </div>

                    {/* Completed Tasks Setting */}
                    <div className="glass-panel p-6">
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">
                            Tamamlanan Görevler
                        </h2>
                        <div className="space-y-4">
                            <Checkbox
                                checked={settings.showCompletedByDefault}
                                onChange={handleShowCompletedChange}
                                label="Varsayılan olarak tamamlanan görevleri göster"
                            />
                            <p className="text-sm text-slate-500">
                                Bu ayar, uygulama açıldığında "Tamamlananları göster" toggle'ının başlangıç değerini belirler.
                            </p>
                        </div>
                    </div>

                    {/* Week Start Setting */}
                    <div className="glass-panel p-6">
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">
                            Hafta Başlangıcı
                        </h2>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="weekStart"
                                    checked={settings.weekStartsOn === 1}
                                    onChange={() => handleWeekStartChange(1)}
                                    className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                />
                                <span className="text-slate-300">Pazartesi</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="weekStart"
                                    checked={settings.weekStartsOn === 0}
                                    onChange={() => handleWeekStartChange(0)}
                                    className="w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                />
                                <span className="text-slate-300">Pazar</span>
                            </label>
                            <p className="text-sm text-slate-500 mt-2">
                                Haftalık ve aylık takvim görünümlerinde haftanın hangi günle başlayacağını belirler.
                            </p>
                        </div>
                    </div>

                    {/* Reset Settings */}
                    <div className="glass-panel p-6">
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">
                            Ayarları Sıfırla
                        </h2>
                        <p className="text-sm text-slate-400 mb-4">
                            Tüm ayarları varsayılan değerlerine döndürür.
                        </p>
                        <Button variant="danger" onClick={resetSettings}>
                            <RotateCcw className="w-4 h-4" />
                            <span>Varsayılana Dön</span>
                        </Button>
                    </div>

                    {/* App Info */}
                    <div className="glass-panel p-6">
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">
                            Uygulama Hakkında
                        </h2>
                        <div className="space-y-2 text-sm text-slate-400">
                            <p><span className="text-slate-300">Uygulama:</span> Sanal Ajandam V2</p>
                            <p><span className="text-slate-300">Sürüm:</span> 1.0.0</p>
                            <p><span className="text-slate-300">Depolama:</span> Lokal / Bulut (Supabase)</p>
                            <p className="pt-2 text-xs text-slate-500">
                                Verileriniz güvende ve senkronize.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
