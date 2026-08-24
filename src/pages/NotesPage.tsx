// NotesPage - Personal digital notebook & scratchpad (Notlar)
import React, { useState, useMemo } from 'react';
import {
    Plus,
    Search,
    Pin,
    Trash2,
    Edit3,
    CalendarPlus,
    Tag,
    X,
    StickyNote,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useNotes } from '../hooks/useNotes';
import { useTasks } from '../hooks/useTasks';
import { TaskFormModal, type TaskFormData } from '../components/tasks/TaskFormModal';
import type { Note } from '../domain/types';
import { formatDate } from '../domain/dateUtils';

const DEFAULT_NOTE_COLORS = [
    '#6366f1', // Indigo
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#64748b', // Slate
];

export const NotesPage: React.FC = () => {
    const { notes, loading, createNote, updateNote, deleteNote, togglePinNote } = useNotes();
    const { createTask } = useTasks();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Modal state for creating/editing note
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    // Note form fields
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [color, setColor] = useState<string>(DEFAULT_NOTE_COLORS[0]);
    const [isPinned, setIsPinned] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // Convert Note to Task state
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [initialTaskData, setInitialTaskData] = useState<Partial<TaskFormData> | undefined>(undefined);

    // Collect all unique tags across notes
    const allTags = useMemo(() => {
        const set = new Set<string>();
        notes.forEach(n => {
            (n.tags || []).forEach(t => set.add(t));
        });
        return Array.from(set);
    }, [notes]);

    // Filter notes
    const filteredNotes = useMemo(() => {
        return notes.filter(n => {
            const matchesSearch = !searchQuery ||
                n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (n.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesTag = !selectedTag || (n.tags || []).includes(selectedTag);

            return matchesSearch && matchesTag;
        });
    }, [notes, searchQuery, selectedTag]);

    const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.isPinned), [filteredNotes]);
    const otherNotes = useMemo(() => filteredNotes.filter(n => !n.isPinned), [filteredNotes]);

    const openCreateModal = () => {
        setEditingNote(null);
        setTitle('');
        setContent('');
        setColor(DEFAULT_NOTE_COLORS[0]);
        setIsPinned(false);
        setTags([]);
        setTagInput('');
        setIsNoteModalOpen(true);
    };

    const openEditModal = (note: Note) => {
        setEditingNote(note);
        setTitle(note.title);
        setContent(note.content);
        setColor(note.color || DEFAULT_NOTE_COLORS[0]);
        setIsPinned(note.isPinned);
        setTags([...(note.tags || [])]);
        setTagInput('');
        setIsNoteModalOpen(true);
    };

    const handleAddTag = () => {
        const trimmed = tagInput.trim().replace(/^#/, '');
        if (trimmed && !tags.includes(trimmed)) {
            setTags(prev => [...prev, trimmed]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(prev => prev.filter(t => t !== tagToRemove));
    };

    const handleSaveNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() && !content.trim()) return;

        if (editingNote) {
            await updateNote(editingNote.id, {
                title: title.trim(),
                content: content.trim(),
                color,
                isPinned,
                tags,
            });
        } else {
            await createNote({
                title: title.trim() || 'İsimsiz Not',
                content: content.trim(),
                color,
                isPinned,
                tags,
            });
        }

        setIsNoteModalOpen(false);
    };
    const handleDeleteNote = async (id: string) => {
        if (window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
            await deleteNote(id);
        }
    };

    const handleConvertToTask = (note: Note) => {
        setInitialTaskData({
            title: note.title || 'Not Görevi',
            description: note.content || undefined,
            category: 'general',
            priority: 0,
            color: note.color,
        });
        setIsTaskModalOpen(true);
    };

    const handleCreateTaskFromNote = async (data: TaskFormData) => {
        await createTask({
            ...data,
            endDate: data.endDate || undefined,
            startTime: data.startTime || undefined,
            endTime: data.endTime || undefined,
        });
        setIsTaskModalOpen(false);
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="p-4 md:p-6 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <StickyNote className="w-6 h-6 text-indigo-400" />
                            <h1 className="text-xl md:text-2xl font-bold text-slate-100">
                                Notlar & Karalama Defteri
                            </h1>
                        </div>
                        <p className="text-xs md:text-sm text-slate-400 mt-1">
                            Öğrendiğin kelimeler, anılar, fikirler ve kişisel karalamaların için güvenli alanın.
                        </p>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Yeni Not</span>
                    </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Notlarda ara..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Quick Tag Filter Pills */}
                    {allTags.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                            <button
                                onClick={() => setSelectedTag(null)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                                    !selectedTag
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                                )}
                            >
                                Tümü
                            </button>
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                    className={clsx(
                                        "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1",
                                        selectedTag === tag
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                                    )}
                                >
                                    <Tag className="w-3 h-3" />
                                    <span>#{tag}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="p-4 md:p-6 pt-2 flex-1">
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                        Notlar yükleniyor...
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6 rounded-2xl border border-dashed border-slate-800">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                            <StickyNote className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-300 mb-1">
                            {searchQuery || selectedTag ? 'Eşleşen not bulunamadı' : 'Henüz not eklemediniz'}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mb-4">
                            {searchQuery || selectedTag
                                ? 'Arama kriterlerinizi temizleyerek tekrar deneyebilirsiniz.'
                                : 'Aklınıza gelen fikirleri, yeni öğrendiğiniz kelimeleri veya özel anılarınızı buraya kaydedebilirsiniz.'}
                        </p>
                        {!searchQuery && !selectedTag && (
                            <button
                                onClick={openCreateModal}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20"
                            >
                                İlk Notunu Oluştur
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Pinned Section */}
                        {pinnedNotes.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Pin className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Sabitlenenler ({pinnedNotes.length})
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pinnedNotes.map(note => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            onEdit={() => openEditModal(note)}
                                            onDelete={() => handleDeleteNote(note.id)}
                                            onTogglePin={() => togglePinNote(note.id)}
                                            onConvertToTask={() => handleConvertToTask(note)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Other Notes Section */}
                        {otherNotes.length > 0 && (
                            <div>
                                {pinnedNotes.length > 0 && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <StickyNote className="w-4 h-4 text-slate-400" />
                                        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            Diğer Notlar ({otherNotes.length})
                                        </h2>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {otherNotes.map(note => (
                                        <NoteCard
                                            key={note.id}
                                            note={note}
                                            onEdit={() => openEditModal(note)}
                                            onDelete={() => handleDeleteNote(note.id)}
                                            onTogglePin={() => togglePinNote(note.id)}
                                            onConvertToTask={() => handleConvertToTask(note)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Note Create / Edit Modal */}
            {isNoteModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsNoteModalOpen(false);
                    }}
                >
                    <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 relative overflow-hidden">
                        {/* Top glow accent */}
                        <div
                            className="absolute top-0 left-0 right-0 h-1.5"
                            style={{ backgroundColor: color }}
                        />

                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-100">
                                {editingNote ? 'Notu Düzenle' : 'Yeni Not Ekle'}
                            </h2>
                            <button
                                onClick={() => setIsNoteModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveNote} className="space-y-4">
                            {/* Title Input */}
                            <div>
                                <input
                                    type="text"
                                    placeholder="Not Başlığı (örn: Yeni İngilizce Kelime / 2024 Hatırası)"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-slate-100 placeholder-slate-500 font-medium text-sm focus:outline-none focus:border-indigo-500 transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Content Textarea */}
                            <div>
                                <textarea
                                    placeholder="Not içeriğini buraya yaz..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm leading-relaxed focus:outline-none focus:border-indigo-500 transition-all resize-none"
                                />
                            </div>

                            {/* Tag Input */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    Etiketler
                                </label>
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Etiket yazıp ekle (örn: kelime, anı, fikir)"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTag}
                                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                                    >
                                        Ekle
                                    </button>
                                </div>

                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {tags.map(t => (
                                            <span
                                                key={t}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30"
                                            >
                                                #{t}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(t)}
                                                    className="hover:text-red-400 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Color & Pin Options */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
                                {/* Color Picker */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">Renk:</span>
                                    <div className="flex items-center gap-1.5">
                                        {DEFAULT_NOTE_COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                className={clsx(
                                                    "w-6 h-6 rounded-full transition-transform",
                                                    color === c ? "scale-125 ring-2 ring-white" : "hover:scale-110 opacity-70 hover:opacity-100"
                                                )}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Pin Checkbox */}
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                                    <input
                                        type="checkbox"
                                        checked={isPinned}
                                        onChange={(e) => setIsPinned(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                                    />
                                    <Pin className={clsx("w-3.5 h-3.5", isPinned ? "text-amber-400 fill-amber-400" : "text-slate-400")} />
                                    <span>Başa Sabitle</span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsNoteModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                                >
                                    {editingNote ? 'Kaydet' : 'Notu Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Form Modal for Note-to-Task conversion */}
            <TaskFormModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSubmit={handleCreateTaskFromNote}
                initialData={initialTaskData}
            />
        </div>
    );
};

// Note Card Component
const NoteCard: React.FC<{
    note: Note;
    onEdit: () => void;
    onDelete: () => void;
    onTogglePin: () => void;
    onConvertToTask: () => void;
}> = ({ note, onEdit, onDelete, onTogglePin, onConvertToTask }) => {
    const cardColor = note.color || '#6366f1';

    return (
        <div
            className="group relative rounded-2xl p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl border flex flex-col justify-between"
            style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                borderColor: `${cardColor}40`,
                boxShadow: `0 4px 20px -2px ${cardColor}15`,
            }}
        >
            {/* Left accent border */}
            <div
                className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                style={{ backgroundColor: cardColor }}
            />

            <div>
                {/* Header: Title & Pin Button */}
                <div className="flex items-start justify-between gap-2 pl-2">
                    <h3
                        onClick={onEdit}
                        className="text-sm font-bold text-slate-100 cursor-pointer hover:text-indigo-300 transition-colors line-clamp-1 flex-1"
                    >
                        {note.title || 'İsimsiz Not'}
                    </h3>

                    <button
                        onClick={onTogglePin}
                        title={note.isPinned ? "Sabitlemeyi Kaldır" : "Başa Sabitle"}
                        className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors shrink-0"
                    >
                        <Pin className={clsx("w-3.5 h-3.5", note.isPinned ? "text-amber-400 fill-amber-400" : "")} />
                    </button>
                </div>

                {/* Content */}
                <p
                    onClick={onEdit}
                    className="text-xs text-slate-300 mt-2.5 whitespace-pre-wrap line-clamp-6 leading-relaxed pl-2 cursor-pointer"
                >
                    {note.content}
                </p>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pl-2">
                        {note.tags.map(tag => (
                            <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/50"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer / Action Toolbar */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60 pl-2">
                <span className="text-[10px] text-slate-500">
                    {formatDate(note.updatedAt || note.createdAt, 'd MMM yyyy')}
                </span>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onConvertToTask}
                        title="Bu notu takvimde göreve dönüştür"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                    >
                        <CalendarPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onEdit}
                        title="Düzenle"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onDelete}
                        title="Sil"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
