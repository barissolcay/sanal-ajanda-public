// TaskDetailPanel Component
import React from 'react';
import { clsx } from 'clsx';
import {
    Calendar as CalendarIcon,
    Clock,
    Tag,
    Flag,
    FileText,
    Edit3,
    Trash2,
    X,
    CheckCircle2,
    Circle,
    PlayCircle,
    XCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Task, TaskStatus } from '../../domain/types';
import { CATEGORY_INFO, PRIORITY_INFO, STATUS_INFO } from '../../domain/types';
import { formatDateRange, formatTimeRange, isOverdue } from '../../domain/dateUtils';
import { useCategories } from '../../hooks/useCategories';

export interface TaskDetailPanelProps {
    task: Task | null;
    onClose?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onStatusChange?: (status: TaskStatus) => void;
}

const statusActions: { status: TaskStatus; icon: React.ReactNode; label: string }[] = [
    { status: 'pending', icon: <Circle className="w-4 h-4" />, label: 'Bekliyor' },
    { status: 'in_progress', icon: <PlayCircle className="w-4 h-4" />, label: 'Devam Ediyor' },
    { status: 'done', icon: <CheckCircle2 className="w-4 h-4" />, label: 'Tamamla' },
    { status: 'cancelled', icon: <XCircle className="w-4 h-4" />, label: 'İptal Et' },
];

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
    task,
    onClose,
    onEdit,
    onDelete,
    onStatusChange,
}) => {
    const { getCategoryById } = useCategories();

    if (!task) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Detayları görmek için bir görev seçin</p>
                </div>
            </div>
        );
    }

    const overdue = isOverdue(task);
    // Dinamik kategorilerden adı al
    const dynamicCategory = getCategoryById(task.category);
    const categoryInfo = CATEGORY_INFO[task.category] || {
        label: dynamicCategory?.name || task.category,
        color: 'text-slate-300',
        bgColor: 'bg-slate-500/20'
    };
    // Eğer dinamik kategori varsa ve CATEGORY_INFO'da yoksa, adını kullan
    if (dynamicCategory && !CATEGORY_INFO[task.category]) {
        categoryInfo.label = dynamicCategory.name;
    }
    const priorityInfo = PRIORITY_INFO[task.priority];
    const statusInfo = STATUS_INFO[task.status];

    const getBadgeVariant = (category: Task['category']) => {
        switch (category) {
            case 'reading': return 'success';
            case 'watching': return 'purple';
            case 'goal': return 'amber';
            default: return 'default';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/60">
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-slate-800/60">
                <div className="flex-1 min-w-0 pr-4">
                    <h2 className={clsx(
                        'text-lg font-semibold text-slate-100',
                        task.status === 'done' && 'line-through opacity-60'
                    )}>
                        {task.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getBadgeVariant(task.category)}>
                            {categoryInfo.label}
                        </Badge>
                        <span className={clsx('text-sm', statusInfo.color)}>
                            {statusInfo.label}
                        </span>
                        {overdue && (
                            <Badge variant="danger">Gecikmiş</Badge>
                        )}
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Description */}
                {task.description && (
                    <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Açıklama
                        </h3>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">
                            {task.description}
                        </p>
                    </div>
                )}

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            Tarih
                        </h3>
                        <p className={clsx('text-sm', overdue ? 'text-red-400' : 'text-slate-300')}>
                            {formatDateRange(task.startDate, task.endDate)}
                        </p>
                    </div>

                    {(task.startTime || task.endTime) && (
                        <div>
                            <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Saat
                            </h3>
                            <p className="text-slate-300 text-sm">
                                {formatTimeRange(task.startTime, task.endTime)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Priority */}
                <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                        <Flag className="w-4 h-4" />
                        Öncelik
                    </h3>
                    <p className={clsx('text-sm', priorityInfo.color)}>
                        {priorityInfo.icon} {priorityInfo.label}
                    </p>
                </div>

                {/* Status Actions */}
                <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Durum Değiştir
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {statusActions.map(({ status, icon, label }) => (
                            <Button
                                key={status}
                                variant={task.status === status ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => onStatusChange?.(status)}
                            >
                                {icon}
                                <span>{label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 p-4 border-t border-slate-800/60">
                <Button variant="secondary" className="flex-1" onClick={onEdit}>
                    <Edit3 className="w-4 h-4" />
                    <span>Düzenle</span>
                </Button>
                <Button variant="danger" onClick={onDelete}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
