// SettingsPage - User preferences and category management
import React, { useState } from 'react';
import { TopBar } from '../components/nav/TopBar';
import { Checkbox } from '../components/ui/Checkbox';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useSettings } from '../hooks/useSettings';
import { useCategories } from '../hooks/useCategories';
import { RotateCcw, Plus, Trash2, Check, X, Edit2 } from 'lucide-react';
import { COLOR_PALETTE } from '../domain/types';
import type { Category } from '../domain/types';

export const SettingsPage: React.FC = () => {
    const { settings, updateSettings, resetSettings } = useSettings();
    const { categories, createCategory, updateCategory, deleteCategory } = useCategories();

    // New category form state
    const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(COLOR_PALETTE[0]);

    // Edit state
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryColor, setEditCategoryColor] = useState('');

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
                icon: 'List',
                isDefault: false,
            });
            setNewCategoryName('');
            setNewCategoryColor(COLOR_PALETTE[0]);
            setShowNewCategoryForm(false);
        }
    };

    const handleStartEdit = (category: Category) => {
        setEditingCategoryId(category.id);
        setEditCategoryName(category.name);
        setEditCategoryColor(category.color);
    };

    const handleSaveEdit = async () => {
        if (editingCategoryId && editCategoryName.trim()) {
            await updateCategory(editingCategoryId, {
                name: editCategoryName.trim(),
                color: editCategoryColor,
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



    return (
        <div className="flex flex-col h-full">
            <TopBar title="Ayarlar" />

            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Categories Management */}
                    <div className="glass-panel p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-100">
                                Listeler / Kategoriler
                            </h2>
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
                            <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/60">
                                <h3 className="text-sm font-medium text-slate-300 mb-3">Yeni Liste Oluştur</h3>
                                <div className="space-y-3">
                                    <Input
                                        label="Liste Adı"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Örn: Alışveriş Listesi"
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Renk</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COLOR_PALETTE.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setNewCategoryColor(color)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${newCategoryColor === color ? 'border-white' : 'border-transparent'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {newCategoryColor === color && <Check className="w-4 h-4 text-white" />}
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
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/40"
                                >
                                    {editingCategoryId === category.id ? (
                                        // Edit mode
                                        <>
                                            <div
                                                className="w-8 h-8 rounded-lg flex-shrink-0"
                                                style={{ backgroundColor: editCategoryColor }}
                                            />
                                            <input
                                                type="text"
                                                value={editCategoryName}
                                                onChange={(e) => setEditCategoryName(e.target.value)}
                                                className="flex-1 px-2 py-1 bg-slate-700 rounded text-slate-200 text-sm"
                                            />
                                            <div className="flex gap-1">
                                                {COLOR_PALETTE.slice(0, 6).map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setEditCategoryColor(color)}
                                                        className={`w-5 h-5 rounded border ${editCategoryColor === color ? 'border-white' : 'border-transparent'
                                                            }`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                onClick={handleSaveEdit}
                                                className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="p-1.5 text-slate-400 hover:bg-slate-700/60 rounded"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        // View mode
                                        <>
                                            <div
                                                className="w-8 h-8 rounded-lg flex-shrink-0"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <span className="flex-1 text-slate-200">{category.name}</span>
                                            {category.isDefault && (
                                                <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-700/50 rounded">
                                                    Varsayılan
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleStartEdit(category)}
                                                className="p-1.5 text-slate-400 hover:bg-slate-700/60 rounded"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {!category.isDefault && (
                                                <button
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <p className="text-sm text-slate-500 mt-4">
                            Özel listeler oluşturarak görevlerinizi daha iyi organize edebilirsiniz.
                            Varsayılan listeler silinemez ancak adları ve renkleri değiştirilebilir.
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
                            <p><span className="text-slate-300">Depolama:</span> IndexedDB (Lokal)</p>
                            <p className="pt-2 text-xs text-slate-500">
                                Tüm verileriniz yerel olarak tarayıcınızda saklanır. Herhangi bir sunucuya veri gönderilmez.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
