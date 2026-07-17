// Supabase-backed task repository.
import { supabase } from '../lib/supabaseClient';
import type { Task } from '../domain/types';

async function getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
}

// Convert nullable database fields and snake_case columns to the domain shape.
function mapToDomain(item: any): Task {
    return {
        id: item.id,
        title: item.title,
        description: item.description || undefined,
        category: item.category,
        status: item.status,
        priority: item.priority,
        color: item.color || undefined,
        startDate: item.startDate || item.start_date,
        endDate: item.end_date || undefined,
        startTime: item.start_time || undefined,
        endTime: item.end_time || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
    };
}

// Convert the domain shape to the database row format.
function mapToDb(task: Partial<Task>, userId: string) {
    return {
        // Preserve an existing ID; PostgreSQL generates one for new tasks.
        ...(task.id ? { id: task.id } : {}),
        user_id: userId,
        title: task.title,
        description: task.description,
        category: task.category,
        status: task.status,
        priority: task.priority,
        color: task.color,
        start_date: task.startDate,
        end_date: task.endDate,
        start_time: task.startTime,
        end_time: task.endTime,
        updated_at: new Date().toISOString(),
    };
}

/**
 * Create a new task
 */
export async function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const userId = await getCurrentUserId();

    const dbPayload = mapToDb(taskData, userId);

    const { data, error } = await supabase
        .from('tasks')
        .insert(dbPayload)
        .select()
        .single();

    if (error) {
        console.error('Error creating task:', error);
        throw error;
    }

    return mapToDomain(data);
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | undefined> {
    const userId = await getCurrentUserId();

    // Map only supplied domain fields to their database columns.
    const dbUpdates: any = {
        updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    // Preserve an explicit request to clear the optional color.
    if ('color' in updates) dbUpdates.color = updates.color || null;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;

    const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', userId) // Defense in depth in addition to RLS.
        .select()
        .single();

    if (error) {
        console.error('Error updating task:', error);
        return undefined;
    }

    return mapToDomain(data);
}

/**
 * Delete a task by ID
 */
export async function deleteTask(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting task:', error);
        return false;
    }
    return true;
}

/**
 * Get a task by ID
 */
export async function getTaskById(id: string): Promise<Task | undefined> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return undefined;
    return mapToDomain(data);
}

/**
 * Get all tasks
 */
export async function getAllTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('start_date', { ascending: true });

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    return (data || []).map(mapToDomain);
}

/**
 * Get tasks in date range
 * The hook applies the final client-side date filtering.
 */
export async function getTasksInDateRange(startDate: string, endDate: string): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        // Limit the candidate set to tasks that may overlap the requested interval.
        .or(`start_date.gte.${startDate},end_date.gte.${startDate}`)
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
        .order('start_date', { ascending: true });

    if (error) {
        console.error('Error fetching range tasks:', error);
        return [];
    }

    return (data || []).map(mapToDomain);
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(status: Task['status']): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', status)
        .order('start_date');

    if (error) return [];
    return (data || []).map(mapToDomain);
}

/**
 * Get tasks by category
 */
export async function getTasksByCategory(category: Task['category']): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('category', category);

    if (error) return [];
    return (data || []).map(mapToDomain);
}

/**
 * Search tasks
 */
export async function searchTasks(query: string): Promise<Task[]> {
    // Supabase has full text search, but simple ilike is easier for "title"
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .ilike('title', `%${query}%`);

    // Note: description search usually requires 'or' logic. 
    // .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

    if (error) return [];
    return (data || []).map(mapToDomain);
}

/**
 * Get completed tasks
 */
export async function getCompletedTasks(): Promise<Task[]> {
    return getTasksByStatus('done');
}

/**
 * Update task status
 */
export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task | undefined> {
    return updateTask(id, { status });
}
