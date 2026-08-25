// Supabase-backed notes repository
import { supabase } from '../lib/supabaseClient';
import type { Note } from '../domain/types';

async function getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
}

// Convert database snake_case row to Note domain model
function mapToDomain(item: any): Note {
    return {
        id: item.id,
        title: item.title || '',
        content: item.content || '',
        color: item.color || undefined,
        isPinned: item.is_pinned ?? false,
        tags: item.tags || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
    };
}

// Convert Note domain model to database row
function mapToDb(note: Partial<Note>, userId: string) {
    return {
        ...(note.id ? { id: note.id } : {}),
        user_id: userId,
        title: note.title ?? '',
        content: note.content ?? '',
        color: note.color || null,
        is_pinned: note.isPinned ?? false,
        tags: note.tags || [],
        updated_at: new Date().toISOString(),
    };
}

/**
 * Get all notes for the authenticated user
 */
export async function getAllNotes(): Promise<Note[]> {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching notes:', error);
        throw error;
    }

    return (data || []).map(mapToDomain);
}

/**
 * Create a new note
 */
export async function createNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const userId = await getCurrentUserId();
    const dbPayload = mapToDb(noteData, userId);

    const { data, error } = await supabase
        .from('notes')
        .insert(dbPayload)
        .select()
        .single();

    if (error) {
        console.error('Error creating note:', error);
        throw error;
    }

    return mapToDomain(data);
}

/**
 * Update an existing note
 */
export async function updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note | undefined> {
    const userId = await getCurrentUserId();

    const dbUpdates: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if ('color' in updates) dbUpdates.color = updates.color || null;
    if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    const { data, error } = await supabase
        .from('notes')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating note:', error);
        throw error;
    }

    return mapToDomain(data);
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting note:', error);
        return false;
    }
    return true;
}

/**
 * Search notes by query with safe sanitization
 */
export async function searchNotes(query: string): Promise<Note[]> {
    // Sanitize query to prevent PostgREST .or() injection with commas/parentheses
    const sanitized = query.replace(/[,()"\\]/g, '').trim();
    if (!sanitized) {
        return getAllNotes();
    }

    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .or(`title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error searching notes:', error);
        return [];
    }

    return (data || []).map(mapToDomain);
}
