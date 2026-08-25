// TaskFormModal Component - Multi-Date, Continuous Range, Batch & Undated Support
import React, { useState, useEffect } from 'react';
import { X, Layers, Calendar, CalendarRange, ListPlus, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { Task, TaskStatus, TaskPriority } from '../../domain/types';
import { COLOR_PALETTE } from '../../domain/types';
import { toDateString, eachDayOfInterval, parseISO } from '../../domain/dateUtils';
import { useCategories } from '../../hooks/useCategories';

export interface TaskFormData {
    title: string;
    description: string;
    category: string;
    status: TaskStatus;
    priority: TaskPriority;
    color: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
}

export interface TaskFormModalProps {
    open?: boolean;
    isOpen?: boolean;
    task?: Task | null;
    initialData?: Partial<TaskFormData>;
    onClose: () => void;
    onSubmit: (data: TaskFormData) => Promise<void> | void;
    onSubmitBatch?: (tasksData: TaskFormData[]) => Promise<void> | void;
}

export type DateMode = 'single' | 'range_continuous' | 'range_separate' | 'undated';

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
    isOpen,
    task,
    initialData,
    onClose,
    onSubmit,
    onSubmitBatch,
}) => {
    const isModalOpen = open ?? isOpen ?? false;
    const { categories, getCategoryColor } = useCategories();

    // Mode: Single Form or Bulk Multi-Line Add
    const [creationTab, setCreationTab] = useState<'single' | 'bulk'>('single');

    // Date Mode: Single day, Multi-day Continuous Range, Multi-day Separate Batch, or Undated
    const [dateMode, setDateMode] = useState<DateMode>('single');
    const [rangeEndDate, setRangeEndDate] = useState<string>('');

    // Bulk text area
    const [bulkText, setBulkText] = useState('');
    const [bulkCategory, setBulkCategory] = useState('general');
    const [bulkPriority, setBulkPriority] = useState<TaskPriority>(0);
    const [bulkDate, setBulkDate] = useState(toDateString(new Date()));

    const [formData, setFormData] = useState<TaskFormData>(getDefaultFormData());
    const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData | 'rangeEndDate' | 'bulkText', string>>>({});
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditing = !!task;

    const categoryOptions = categories.map(cat => ({
        value: cat.id,
        label: cat.name,
    }));

    useEffect(() => {
        if (isModalOpen) {
            if (task) {
                const hasRange = Boolean(task.startDate && task.endDate && task.endDate !== task.startDate);
                setFormData({
                    title: task.title,
                    description: task.description || '',
                    category: task.category,
                    status: task.status,
                    priority: task.priority,
                    color: task.color || '',
                    startDate: task.startDate || toDateString(new Date()),
                    endDate: task.endDate || '',
                    startTime: task.startTime || '',
                    endTime: task.endTime || '',
                });
                setDateMode(!task.startDate ? 'undated' : (hasRange ? 'range_continuous' : 'single'));
                setRangeEndDate('');
            } else if (initialData) {
                const hasRange = Boolean(initialData.startDate && initialData.endDate && initialData.endDate !== initialData.startDate);
                setFormData({
                    ...getDefaultFormData(),
                    ...initialData,
                    startDate: initialData.startDate || toDateString(new Date()),
                    endDate: initialData.endDate || '',
                });
                setDateMode(
                    initialData.startDate === undefined
                        ? 'undated'
                        : (hasRange ? 'range_continuous' : 'single')
                );
                setRangeEndDate('');
            } else {
                setFormData(getDefaultFormData());
                setDateMode('single');
                setRangeEndDate('');
            }
            setBulkText('');
            setCreationTab('single');
            setErrors({});
            setShowColorPicker(false);
            setIsSubmitting(false);
        }
    }, [isModalOpen, task, initialData]);

    useEffect(() => {
        if (!isModalOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, onClose]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof TaskFormData | 'rangeEndDate' | 'bulkText', string>> = {};

        if (creationTab === 'single') {
            if (!formData.title.trim()) {
                newErrors.title = 'Başlık zorunludur';
            }

            if (dateMode === 'single') {
                if (!formData.startDate) {
                    newErrors.startDate = 'Tarih seçiniz';
                }
            } else if (dateMode === 'range_continuous') {
                if (!formData.startDate) {
                    newErrors.startDate = 'Başlangıç tarihi seçiniz';
                }
                if (!formData.endDate) {
                    newErrors.endDate = 'Bitiş tarihi seçiniz';
                } else if (formData.startDate && formData.endDate < formData.startDate) {
                    newErrors.endDate = 'Bitiş tarihi başlangıçtan önce olamaz';
                }
            } else if (dateMode === 'range_separate') {
                if (!formData.startDate) {
                    newErrors.startDate = 'Başlangıç tarihi seçiniz';
                }
                if (!rangeEndDate) {
                    newErrors.rangeEndDate = 'Bitiş tarihi seçiniz';
                } else if (formData.startDate && rangeEndDate < formData.startDate) {
                    newErrors.rangeEndDate = 'Bitiş tarihi başlangıçtan önce olamaz';
                }
            }

            // Time validation
            if (formData.startTime && formData.endTime && formData.startTime > formData.endTime) {
                newErrors.endTime = 'Bitiş saati başlangıçtan önce olamaz';
            }
        } else {
            // Bulk validation
            if (!bulkText.trim()) {
                newErrors.bulkText = 'Lütfen en az bir görev satırı yazın';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFormSubmit = async (saveAndNew: boolean = false) => {
        if (!validate()) return;
        setIsSubmitting(true);

        try {
            if (creationTab === 'single') {
                if (dateMode === 'range_separate' && formData.startDate && rangeEndDate) {
                    // Generate independent tasks for each day in interval
                    const days = eachDayOfInterval({
                        start: parseISO(formData.startDate),
                        end: parseISO(rangeEndDate),
                    });

                    const tasksToCreate: TaskFormData[] = days.map((day: Date) => ({
                        ...formData,
                        startDate: toDateString(day),
                        endDate: undefined,
                    }));

                    if (onSubmitBatch) {
                        await onSubmitBatch(tasksToCreate);
                    } else {
                        for (const item of tasksToCreate) {
                            await onSubmit(item);
                        }
                    }
                } else if (dateMode === 'range_continuous') {
                    // Single continuous multi-day spanning task
                    const payload: TaskFormData = {
                        ...formData,
                        startDate: formData.startDate,
                        endDate: formData.endDate || formData.startDate,
                        startTime: formData.startTime || undefined,
                        endTime: formData.endTime || undefined,
                    };
                    await onSubmit(payload);
                } else if (dateMode === 'single') {
                    // Single 1-day task
                    const payload: TaskFormData = {
                        ...formData,
                        startDate: formData.startDate,
                        endDate: undefined,
                        startTime: formData.startTime || undefined,
                        endTime: formData.endTime || undefined,
                    };
                    await onSubmit(payload);
                } else {
                    // Undated / Backlog Plan
                    const payload: TaskFormData = {
                        ...formData,
                        startDate: undefined,
                        endDate: undefined,
                        startTime: undefined,
                        endTime: undefined,
                    };
                    await onSubmit(payload);
                }
            } else {
                // Bulk multi-line creation
                const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
                const batchTasks: TaskFormData[] = lines.map(line => ({
                    title: line,
                    description: '',
                    category: bulkCategory,
                    status: 'pending',
                    priority: bulkPriority,
                    color: '',
                    startDate: bulkDate || undefined,
                }));

                if (onSubmitBatch) {
                    await onSubmitBatch(batchTasks);
                } else {
                    for (const item of batchTasks) {
                        await onSubmit(item);
                    }
                }
            }

            if (saveAndNew) {
                setFormData(prev => ({
                    ...prev,
                    title: '',
                    description: '',
                }));
                setErrors({});
            } else {
                onClose();
            }
        } catch (error) {
            console.error('Error submitting task form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateField = <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleCategoryChange = (newCategory: string) => {
        setFormData((prev) => ({
            ...prev,
            category: newCategory,
            color: '',
        }));
    };

    const displayColor = formData.color || getCategoryColor(formData.category);

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isModalOpen]);

    if (!isModalOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="modal-overlay" onClick={onClose} />

            {/* Modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="task-form-modal-title"
            >
                <div className="glass-panel w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-700/80 bg-slate-900/95">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-800/80">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                                {isEditing ? <Calendar className="w-5 h-5" /> : (creationTab === 'single' ? <CalendarRange className="w-5 h-5" /> : <ListPlus className="w-5 h-5" />)}
                            </div>
                            <div>
                                <h2 id="task-form-modal-title" className="text-lg font-bold text-slate-100">
                                    {isEditing ? 'Görevi Düzenle' : (creationTab === 'single' ? 'Yeni Görev / Plan' : 'Hızlı Çoklu Görev Ekle')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {isEditing ? 'Görev detaylarını güncelleyin' : 'Ajandanıza tekli, sürekli aralıklı veya toplu görev ekleyin'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mode Toggle (Tekli vs Toplu) - Only when creating new */}
                    {!isEditing && (
                        <div className="flex border-b border-slate-800/80 bg-slate-950/40 p-1.5 gap-1.5 mx-6 mt-4 rounded-xl border">
                            <button
                                type="button"
                                onClick={() => setCreationTab('single')}
                                className={clsx(
                                    "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                                    creationTab === 'single'
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                )}
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Tekli / Aralıklı Form</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCreationTab('bulk')}
                                className={clsx(
                                    "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                                    creationTab === 'bulk'
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                )}
                            >
                                <ListPlus className="w-3.5 h-3.5" />
                                <span>Toplu Hızlı Ekle (Satır Satır)</span>
                            </button>
                        </div>
                    )}

                    {/* Single Task Form */}
                    {creationTab === 'single' ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleFormSubmit(false);
                            }}
                            className="p-6 space-y-4"
                        >
                            {/* Title */}
                            <Input
                                label="Görev Başlığı *"
                                value={formData.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="Örn: İş başvurusu yap / Raporu tamamla"
                                error={errors.title}
                                autoFocus
                            />

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Açıklama (İsteğe Bağlı)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    placeholder="Göreve dair notlar veya detaylar..."
                                    rows={2}
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-700/60 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 resize-none transition-all"
                                />
                            </div>

                            {/* Date Mode Selector */}
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Tarih Seçimi / Dağıtımı
                                </label>
                                <div className={clsx("grid gap-2", isEditing ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
                                    <button
                                        type="button"
                                        onClick={() => setDateMode('single')}
                                        className={clsx(
                                            "p-2.5 rounded-xl text-xs font-medium border text-center transition-all flex flex-col items-center gap-1",
                                            dateMode === 'single'
                                                ? "bg-indigo-600/25 text-indigo-200 border-indigo-500/70 shadow-sm ring-1 ring-indigo-500/40"
                                                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                                        )}
                                    >
                                        <Calendar className="w-4 h-4 text-indigo-400" />
                                        <span className="font-semibold">Tek Gün</span>
                                        <span className="text-[10px] text-slate-500">1 günlük görev</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDateMode('range_continuous');
                                            if (!formData.endDate && formData.startDate) {
                                                updateField('endDate', formData.startDate);
                                            }
                                        }}
                                        className={clsx(
                                            "p-2.5 rounded-xl text-xs font-medium border text-center transition-all flex flex-col items-center gap-1",
                                            dateMode === 'range_continuous'
                                                ? "bg-indigo-600/25 text-indigo-200 border-indigo-500/70 shadow-sm ring-1 ring-indigo-500/40"
                                                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                                        )}
                                    >
                                        <CalendarRange className="w-4 h-4 text-cyan-400" />
                                        <span className="font-semibold">Tarih Aralığı</span>
                                        <span className="text-[10px] text-slate-500">Tek sürekli görev</span>
                                    </button>

                                    {!isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDateMode('range_separate');
                                                if (!rangeEndDate && formData.startDate) {
                                                    setRangeEndDate(formData.startDate);
                                                }
                                            }}
                                            className={clsx(
                                                "p-2.5 rounded-xl text-xs font-medium border text-center transition-all flex flex-col items-center gap-1",
                                                dateMode === 'range_separate'
                                                    ? "bg-indigo-600/25 text-indigo-200 border-indigo-500/70 shadow-sm ring-1 ring-indigo-500/40"
                                                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                                            )}
                                        >
                                            <Layers className="w-4 h-4 text-amber-400" />
                                            <span className="font-semibold">Her Güne Ayrı</span>
                                            <span className="text-[10px] text-slate-500">Günlük ayrı görevler</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setDateMode('undated')}
                                        className={clsx(
                                            "p-2.5 rounded-xl text-xs font-medium border text-center transition-all flex flex-col items-center gap-1",
                                            dateMode === 'undated'
                                                ? "bg-indigo-600/25 text-indigo-200 border-indigo-500/70 shadow-sm ring-1 ring-indigo-500/40"
                                                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                                        )}
                                    >
                                        <Sparkles className="w-4 h-4 text-emerald-400" />
                                        <span className="font-semibold">Süresiz Plan</span>
                                        <span className="text-[10px] text-slate-500">Tarihsiz havuz</span>
                                    </button>
                                </div>
                            </div>

                            {/* Date inputs based on mode */}
                            {/* 1) Single Day */}
                            {dateMode === 'single' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        type="date"
                                        label="Tarih *"
                                        value={formData.startDate || ''}
                                        onChange={(e) => updateField('startDate', e.target.value)}
                                        error={errors.startDate}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            type="time"
                                            label="Başlangıç"
                                            value={formData.startTime || ''}
                                            onChange={(e) => updateField('startTime', e.target.value)}
                                        />
                                        <Input
                                            type="time"
                                            label="Bitiş"
                                            value={formData.endTime || ''}
                                            onChange={(e) => updateField('endTime', e.target.value)}
                                            error={errors.endTime}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 2) Multi-Day Single Continuous Task */}
                            {dateMode === 'range_continuous' && (
                                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
                                    <p className="text-[11px] text-cyan-300">
                                        📅 <strong>Sürekli Görev:</strong> Bu tarih aralığı boyunca takvimde tek bir görev olarak yer alır (Örn: 5 günlük proje, ödev, seyahat veya hatırlatma).
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            type="date"
                                            label="Başlangıç Tarihi *"
                                            value={formData.startDate || ''}
                                            onChange={(e) => updateField('startDate', e.target.value)}
                                            error={errors.startDate}
                                        />
                                        <Input
                                            type="date"
                                            label="Bitiş Tarihi *"
                                            value={formData.endDate || ''}
                                            onChange={(e) => updateField('endDate', e.target.value)}
                                            error={errors.endDate}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-cyan-500/20">
                                        <Input
                                            type="time"
                                            label="Başlangıç Saati (İsteğe Bağlı)"
                                            value={formData.startTime || ''}
                                            onChange={(e) => updateField('startTime', e.target.value)}
                                        />
                                        <Input
                                            type="time"
                                            label="Bitiş Saati (İsteğe Bağlı)"
                                            value={formData.endTime || ''}
                                            onChange={(e) => updateField('endTime', e.target.value)}
                                            error={errors.endTime}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 3) Batch Multi-Day Separate Tasks */}
                            {dateMode === 'range_separate' && (
                                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                                    <p className="text-[11px] text-indigo-300">
                                        ✨ <strong>Ayrı Görevler:</strong> Seçtiğin tarih aralığındaki her bir gün için bağımsız, ayrı birer görev oluşturulur (Örn: 5 günün her günü için günlük egzersiz/ilaç görevi).
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            type="date"
                                            label="Başlangıç Tarihi *"
                                            value={formData.startDate || ''}
                                            onChange={(e) => updateField('startDate', e.target.value)}
                                            error={errors.startDate}
                                        />
                                        <Input
                                            type="date"
                                            label="Bitiş Tarihi *"
                                            value={rangeEndDate}
                                            onChange={(e) => setRangeEndDate(e.target.value)}
                                            error={errors.rangeEndDate}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 4) Undated */}
                            {dateMode === 'undated' && (
                                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                                    <p className="text-xs text-slate-300">
                                        📌 <strong>Süresiz Plan:</strong> Bu görev takvim günlerinde yer almaz, <strong>Listeler &gt; Planlar / Süresiz</strong> sekmesinde saklanır.
                                    </p>
                                </div>
                            )}

                            {/* Category, Status, Priority */}
                            <div className="grid grid-cols-3 gap-3">
                                <Select
                                    label="Kategori"
                                    options={categoryOptions}
                                    value={formData.category}
                                    onChange={handleCategoryChange}
                                />

                                <Select
                                    label="Durum"
                                    options={statusOptions}
                                    value={formData.status}
                                    onChange={(value) => updateField('status', value as TaskStatus)}
                                />

                                <Select
                                    label="Öncelik"
                                    options={priorityOptions}
                                    value={String(formData.priority)}
                                    onChange={(value) => updateField('priority', Number(value) as TaskPriority)}
                                />
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Özel Renk (İsteğe Bağlı)
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                        className="px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-700/60 text-slate-200 flex items-center gap-2 text-xs hover:border-slate-600 transition-colors"
                                    >
                                        <div
                                            className="w-4 h-4 rounded-md border border-white/20"
                                            style={{ backgroundColor: displayColor }}
                                        />
                                        <span>{formData.color ? 'Özel Renk' : 'Kategori Rengi'}</span>
                                    </button>

                                    {showColorPicker && (
                                        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 animate-fadeIn">
                                            <button
                                                type="button"
                                                onClick={() => { updateField('color', ''); setShowColorPicker(false); }}
                                                className="w-5 h-5 rounded-md border border-slate-600 flex items-center justify-center text-[10px] text-slate-400"
                                                title="Sıfırla"
                                            >
                                                ✕
                                            </button>
                                            {COLOR_PALETTE.map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => { updateField('color', c); setShowColorPicker(false); }}
                                                    className="w-5 h-5 rounded-md transition-transform hover:scale-110"
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                                    İptal
                                </Button>

                                <div className="flex items-center gap-2">
                                    {!isEditing && (
                                        <button
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={() => handleFormSubmit(true)}
                                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
                                        >
                                            Kaydet & Yeni Ekle
                                        </button>
                                    )}

                                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                                        {isEditing ? 'Güncelle' : 'Oluştur'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        /* Bulk Multi-Line Creation */
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                    Görevleri Alt Alta Yazın *
                                </label>
                                <textarea
                                    value={bulkText}
                                    onChange={(e) => {
                                        setBulkText(e.target.value);
                                        if (errors.bulkText) setErrors(prev => ({ ...prev, bulkText: undefined }));
                                    }}
                                    placeholder={`Örnek:\nKitap oku\nFaturaları yatır\nAhmet'i ara\nMarket alışverişi yap`}
                                    rows={6}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs leading-relaxed focus:outline-none focus:border-indigo-500 font-mono resize-none"
                                />
                                {errors.bulkText && (
                                    <p className="text-xs text-red-400 mt-1">{errors.bulkText}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <Input
                                    type="date"
                                    label="Tarih"
                                    value={bulkDate}
                                    onChange={(e) => setBulkDate(e.target.value)}
                                />

                                <Select
                                    label="Kategori"
                                    options={categoryOptions}
                                    value={bulkCategory}
                                    onChange={setBulkCategory}
                                />

                                <Select
                                    label="Öncelik"
                                    options={priorityOptions}
                                    value={String(bulkPriority)}
                                    onChange={(val) => setBulkPriority(Number(val) as TaskPriority)}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                                    İptal
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    disabled={isSubmitting}
                                    onClick={() => handleFormSubmit(false)}
                                >
                                    {isSubmitting ? 'Oluşturuluyor...' : 'Tümünü Oluştur'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
