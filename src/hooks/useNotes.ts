// useNotes Hook - State management and optimistic updates for Notes
import { useState, useEffect, useCallback } from 'react';
import type { Note } from '../domain/types';
import * as noteRepository from '../data/noteRepository';

export interface UseNotesReturn {
    notes: Note[];
    loading: boolean;
    error: Error | null;
    createNote: (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
    updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<Note | undefined>;
    deleteNote: (id: string) => Promise<boolean>;
    togglePinNote: (id: string) => Promise<Note | undefined>;
    refreshNotes: () => Promise<void>;
}

function sortNotes(notesList: Note[]): Note[] {
    return [...notesList].sort((a, b) => {
        if (a.isPinned !== b.isPinned) {
            return a.isPinned ? -1 : 1;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
}

export function useNotes(): UseNotesReturn {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadNotes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await noteRepository.getAllNotes();
            setNotes(sortNotes(data));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load notes'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    const createNote = useCallback(async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newNote = await noteRepository.createNote(noteData);
            setNotes(prev => sortNotes([newNote, ...prev]));
            return newNote;
        } catch (err) {
            await loadNotes();
            throw err;
        }
    }, [loadNotes]);

    const updateNote = useCallback(async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
        try {
            // Optimistic update
            setNotes(prev => sortNotes(prev.map(note => note.id === id ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note)));

            const updated = await noteRepository.updateNote(id, updates);
            if (updated) {
                setNotes(prev => sortNotes(prev.map(note => note.id === id ? updated : note)));
            }
            return updated;
        } catch (err) {
            await loadNotes();
            throw err;
        }
    }, [loadNotes]);

    const deleteNote = useCallback(async (id: string) => {
        try {
            setNotes(prev => prev.filter(note => note.id !== id));
            const result = await noteRepository.deleteNote(id);
            if (!result) {
                await loadNotes();
            }
            return result;
        } catch (err) {
            await loadNotes();
            throw err;
        }
    }, [loadNotes]);

    const togglePinNote = useCallback(async (id: string) => {
        const note = notes.find(n => n.id === id);
        if (!note) return undefined;
        const newPinned = !note.isPinned;
        return updateNote(id, { isPinned: newPinned });
    }, [notes, updateNote]);

    return {
        notes,
        loading,
        error,
        createNote,
        updateNote,
        deleteNote,
        togglePinNote,
        refreshNotes: loadNotes,
    };
}
