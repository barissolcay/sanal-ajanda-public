// TaskFormModal Component
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { Task, TaskStatus, TaskPriority } from '../../domain/types';
import { COLOR_PALETTE } from '../../domain/types';
import { toDateString } from '../../domain/dateUtils';
import { useCategories } from '../../hooks/useCategories';

export interface TaskFormData {
    title: string;
    description: string;
    category: string;
    status: TaskStatus;
    priority: TaskPriority;
    color: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
}

export interface TaskFormModalProps {
    open: boolean;
    task?: Task | null;
    onClose: () => void;
    onSubmit: (data: TaskFormData) => void;
}

const statusOptions = [
    { value: 'pending', label: 'Bekliyor' },
    { value: 'in_progress', label: 'Devam Ediyor' },
    { value: 'done', label: 'Tamamlandı' },
    { value: 'cancelled', label: 'İptal Edildi' },
];

const priorityOptions = [
    { value: '0', label: 'Normal' },
    { value: '1', label: 'Düşük' },
    { value: '2', label: 'Yüksek' },
];

const getDefaultFormData = (): TaskFormData => ({
    title: '',
    description: '',
    category: 'general',
    status: 'pending',
    priority: 0,
    color: '',
    startDate: toDateString(new Date()),
    endDate: '',
    startTime: '',
    endTime: '',
});

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
    open,
    task,
    onClose,
    onSubmit,
}) => {
    const { categories, getCategoryColor } = useCategories();
    const [formData, setFormData] = useState<TaskFormData>(getDefaultFormData());
    const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
    const [showColorPicker, setShowColorPicker] = useState(false);

    const isEditing = !!task;

    // Convert categories to options
    const categoryOptions = categories.map(cat => ({
        value: cat.id,
        label: cat.name,
    }));

    useEffect(() => {
        if (open) {
            if (task) {
                setFormData({
                    title: task.title,
                    description: task.description || '',
                    category: task.category,
                    status: task.status,
                    priority: task.priority,
                    color: task.color || '',
                    startDate: task.startDate,
                    endDate: task.endDate || '',
                    startTime: task.startTime || '',
                    endTime: task.endTime || '',
                });
            } else {
                setFormData(getDefaultFormData());
            }
            setErrors({});
            setShowColorPicker(false);
        }
    }, [open, task]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Başlık zorunludur';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Başlangıç tarihi zorunludur';
        }

        if (formData.endDate && formData.endDate < formData.startDate) {
            newErrors.endDate = 'Bitiş tarihi başlangıçtan önce olamaz';
        }

        // Time validation: if same day, check if end time is after start time
        const isSameDay = !formData.endDate || formData.startDate === formData.endDate;
        if (isSameDay && formData.startTime && formData.endTime) {
            if (formData.startTime > formData.endTime) {
                newErrors.endTime = 'Bitiş saati başlangıç saatinden önce olamaz';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    const updateField = <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    // Get the display color (custom or category default)
    const displayColor = formData.color || getCategoryColor(formData.category);

    // Prevent body scroll
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-slate-800/60 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
                        <h2 className="text-lg font-semibold text-slate-100">
                            {isEditing ? 'Görevi Düzenle' : 'Yeni Görev'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <Input
                            label="Başlık *"
                            value={formData.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            error={errors.title}
                            placeholder="Görev başlığı..."
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Açıklama
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                placeholder="Görev açıklaması..."
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Kategori"
                                options={categoryOptions}
                                value={formData.category}
                                onChange={(value) => updateField('category', value)}
                            />

                            <Select
                                label="Durum"
                                options={statusOptions}
                                value={formData.status}
                                onChange={(value) => updateField('status', value as TaskStatus)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Öncelik"
                                options={priorityOptions}
                                value={String(formData.priority)}
                                onChange={(value) => updateField('priority', Number(value) as TaskPriority)}
                            />

                            {/* Color Picker */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Renk
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 flex items-center gap-3 hover:border-slate-600 transition-colors"
                                >
                                    <div
                                        className="w-6 h-6 rounded-lg border-2 border-white/20"
                                        style={{ backgroundColor: displayColor }}
                                    />
                                    <span className="text-sm">
                                        {formData.color ? 'Özel renk' : 'Kategori rengi'}
                                    </span>
                                </button>

                                {showColorPicker && (
                                    <div className="mt-2 p-3 bg-slate-800/90 rounded-xl border border-slate-700/60">
                                        <div className="flex flex-wrap gap-2">
                                            {/* Category default option */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    updateField('color', '');
                                                    setShowColorPicker(false);
                                                }}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${!formData.color ? 'border-white' : 'border-transparent'
                                                    }`}
                                                style={{ backgroundColor: getCategoryColor(formData.category) }}
                                                title="Kategori rengi"
                                            >
                                                {!formData.color && <Check className="w-4 h-4 text-white" />}
                                            </button>

                                            {/* Color palette */}
                                            {COLOR_PALETTE.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => {
                                                        updateField('color', color);
                                                        setShowColorPicker(false);
                                                    }}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${formData.color === color ? 'border-white' : 'border-transparent'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                >
                                                    {formData.color === color && <Check className="w-4 h-4 text-white" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="date"
                                label="Başlangıç Tarihi *"
                                value={formData.startDate}
                                onChange={(e) => updateField('startDate', e.target.value)}
                                error={errors.startDate}
                            />

                            <Input
                                type="date"
                                label="Bitiş Tarihi"
                                value={formData.endDate}
                                onChange={(e) => updateField('endDate', e.target.value)}
                                error={errors.endDate}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="time"
                                label="Başlangıç Saati"
                                value={formData.startTime}
                                onChange={(e) => updateField('startTime', e.target.value)}
                            />

                            <Input
                                type="time"
                                label="Bitiş Saati"
                                value={formData.endTime}
                                onChange={(e) => updateField('endTime', e.target.value)}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
                            <Button type="button" variant="ghost" onClick={onClose}>
                                İptal
                            </Button>
                            <Button type="submit" variant="primary">
                                {isEditing ? 'Güncelle' : 'Oluştur'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
